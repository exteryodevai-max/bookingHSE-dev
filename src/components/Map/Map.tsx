import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix per le icone di Leaflet in Vite
delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: () => string })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface MapLocation {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
}

export interface MapProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  width?: string;
  markers?: MapLocation[];
  onLocationSelect?: (location: MapLocation) => void;
  showUserLocation?: boolean;
  className?: string;
}

// Componente per centrare la mappa su una posizione
function MapCenter({ center }: { center: [number, number] }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center);
  }, [center, map]);
  
  return null;
}

// Componente per gestire il click sulla mappa
function MapClickHandler({ onLocationSelect }: { onLocationSelect?: (location: MapLocation) => void }) {
  const map = useMap();
  
  useEffect(() => {
    if (!onLocationSelect) return;
    
    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationSelect({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    };
    
    map.on('click', handleClick);
    
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationSelect]);
  
  return null;
}

export default function Map({
  center = [41.9028, 12.4964], // Centro Italia
  zoom = 6,
  height = '400px',
  width = '100%',
  markers = [],
  onLocationSelect,
  showUserLocation = false,
  className = ''
}: MapProps) {
  const mapRef = useRef<L.Map | null>(null);
  
  // Ottieni configurazioni dall'environment
  const tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution = import.meta.env.VITE_MAP_ATTRIBUTION || '© OpenStreetMap contributors';
  
  // Geolocalizzazione utente
  useEffect(() => {
    if (showUserLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const userLocation: [number, number] = [
            position.coords.latitude,
            position.coords.longitude
          ];
          
          if (mapRef.current) {
            mapRef.current.setView(userLocation, 12);
          }
        },
        (error) => {
          console.warn('Geolocalizzazione non disponibile:', error.message);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minuti
        }
      );
    }
  }, [showUserLocation]);
  
  return (
    <div className={`map-container ${className}`} style={{ height, width }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        ref={mapRef}
      >
        <TileLayer
          url={tileUrl}
          attribution={attribution}
        />
        
        <MapCenter center={center} />
        <MapClickHandler onLocationSelect={onLocationSelect} />
        
        {/* Markers */}
        {markers.map((marker, index) => (
          <Marker
            key={index}
            position={[marker.lat, marker.lng]}
          >
            {(marker.title || marker.description) && (
              <Popup>
                {marker.title && <h3 className="font-semibold">{marker.title}</h3>}
                {marker.description && <p>{marker.description}</p>}
              </Popup>
            )}
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}