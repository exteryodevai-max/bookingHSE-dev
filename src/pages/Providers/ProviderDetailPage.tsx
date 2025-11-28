import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  StarIcon,
  MapPinIcon,
  CheckBadgeIcon,
  PhoneIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/solid';
import Layout from '../../components/Layout/Layout';
import { db } from '../../lib/supabase';
import { User, Service } from '../../types';
import toast from 'react-hot-toast';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '../../lib/cache/cacheManager';

export default function ProviderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [provider, setProvider] = useState<User | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);

  const loadProviderData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Controlla se i dati sono in cache
      const cachedProvider = globalCache.get(CACHE_KEYS.PROVIDER_PROFILE(id!));
      const cachedServices = globalCache.get(CACHE_KEYS.PROVIDER_SERVICES(id!));
      
      if (cachedProvider && cachedServices) {
        console.log('[ProviderDetailPage] Utilizzando dati dalla cache');
        setProvider(cachedProvider);
        setServices(cachedServices);
        setLoading(false);
        return;
      }
      
      // Load provider details
      const providerData = await db.getUserById(id!);
      setProvider(providerData);
      
      // Load provider services
      const servicesData = await db.getServices({ provider_id: id });
      setServices(servicesData.services);
      
      // Salva i dati in cache
      globalCache.set(CACHE_KEYS.PROVIDER_PROFILE(id!), providerData, CACHE_TTL);
      globalCache.set(CACHE_KEYS.PROVIDER_SERVICES(id!), servicesData.services, CACHE_TTL);
      
      console.log('[ProviderDetailPage] Dati salvati in cache');
      
    } catch (error) {
      console.error('Error loading provider data:', error);
      toast.error('Errore nel caricamento dei dati del fornitore');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadProviderData();
    }
  }, [id, loadProviderData]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!provider || provider.user_type !== 'provider') {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Fornitore non trovato</h1>
          <p className="text-gray-600 mb-8">Il fornitore che stai cercando non esiste o non è disponibile.</p>
          <Link
            to="/search"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Torna alla Ricerca
          </Link>
        </div>
      </Layout>
    );
  }

  const profile = provider.provider_profile;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Provider Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-start gap-8">
            {/* Provider Avatar */}
            <div className="flex-shrink-0">
              <div className="w-32 h-32 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-4xl">
                  {profile.business_name.charAt(0)}
                </span>
              </div>
            </div>

            {/* Provider Info */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-4">
                <h1 className="text-3xl font-bold text-gray-900">{profile.business_name}</h1>
                {profile.verified && (
                  <CheckBadgeIcon className="h-8 w-8 text-green-500" />
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <MapPinIcon className="h-5 w-5 mr-2" />
                    {profile.address?.city}, {profile.address?.province}
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <PhoneIcon className="h-5 w-5 mr-2" />
                    {profile.phone}
                  </div>
                  
                  <div className="flex items-center text-gray-600">
                    <EnvelopeIcon className="h-5 w-5 mr-2" />
                    {profile.contact_person?.email}
                  </div>
                  
                  {profile.website && (
                    <div className="flex items-center text-gray-600">
                      <GlobeAltIcon className="h-5 w-5 mr-2" />
                      <a 
                        href={profile.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Sito web
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">{profile.experience_years} anni di esperienza</span>
                  </div>
                  
                  <div className="flex items-center">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                    <span className="text-gray-600">Team di {profile.team_size} persone</span>
                  </div>
                  
                  {profile.rating_average > 0 && (
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-2" />
                      <span className="font-semibold text-gray-900">{profile.rating_average.toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">({profile.reviews_count} recensioni)</span>
                    </div>
                  )}
                </div>
              </div>

              <p className="text-gray-700 text-lg leading-relaxed">{profile.description}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Specializations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Specializzazioni</h2>
              <div className="flex flex-wrap gap-2">
                {profile.specializations?.map((spec, index) => (
                  <span
                    key={index}
                    className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                  >
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            {/* Certifications */}
            {profile.certifications && profile.certifications.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">Certificazioni</h2>
                <div className="space-y-3">
                  {profile.certifications.map((cert, index) => (
                    <div key={index} className="flex items-start">
                      <AcademicCapIcon className="h-5 w-5 text-purple-500 mr-3 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-medium text-gray-900">{cert.name}</div>
                        <div className="text-sm text-gray-600">
                          {cert.issuer} - {cert.number}
                        </div>
                        <div className="text-sm text-gray-500">
                          Rilasciato: {new Date(cert.issue_date).toLocaleDateString('it-IT')}
                          {cert.expiry_date && (
                            <span> - Scade: {new Date(cert.expiry_date).toLocaleDateString('it-IT')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Services */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Servizi Offerti</h2>
              
              {services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {services.map((service) => (
                    <div key={service.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{service.description}</p>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-lg font-bold text-gray-900">
                          €{service.pricing.base_price}
                          <span className="text-sm font-normal text-gray-500 ml-1">
                            {service.pricing.pricing_unit === 'fixed' ? '' : `/${service.pricing.pricing_unit.replace('per_', '')}`}
                          </span>
                        </div>
                        
                        <Link
                          to={`/services/${service.id}`}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                        >
                          Dettagli
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">Nessun servizio disponibile al momento.</p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Contatta il Fornitore</h3>
              
              <div className="space-y-4">
                <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors">
                  Invia Messaggio
                </button>
                
                <button className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors">
                  Richiedi Preventivo
                </button>
              </div>
            </div>

            {/* Service Areas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Aree di Servizio</h3>
              <div className="space-y-2">
                {profile.service_areas?.map((area, index) => (
                  <div key={index} className="flex items-center">
                    <MapPinIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-700 text-sm">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Languages */}
            {profile.languages && profile.languages.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Lingue Parlate</h3>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((language, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {language}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Insurance */}
            {profile.insurance_coverage && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Copertura Assicurativa</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-900">Compagnia:</span>
                    <span className="text-gray-600 ml-1">{profile.insurance_coverage.provider}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Massimale:</span>
                    <span className="text-gray-600 ml-1">€{profile.insurance_coverage.coverage_amount.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">Scadenza:</span>
                    <span className="text-gray-600 ml-1">
                      {new Date(profile.insurance_coverage.expiry_date).toLocaleDateString('it-IT')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}