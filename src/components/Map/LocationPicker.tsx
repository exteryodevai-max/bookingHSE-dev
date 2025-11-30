import React, { useState, useEffect, useRef } from 'react';
import { MapPinIcon, MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { geocodingService, GeocodingResult, formatAddress } from '../../lib/geocoding';
import { useGeolocation } from '../../hooks/useGeolocation';
import Map, { MapLocation } from './Map';

export interface LocationPickerProps {
  value?: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  onChange: (location: {
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  }) => void;
  placeholder?: string;
  showMap?: boolean;
  mapHeight?: string;
  className?: string;
  required?: boolean;
  disabled?: boolean;
}

export default function LocationPicker({
  value,
  onChange,
  placeholder = "Inserisci un indirizzo o clicca sulla mappa",
  showMap = true,
  mapHeight = "300px",
  className = "",
  required = false,
  disabled = false
}: LocationPickerProps) {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState<GeocodingResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([41.9028, 12.4964]);
  const [mapMarkers, setMapMarkers] = useState<MapLocation[]>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  
  const { getCurrentPosition, loading: geoLoading, error: geoError, isSupported, permission } = useGeolocation();
  
  // Aggiorna input quando cambia il valore esterno (ma non durante la digitazione)
  useEffect(() => {
    // Solo se il valore esterno è diverso E l'input non ha il focus
    if (value?.address !== inputValue && document.activeElement !== inputRef.current) {
      setInputValue(value?.address || '');
    }
    
    if (value?.coordinates) {
      setMapCenter([value.coordinates.lat, value.coordinates.lng]);
      setMapMarkers([{
        lat: value.coordinates.lat,
        lng: value.coordinates.lng,
        title: value.address
      }]);
    }
  }, [value]); // Rimuovo inputValue dalle dipendenze per evitare il loop
  
  // Gestisce la ricerca con debounce
  const handleSearch = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setLoading(true);
    
    try {
      const results = await geocodingService.searchPlaces(query, {
        countryCode: 'it',
        limit: 5
      });
      
      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Errore nella ricerca:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce il cambiamento dell'input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Notifica il parent del valore digitato (anche senza coordinate)
    // Questo permette di cercare per nome città senza selezionare un suggerimento
    onChange({
      address: newValue,
      coordinates: undefined
    });

    // Cancella il timeout precedente
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Imposta un nuovo timeout per la ricerca suggerimenti
    searchTimeoutRef.current = setTimeout(() => {
      handleSearch(newValue);
    }, 300);
  };
  
  // Gestisce la selezione di un suggerimento
  const handleSuggestionSelect = (suggestion: GeocodingResult) => {
    const address = formatAddress(suggestion.address);
    setInputValue(address);
    setShowSuggestions(false);
    
    const location = {
      address,
      coordinates: {
        lat: suggestion.lat,
        lng: suggestion.lng
      }
    };
    
    onChange(location);
    setMapCenter([suggestion.lat, suggestion.lng]);
    setMapMarkers([{
      lat: suggestion.lat,
      lng: suggestion.lng,
      title: address
    }]);
  };
  
  // Gestisce il click sulla mappa
  const handleMapClick = async (location: MapLocation) => {
    try {
      setLoading(true);
      const result = await geocodingService.reverseGeocode(location.lat, location.lng);
      
      if (result) {
        const address = formatAddress(result.address);
        setInputValue(address);
        
        onChange({
          address,
          coordinates: {
            lat: location.lat,
            lng: location.lng
          }
        });
        
        setMapMarkers([{
          lat: location.lat,
          lng: location.lng,
          title: address
        }]);
      }
    } catch (error) {
      console.error('Errore nel reverse geocoding:', error);
      // Anche se il reverse geocoding fallisce, salviamo le coordinate
      const address = `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      setInputValue(address);
      
      onChange({
        address,
        coordinates: {
          lat: location.lat,
          lng: location.lng
        }
      });
      
      setMapMarkers([{
        lat: location.lat,
        lng: location.lng,
        title: address
      }]);
    } finally {
      setLoading(false);
    }
  };
  
  // Gestisce la geolocalizzazione
  const handleUseCurrentLocation = async () => {
    try {
      if (!isSupported) {
        return;
      }
      if (typeof navigator.permissions !== 'undefined') {
        try {
          const status = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          if (status.state === 'denied') {
            return;
          }
        } catch {}
      }
      const position = await getCurrentPosition();
      await handleMapClick({
        lat: position.coords.latitude,
        lng: position.coords.longitude
      });
      setMapCenter([position.coords.latitude, position.coords.longitude]);
    } catch (error) {
      console.error('Errore nella geolocalizzazione:', error);
    }
  };
  
  // Gestisce il click fuori dal componente
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  // Pulisce il timeout quando il componente viene smontato
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);
  
  return (
    <div className={`location-picker ${className}`}>
      {/* Input con suggerimenti */}
      <div className="relative">
        <div className="relative">
          <MapPinIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            className="w-full pl-10 pr-20 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          />
          
          {/* Pulsanti azione */}
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
            {/* Pulsante geolocalizzazione */}
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={disabled || geoLoading || !isSupported}
              className="p-1.5 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              title={isSupported ? 'Usa posizione attuale' : 'Geolocalizzazione non supportata'}
            >
              <MagnifyingGlassIcon className="h-4 w-4" />
            </button>
            
            {/* Pulsante cancella */}
            {inputValue && (
              <button
                type="button"
                onClick={() => {
                  setInputValue('');
                  setMapMarkers([]);
                  onChange({ address: '', coordinates: { lat: 0, lng: 0 } });
                }}
                disabled={disabled}
                className="p-1.5 text-gray-400 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Cancella"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        
        {/* Loading indicator */}
        {loading && (
          <div className="absolute right-12 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        
        {/* Suggerimenti */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.place_id || index}
                type="button"
                onClick={() => handleSuggestionSelect(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">
                  {formatAddress(suggestion.address)}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {suggestion.display_name}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
      
      {/* Mappa */}
      {showMap && (
        <div className="mt-4">
          <Map
            center={mapCenter}
            zoom={value?.coordinates ? 15 : 6}
            height={mapHeight}
            markers={mapMarkers}
            onLocationSelect={handleMapClick}
            className="rounded-lg border border-gray-300"
          />
        </div>
      )}
    </div>
  );
}