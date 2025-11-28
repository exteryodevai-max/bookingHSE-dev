import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MagnifyingGlassIcon, MapPinIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function Hero() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione: almeno uno dei due campi deve essere compilato
    const trimmedQuery = searchQuery.trim();
    const trimmedLocation = location.trim();
    
    if (!trimmedQuery && !trimmedLocation) {
      toast.error('Inserisci almeno un servizio da cercare o una località');
      return;
    }
    
    const params = new URLSearchParams();
    if (trimmedQuery) params.set('q', trimmedQuery);
    if (trimmedLocation) params.set('location', trimmedLocation);
    navigate(`/search?${params.toString()}`);
  };

  const popularServices = [
    'Formazione Sicurezza',
    'Documento Valutazione Rischi',
    'Medico Competente',
    'Corso Antincendio',
    'Consulenza Ambiente',
    'Audit ISO 45001'
  ];

  const stats = [
    { label: 'Fornitori Verificati', value: '2,500+' },
    { label: 'Servizi Completati', value: '15,000+' },
    { label: 'Aziende Clienti', value: '5,000+' },
    { label: 'Città Coperte', value: '200+' },
  ];

  return (
    <div className="relative bg-gradient-to-br from-blue-50 via-white to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="text-center">
          {/* Main Heading */}
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
            Trova i migliori
            <span className="text-blue-600 block">servizi HSE</span>
            per la tua azienda
          </h1>
          
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            La piattaforma leader per prenotare consulenze, formazione e servizi 
            di sicurezza sul lavoro, ambiente e salute occupazionale. 
            Fornitori verificati, prezzi trasparenti, prenotazione immediata.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="max-w-4xl mx-auto mb-12">
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                {/* Service Search */}
                <div className="md:col-span-5">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Che servizio stai cercando?
                  </label>
                  <div className="relative">
                    <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="es. Formazione sicurezza, DVR, Medico competente..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Location Search */}
                <div className="md:col-span-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dove?
                  </label>
                  <div className="relative">
                    <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Città, provincia o regione"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Search Button */}
                <div className="md:col-span-3">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
                  >
                    Cerca Servizi
                  </button>
                </div>
              </div>
            </div>
          </form>

          {/* Popular Services */}
          <div className="mb-16">
            <p className="text-sm text-gray-600 mb-4">Servizi più richiesti:</p>
            <div className="flex flex-wrap justify-center gap-3">
              {popularServices.map((service) => (
                <button
                  key={service}
                  onClick={() => {
                    setSearchQuery(service);
                    const params = new URLSearchParams();
                    params.set('q', service);
                    if (location.trim()) params.set('location', location.trim());
                    navigate(`/search?${params.toString()}`);
                  }}
                  className="bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-600 px-4 py-2 rounded-full border border-gray-200 hover:border-blue-200 transition-all duration-200 text-sm font-medium"
                >
                  {service}
                </button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-gray-600">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}