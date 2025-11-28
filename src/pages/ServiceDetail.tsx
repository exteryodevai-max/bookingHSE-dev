import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  StarIcon, 
  MapPinIcon, 
  CheckBadgeIcon,
  ClockIcon,
  DocumentTextIcon,
  UserGroupIcon,
  GlobeAltIcon,
  AcademicCapIcon,
  PhoneIcon
} from '@heroicons/react/24/solid';
import { HeartIcon, ShareIcon } from '@heroicons/react/24/outline';
import Layout from '../components/Layout/Layout';
import { db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ServiceWithProvider, Review, ProviderProfile } from '../types';
import toast from 'react-hot-toast';

// Utility function to extract URL from image object or return string as-is
const getImageUrl = (image: any): string => {
  if (!image) return '';
  
  // Se è già una stringa URL diretta (formato legacy), restituiscila
  if (typeof image === 'string') {
    // Se è un oggetto JSON serializzato come stringa, prova a parsarlo
    if (image.startsWith('{') && image.endsWith('}')) {
      try {
        const parsed = JSON.parse(image);
        // Gestisci oggetti complessi con varie proprietà
        if (parsed.url) return parsed.url;
        if (parsed.path) return parsed.path;
        if (parsed.src) return parsed.src;
        if (parsed.href) return parsed.href;
        // Se ha thumbnails, usa la prima disponibile
        if (parsed.thumbnails && Array.isArray(parsed.thumbnails) && parsed.thumbnails.length > 0) {
          const thumbnail = parsed.thumbnails[0];
          if (typeof thumbnail === 'string') return thumbnail;
          if (thumbnail.url) return thumbnail.url;
          if (thumbnail.path) return thumbnail.path;
        }
      } catch (e) {
        console.warn('Errore nel parsing dell\'immagine JSON:', e);
        return image; // Restituisci la stringa originale se il parsing fallisce
      }
    }
    return image; // Restituisci la stringa URL diretta
  }
  
  // Se è un oggetto con varie proprietà possibili
  if (typeof image === 'object' && image !== null) {
    // Prova le proprietà più comuni per l'URL
    if (image.url) return image.url;
    if (image.path) return image.path;
    if (image.src) return image.src;
    if (image.href) return image.href;
    
    // Se ha thumbnails, usa la prima disponibile
    if (image.thumbnails && Array.isArray(image.thumbnails) && image.thumbnails.length > 0) {
      const thumbnail = image.thumbnails[0];
      if (typeof thumbnail === 'string') return thumbnail;
      if (thumbnail && typeof thumbnail === 'object') {
        if (thumbnail.url) return thumbnail.url;
        if (thumbnail.path) return thumbnail.path;
        if (thumbnail.src) return thumbnail.src;
      }
    }
    
    // Se ha metadata con URL
    if (image.metadata && typeof image.metadata === 'object' && image.metadata.url) {
      return image.metadata.url;
    }
  }
  
  console.warn('Formato immagine non riconosciuto:', image);
  return '';
};

export default function ServiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [service, setService] = useState<ServiceWithProvider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const loadServiceDetails = useCallback(async () => {
    if (!id) {
      console.error('Service ID is missing');
      toast.error('ID servizio mancante');
      navigate('/search');
      return;
    }

    try {
      setLoading(true);
      const [serviceData, reviewsData] = await Promise.all([
        db.getServiceById(id),
        db.getReviewsByService(id)
      ]);
      
      setService(serviceData);
      setReviews(reviewsData);
    } catch (error) {
      console.error('Error loading service details:', error);
      toast.error('Errore nel caricamento del servizio');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadServiceDetails();
  }, [loadServiceDetails]);

  const handleBooking = () => {
    if (!user) {
      toast.error('Devi effettuare l\'accesso per prenotare');
      navigate('/auth/login');
      return;
    }
    navigate(`/services/${id}/book`);
  };

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      consultation_management: 'Consulenza & Gestione HSE',
      workplace_safety: 'Sicurezza sul Lavoro',
      training_education: 'Formazione & Addestramento',
      environment: 'Ambiente',
      occupational_health: 'Salute Occupazionale',
      emergency_crisis: 'Emergenza & Gestione Crisi',
      innovation_digital: 'Innovazione & Digital HSE',
      specialized_services: 'Servizi Specialistici',
    };
    return labels[category] || category;
  };

  const getPricingUnitLabel = (unit: string) => {
    const labels: Record<string, string> = {
      fixed: 'fisso',
      per_hour: '/ora',
      per_day: '/giorno',
      per_participant: '/partecipante',
      per_employee: '/dipendente',
    };
    return labels[unit] || '';
  };

  const getLocationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      on_site: 'Presso cliente',
      remote: 'Remoto',
      provider_location: 'Presso fornitore',
      flexible: 'Flessibile',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
            <div className="h-64 bg-gray-200 rounded mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
              <div className="space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Servizio non trovato</h1>
          <p className="text-gray-600 mb-8">Il servizio che stai cercando non esiste o è stato rimosso.</p>
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

  const displayedReviews = showAllReviews ? (reviews || []) : (reviews || []).slice(0, 3);
  const averageRating = reviews && reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-4">
            <li>
              <Link to="/" className="text-gray-500 hover:text-gray-700">Home</Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <Link to="/search" className="text-gray-500 hover:text-gray-700">Servizi</Link>
            </li>
            <li>
              <span className="text-gray-400">/</span>
            </li>
            <li>
              <span className="text-gray-900 font-medium">{getCategoryLabel(service.category)}</span>
            </li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Service Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-blue-100 text-blue-800 text-sm font-medium px-3 py-1 rounded-full">
                  {getCategoryLabel(service.category)}
                </span>
                {service.featured && (
                  <span className="bg-yellow-100 text-yellow-800 text-sm font-medium px-3 py-1 rounded-full">
                    In evidenza
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{service.title}</h1>
              
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                <div className="flex items-center">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {service.service_areas.join(', ')}
                </div>
                <div className="flex items-center">
                  <GlobeAltIcon className="h-4 w-4 mr-1" />
                  {getLocationTypeLabel(service.location_type)}
                </div>
                {service.duration_hours && (
                  <div className="flex items-center">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    {service.duration_hours}h
                  </div>
                )}
                {service.max_participants && (
                  <div className="flex items-center">
                    <UserGroupIcon className="h-4 w-4 mr-1" />
                    Max {service.max_participants} partecipanti
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {averageRating > 0 && (
                    <div className="flex items-center">
                      <StarIcon className="h-5 w-5 text-yellow-400 mr-1" />
                      <span className="font-semibold">{averageRating.toFixed(1)}</span>
                      <span className="text-gray-500 ml-1">({reviews ? reviews.length : 0} recensioni)</span>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                    <HeartIcon className="h-5 w-5" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-blue-500 transition-colors">
                    <ShareIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Image Gallery */}
            {service.images && service.images.length > 0 && (
              <div className="mb-8">
                <div className="mb-4">
                  <img
                    src={getImageUrl(service.images[selectedImage])}
                    alt={service.title}
                    className="w-full h-64 md:h-96 object-cover rounded-lg"
                  />
                </div>
                {service.images && service.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {(service.images || []).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 ${
                          selectedImage === index ? 'border-blue-500' : 'border-gray-200'
                        }`}
                      >
                        <img
                          src={getImageUrl(image)}
                          alt={`${service.title} ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Service Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Descrizione del Servizio</h2>
              <div className="prose max-w-none">
                <p className="text-gray-700 mb-4">{service.description}</p>
                {service.detailed_description && (
                  <div className="text-gray-700 whitespace-pre-line">
                    {service.detailed_description}
                  </div>
                )}
              </div>
            </div>

            {/* Service Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {/* Deliverables */}
              {service.deliverables && service.deliverables.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Cosa Include</h3>
                  <ul className="space-y-2">
                    {(service.deliverables || []).map((deliverable, index) => (
                      <li key={index} className="flex items-start">
                        <CheckBadgeIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{deliverable}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Requirements */}
              {service.requirements && service.requirements.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Requisiti</h3>
                  <ul className="space-y-2">
                    {(service.requirements || []).map((requirement, index) => (
                      <li key={index} className="flex items-start">
                        <DocumentTextIcon className="h-5 w-5 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <span className="text-gray-700">{requirement.name}</span>
                          {requirement.mandatory && (
                            <span className="text-red-500 text-sm ml-1">(Obbligatorio)</span>
                          )}
                          {requirement.description && (
                            <p className="text-sm text-gray-500 mt-1">{requirement.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Certifications */}
              {service.certifications_provided && service.certifications_provided.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Certificazioni Rilasciate</h3>
                  <ul className="space-y-2">
                    {(service.certifications_provided || []).map((cert, index) => (
                      <li key={index} className="flex items-start">
                        <AcademicCapIcon className="h-5 w-5 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{cert}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Languages */}
              {service.languages && service.languages.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Lingue Disponibili</h3>
                  <div className="flex flex-wrap gap-2">
                    {(service.languages || []).map((language, index) => (
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
            </div>

            {/* Provider Info */}
            <div className="bg-gray-50 rounded-xl p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Informazioni Fornitore</h2>
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-xl">
                    {(
                      ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                        ?? service.provider.profile)?.business_name?.charAt(0)
                    ) || 'P'}
                  </span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {(
                        ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                          ?? service.provider.profile)?.business_name
                      ) || 'Fornitore'}
                  </h3>
                  {(
                    ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                      ?? service.provider.profile)?.verified
                  ) && (
                      <CheckBadgeIcon className="h-6 w-6 text-green-500" />
                    )}
                  </div>
                  
                  <p className="text-gray-600 mb-3">
                    {(
                      ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                        ?? service.provider.profile)?.description
                    )}
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">Esperienza:</span>
                      <span className="text-gray-600 ml-1">
                        {(
                          ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                            ?? service.provider.profile)?.experience_years || 0
                        )} anni
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">Team:</span>
                      <span className="text-gray-600 ml-1">
                        {(
                          ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                            ?? service.provider.profile)?.team_size || 1
                        )} persone
                      </span>
                    </div>
                    <div className="flex items-center">
                      <PhoneIcon className="h-4 w-4 text-gray-400 mr-1" />
                      <span className="text-gray-600">
                        {(
                          ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                            ?? service.provider.profile)?.phone || service.provider.phone
                        )}
                      </span>
                      </div>
                      {(
                        ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                          ?? service.provider.profile)?.website
                      ) && (
                        <div className="flex items-center gap-2">
                          <GlobeAltIcon className="h-4 w-4 text-gray-400" />
                          <a 
                            href={(
                              ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                                ?? service.provider.profile) as ProviderProfile
                            ).website!}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700"
                        >
                          Sito web
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Specializations */}
                  {(() => {
                    const profile = ((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                      ?? service.provider.profile);
                    return profile?.specializations && profile.specializations.length > 0;
                  })() && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Specializzazioni</h4>
                      <div className="flex flex-wrap gap-2">
                        {(((service.provider as unknown as { provider_profile?: ProviderProfile }).provider_profile
                          ?? service.provider.profile)?.specializations || []).map((spec: string, index: number) => (
                          <span
                            key={index}
                            className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs"
                          >
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Reviews */}
            {reviews && reviews.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Recensioni ({reviews.length})
                  </h2>
                  {reviews.length > 3 && (
                    <button
                      onClick={() => setShowAllReviews(!showAllReviews)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      {showAllReviews ? 'Mostra meno' : 'Mostra tutte'}
                    </button>
                  )}
                </div>

                <div className="space-y-6">
                  {displayedReviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-gray-600 font-medium text-sm">
                            {review.reviewer?.company_name?.charAt(0) || review.reviewer?.first_name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-gray-900">
                              {review.reviewer?.company_name || `${review.reviewer?.first_name || ''} ${review.reviewer?.last_name || ''}`.trim() || 'Utente Anonimo'}
                            </span>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <StarIcon
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'text-yellow-400' : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-sm text-gray-500">
                              {new Date(review.created_at).toLocaleDateString('it-IT')}
                            </span>
                          </div>
                          {review.title && (
                            <h4 className="font-medium text-gray-900 mb-2">{review.title}</h4>
                          )}
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              {/* Pricing Card */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm mb-6">
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    €{service.pricing.base_price}
                  </div>
                  <div className="text-gray-500">
                    {getPricingUnitLabel(service.pricing.pricing_unit)}
                  </div>
                </div>

                {/* Additional Costs */}
                {service.pricing.additional_costs && service.pricing.additional_costs.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-3">Costi Aggiuntivi</h4>
                    <div className="space-y-2">
                      {(service.pricing.additional_costs || []).map((cost, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-gray-600">{cost.name}</span>
                          <span className="text-gray-900">
                            {cost.type === 'percentage' ? `${cost.amount}%` : `€${cost.amount}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Booking Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleBooking}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
                  >
                    {service.service_type === 'instant' ? 'Prenota Ora' : 'Richiedi Preventivo'}
                  </button>
                  
                  <button className="w-full bg-white hover:bg-gray-50 text-gray-700 font-medium py-3 px-4 rounded-lg border border-gray-300 transition-colors">
                    Contatta Fornitore
                  </button>
                </div>

                {/* Service Type Info */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-sm text-gray-600">
                    <ClockIcon className="h-4 w-4 mr-2" />
                    {service.service_type === 'instant' 
                      ? 'Conferma immediata' 
                      : 'Risposta entro 24h'
                    }
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Informazioni Rapide</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Categoria:</span>
                    <span className="text-gray-900">{getCategoryLabel(service.category)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Modalità:</span>
                    <span className="text-gray-900">{getLocationTypeLabel(service.location_type)}</span>
                  </div>
                  {service.duration_hours && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Durata:</span>
                      <span className="text-gray-900">{service.duration_hours}h</span>
                    </div>
                  )}
                  {service.max_participants && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Max partecipanti:</span>
                      <span className="text-gray-900">{service.max_participants}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zone servite:</span>
                    <span className="text-gray-900">{service.service_areas ? service.service_areas.length : 0}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}