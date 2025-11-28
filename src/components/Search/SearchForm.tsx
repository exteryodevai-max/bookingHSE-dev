import React, { useState, useCallback, memo } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { SearchFilters, ServiceCategory } from '../../types';
import LocationPicker from '../Map/LocationPicker';

interface SearchFormProps {
  initialFilters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  onSearch: () => void;
}

// Memoized service categories to prevent recreation on each render
const SERVICE_CATEGORIES = [
  { value: '', label: 'Tutte le categorie' },
  { value: 'consultation_management', label: 'Consulenza & Gestione HSE' },
  { value: 'workplace_safety', label: 'Sicurezza sul Lavoro' },
  { value: 'training_education', label: 'Formazione & Addestramento' },
  { value: 'environment', label: 'Ambiente' },
  { value: 'occupational_health', label: 'Salute Occupazionale' },
  { value: 'emergency_crisis', label: 'Emergenza & Gestione Crisi' },
  { value: 'innovation_digital', label: 'Innovazione & Digital HSE' },
  { value: 'specialized_services', label: 'Servizi Specialistici' },
];

const SearchForm = memo(function SearchForm({ initialFilters, onFiltersChange, onSearch }: SearchFormProps) {
  const [query, setQuery] = useState(initialFilters.query || '');
  const [location, setLocation] = useState({
    address: initialFilters.location.city || '',
    coordinates: initialFilters.location.coordinates
  });
  const [category, setCategory] = useState(initialFilters.category || '');

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // Validazione base: almeno uno tra query, location o category deve essere fornito
    const trimmedQuery = query.trim();
    const trimmedLocation = location.address.trim();
    const hasCategory = category && category !== '';
    
    if (!trimmedQuery && !trimmedLocation && !hasCategory) {
      return; // Non eseguire la ricerca se tutti i campi sono vuoti
    }
    
    onFiltersChange({
      query: trimmedQuery || undefined,
      location: {
        city: trimmedLocation || undefined,
        coordinates: location.coordinates,
        radius_km: 50 // Raggio predefinito di 50km
      },
      category: category as ServiceCategory || undefined,
    });
  }, [query, location, category, onFiltersChange, onSearch]);

  return (
    <form onSubmit={handleSubmit} className="w-full" role="search">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end search-form-grid">
          {/* Service Search */}
          <div className="md:col-span-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Servizio
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="es. Formazione sicurezza, DVR..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Location Search */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dove
            </label>
            <LocationPicker
              value={location.address ? location : { address: '', coordinates: undefined }}
              onChange={(newLocation) => setLocation(newLocation)}
              placeholder="Città, provincia..."
              showMap={false}
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {SERVICE_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Search Button */}
          <div className="md:col-span-2">
            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 shadow-sm hover:shadow-md search-form-button touch-target"
            >
              Cerca
            </button>
          </div>
        </div>
      </div>
    </form>
  );
});

export default SearchForm;