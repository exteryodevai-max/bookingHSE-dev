import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { StarIcon, MapPinIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

// Memoized static data to avoid recreation on each render
const FEATURED_PROVIDERS_DATA = [
  {
    id: '1',
    business_name: 'HSE Consulting Milano',
    specializations: ['Consulenza DVR', 'ISO 45001', 'Formazione'],
    location: { city: 'Milano', province: 'MI' },
    rating_average: 4.9,
    reviews_count: 127,
    verified: true,
    experience_years: 15,
    completed_services: 450,
    image: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Specialisti in consulenza HSE per aziende manifatturiere e del terziario.',
    certifications: ['ISO 45001 Lead Auditor', 'RSPP Tutti i Settori'],
    starting_price: 800
  },
  {
    id: '2',
    business_name: 'SafeWork Training Center',
    specializations: ['Formazione Sicurezza', 'Corsi Antincendio', 'Primo Soccorso'],
    location: { city: 'Roma', province: 'RM' },
    rating_average: 4.8,
    reviews_count: 203,
    verified: true,
    experience_years: 12,
    completed_services: 1200,
    image: 'https://images.pexels.com/photos/3184360/pexels-photo-3184360.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Centro di formazione accreditato per tutti i corsi obbligatori di sicurezza.',
    certifications: ['Ente Accreditato Regione Lazio', 'Formatori Qualificati'],
    starting_price: 120
  },
  {
    id: '3',
    business_name: 'Dr. Marco Rossi - Medico Competente',
    specializations: ['Sorveglianza Sanitaria', 'Visite Mediche', 'Ergonomia'],
    location: { city: 'Torino', province: 'TO' },
    rating_average: 4.9,
    reviews_count: 89,
    verified: true,
    experience_years: 20,
    completed_services: 320,
    image: 'https://images.pexels.com/photos/5327580/pexels-photo-5327580.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Medico del lavoro specializzato in sorveglianza sanitaria aziendale.',
    certifications: ['Specialista Medicina del Lavoro', 'Medico Competente'],
    starting_price: 200
  },
  {
    id: '4',
    business_name: 'EcoAmbiente Solutions',
    specializations: ['Gestione Rifiuti', 'Autorizzazioni', 'Monitoraggi'],
    location: { city: 'Bologna', province: 'BO' },
    rating_average: 4.7,
    reviews_count: 156,
    verified: true,
    experience_years: 18,
    completed_services: 380,
    image: 'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg?auto=compress&cs=tinysrgb&w=400',
    description: 'Consulenza ambientale completa per industrie e PMI.',
    certifications: ['Consulente Ambientale', 'Esperto Gestione Rifiuti'],
    starting_price: 600
  }
];

const FeaturedProviders = memo(function FeaturedProviders() {
  const featuredProviders = useMemo(() => FEATURED_PROVIDERS_DATA, []);
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Fornitori in Evidenza
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Scopri alcuni dei nostri migliori fornitori HSE, selezionati per 
            la loro esperienza, professionalità e eccellenti recensioni dei clienti.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {featuredProviders.map((provider) => (
            <div
              key={provider.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-100"
            >
              {/* Provider Image */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={provider.image}
                  alt={provider.business_name}
                  className="w-full h-full object-cover"
                />
                {provider.verified && (
                  <div className="absolute top-3 right-3 bg-green-500 text-white p-1 rounded-full">
                    <CheckBadgeIcon className="h-5 w-5" />
                  </div>
                )}
              </div>

              <div className="p-6">
                {/* Provider Name & Location */}
                <div className="mb-3">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {provider.business_name}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPinIcon className="h-4 w-4 mr-1" />
                    {provider.location.city}, {provider.location.province}
                  </div>
                </div>

                {/* Rating */}
                <div className="flex items-center mb-3">
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span className="ml-1 text-sm font-medium text-gray-900">
                      {provider.rating_average}
                    </span>
                  </div>
                  <span className="ml-2 text-sm text-gray-500">
                    ({provider.reviews_count} recensioni)
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {provider.description}
                </p>

                {/* Specializations */}
                <div className="mb-4">
                  <div className="flex flex-wrap gap-1">
                    {provider.specializations.slice(0, 2).map((spec) => (
                      <span
                        key={spec}
                        className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                      >
                        {spec}
                      </span>
                    ))}
                    {provider.specializations.length > 2 && (
                      <span className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">
                        +{provider.specializations.length - 2}
                      </span>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex justify-between text-xs text-gray-500 mb-4">
                  <span>{provider.experience_years} anni esperienza</span>
                  <span>{provider.completed_services} servizi</span>
                </div>

                {/* Price & CTA */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-gray-500">Da </span>
                    <span className="text-lg font-bold text-gray-900">
                      €{provider.starting_price}
                    </span>
                  </div>
                  <Link
                    to={`/providers/${provider.id}`}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Vedi Profilo
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Sei un Fornitore HSE?
            </h3>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Unisciti alla nostra rete di fornitori verificati e raggiungi migliaia 
              di aziende che cercano i tuoi servizi. Registrazione gratuita e commissioni competitive.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/for-providers"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
              >
                Scopri i Vantaggi
              </Link>
              <Link
                to="/auth/register?type=provider"
                className="bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-3 rounded-lg border-2 border-blue-600 transition-colors duration-200"
              >
                Registrati Come Fornitore
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
});

export default FeaturedProviders;