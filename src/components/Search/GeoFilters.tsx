import React from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { SearchFilters } from '../../types';

interface GeoFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: Partial<SearchFilters>) => void;
  showAdvanced?: boolean;
}

const radiusOptions = [
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50 km' },
  { value: 100, label: '100 km' },
  { value: 200, label: '200 km' },
];

export default function GeoFilters({ filters, onFiltersChange, showAdvanced = false }: GeoFiltersProps) {
  const handleRadiusChange = (radius: number) => {
    onFiltersChange({
      location: {
        ...filters.location,
        radius_km: radius
      }
    });
  };

  const hasLocation = filters.location?.coordinates;
  const currentRadius = filters.location?.radius_km || 50;

  if (!hasLocation && !showAdvanced) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center gap-2 mb-3">
        <MapPinIcon className="h-5 w-5 text-gray-500" />
        <h3 className="font-medium text-gray-900">Filtri Geografici</h3>
      </div>

      {hasLocation && (
        <div className="space-y-4">
          {/* Raggio di ricerca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raggio di ricerca
            </label>
            <div className="grid grid-cols-3 gap-2 geo-filters-grid">
              {radiusOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleRadiusChange(option.value)}
                  className={`px-3 py-2 text-sm rounded-lg border transition-colors radius-button touch-target ${
                    currentRadius === option.value
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Informazioni sulla posizione */}
          <div className="bg-blue-50 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <MapPinIcon className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-blue-900 font-medium">Posizione selezionata:</p>
                <p className="text-blue-700">
                  {filters.location.city || 'Coordinate personalizzate'}
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Ricerca entro {currentRadius} km
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!hasLocation && showAdvanced && (
        <div className="text-center py-4">
          <MapPinIcon className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Seleziona una posizione per abilitare i filtri geografici
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * Componente compatto per mostrare solo il selettore del raggio
 */
export function RadiusSelector({ filters, onFiltersChange }: Omit<GeoFiltersProps, 'showAdvanced'>) {
  const handleRadiusChange = (radius: number) => {
    onFiltersChange({
      location: {
        ...filters.location,
        radius_km: radius
      }
    });
  };

  const currentRadius = filters.location?.radius_km || 50;
  const hasLocation = filters.location?.coordinates;

  if (!hasLocation) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">Raggio:</span>
      <select
        value={currentRadius}
        onChange={(e) => handleRadiusChange(Number(e.target.value))}
        className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      >
        {radiusOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}