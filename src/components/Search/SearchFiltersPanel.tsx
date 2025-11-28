import React from 'react';
import { XMarkIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { SearchFilters } from '../../types';

interface SearchFiltersPanelProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  totalResults: number;
  show: boolean;
  onToggle: () => void;
}

export default function SearchFiltersPanel({
  filters,
  onFiltersChange,
  totalResults,
  show,
  onToggle
}: SearchFiltersPanelProps) {
  const priceRanges = [
    { label: 'Tutti i prezzi', min: undefined, max: undefined },
    { label: 'Fino a €200', min: undefined, max: 200 },
    { label: '€200 - €500', min: 200, max: 500 },
    { label: '€500 - €1.000', min: 500, max: 1000 },
    { label: '€1.000 - €2.000', min: 1000, max: 2000 },
    { label: 'Oltre €2.000', min: 2000, max: undefined },
  ];

  const serviceTypes = [
    { value: '', label: 'Tutti i tipi' },
    { value: 'instant', label: 'Prenotazione immediata' },
    { value: 'on_request', label: 'Su richiesta' },
  ];

  const availabilityOptions = [
    { value: '', label: 'Qualsiasi disponibilità' },
    { value: 'immediate', label: 'Disponibile subito' },
    { value: 'this_week', label: 'Questa settimana' },
    { value: 'this_month', label: 'Questo mese' },
  ];

  const languages = [
    'Italiano',
    'Inglese',
    'Francese',
    'Tedesco',
    'Spagnolo',
  ];

  const certifications = [
    'ISO 45001 Lead Auditor',
    'RSPP',
    'ASPP',
    'Medico Competente',
    'Formatore Qualificato',
    'Consulente Ambientale',
  ];

  const handlePriceRangeChange = (min?: number, max?: number) => {
    onFiltersChange({
      price_range: min !== undefined || max !== undefined ? { min: min || 0, max: max || 999999 } : undefined
    });
  };

  const clearFilters = () => {
    onFiltersChange({
      price_range: undefined,
      service_type: undefined,
      rating_min: undefined,
      availability: undefined,
      languages: undefined,
      certifications: undefined,
    });
  };

  return (
    <>
      {/* Mobile Filter Toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={onToggle}
          className="flex items-center justify-between w-full bg-white border border-gray-300 rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <span className="flex items-center">
            <AdjustmentsHorizontalIcon className="h-5 w-5 mr-2" />
            Filtri ({totalResults} risultati)
          </span>
          <XMarkIcon className={`h-5 w-5 transform transition-transform ${show ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Filters Panel */}
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${show || 'hidden lg:block'}`} role="region" aria-labelledby="filters-heading">
        <div className="flex items-center justify-between mb-6">
          <h3 id="filters-heading" className="text-lg font-semibold text-gray-900">Filtri</h3>
          <button
            onClick={clearFilters}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            aria-label="Cancella tutti i filtri"
          >
            Cancella tutto
          </button>
        </div>

        <div className="space-y-6">
          {/* Price Range */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Prezzo</h4>
            <div className="space-y-2" role="group" aria-labelledby="price-range-heading">
              {priceRanges.map((range, index) => (
                <label key={index} className="flex items-center">
                  <input
                    type="radio"
                    name="price_range"
                    checked={
                      (!filters.price_range && !range.min && !range.max) ||
                      (filters.price_range?.min === (range.min || 0) && 
                       filters.price_range?.max === (range.max || 999999))
                    }
                    onChange={() => handlePriceRangeChange(range.min, range.max)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{range.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Service Type */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Tipo di servizio</h4>
            <div className="space-y-2">
              {serviceTypes.map((type) => (
                <label key={type.value} className="flex items-center">
                  <input
                    type="radio"
                    name="service_type"
                    value={type.value}
                    checked={filters.service_type === type.value || (!filters.service_type && !type.value)}
                    onChange={(e) => onFiltersChange({ service_type: e.target.value || undefined })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{type.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Valutazione minima</h4>
            <div className="space-y-2" role="group" aria-labelledby="rating-heading">
              {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                <label key={rating} className="flex items-center">
                  <input
                    type="radio"
                    name="rating"
                    checked={filters.rating_min === rating}
                    onChange={() => onFiltersChange({ rating_min: rating })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                    aria-describedby={`rating-${rating}-label`}
                  />
                  <span id={`rating-${rating}-label`} className="ml-2 text-sm text-gray-700">
                    {rating}+ stelle
                  </span>
                </label>
              ))}
              <label className="flex items-center">
                <input
                  type="radio"
                  name="rating"
                  checked={!filters.rating_min}
                  onChange={() => onFiltersChange({ rating_min: undefined })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Tutte le valutazioni</span>
              </label>
            </div>
          </div>

          {/* Availability */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Disponibilità</h4>
            <div className="space-y-2" role="group" aria-labelledby="availability-heading">
              {availabilityOptions.map((option) => (
                <label key={option.value} className="flex items-center">
                  <input
                    type="radio"
                    name="availability"
                    value={option.value}
                    checked={filters.availability === option.value || (!filters.availability && !option.value)}
                    onChange={(e) => onFiltersChange({ availability: e.target.value || undefined })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="ml-2 text-sm text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Lingue</h4>
            <div className="space-y-2">
              {languages.map((language) => (
                <label key={language} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.languages?.includes(language) || false}
                    onChange={(e) => {
                      const currentLanguages = filters.languages || [];
                      const newLanguages = e.target.checked
                        ? [...currentLanguages, language]
                        : currentLanguages.filter(l => l !== language);
                      onFiltersChange({ languages: newLanguages.length > 0 ? newLanguages : undefined });
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{language}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Certifications */}
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-3">Certificazioni</h4>
            <div className="space-y-2">
              {certifications.map((cert) => (
                <label key={cert} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={filters.certifications?.includes(cert) || false}
                    onChange={(e) => {
                      const currentCerts = filters.certifications || [];
                      const newCerts = e.target.checked
                        ? [...currentCerts, cert]
                        : currentCerts.filter(c => c !== cert);
                      onFiltersChange({ certifications: newCerts.length > 0 ? newCerts : undefined });
                    }}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">{cert}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}