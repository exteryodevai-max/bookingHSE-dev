import { User, ProviderProfile, SearchFilters } from '../types';
import { calculateDistance } from './geocoding';

/**
 * Interfaccia per i risultati di ricerca geografica
 */
export interface GeoSearchResult {
  provider: User & { profile: ProviderProfile };
  distance: number; // distanza in km
  matchedServices: string[]; // servizi che corrispondono ai criteri
}

/**
 * Servizio per la ricerca geografica di provider
 */
export class GeoSearchService {
  /**
   * Filtra i provider in base alla posizione e al raggio
   */
  static filterByLocation(
    providers: (User & { profile: ProviderProfile })[],
    userCoordinates: { lat: number; lng: number },
    radiusKm: number = 50
  ): GeoSearchResult[] {
    const results: GeoSearchResult[] = [];

    providers.forEach(provider => {
      // Verifica se il provider ha coordinate
      if (!provider.provider_profile.address?.coordinates) {
        return;
      }

      const distance = calculateDistance(
        userCoordinates.lat,
        userCoordinates.lng,
        provider.provider_profile.address.coordinates.lat,
        provider.provider_profile.address.coordinates.lng
      );

      // Filtra per raggio
      if (distance <= radiusKm) {
        results.push({
          provider,
          distance,
          matchedServices: provider.provider_profile.specializations || []
        });
      }
    });

    // Ordina per distanza
    return results.sort((a, b) => a.distance - b.distance);
  }

  /**
   * Ricerca avanzata che combina filtri geografici e di servizio
   */
  static searchProviders(
    providers: Provider[],
    filters: SearchFilters
  ): GeoSearchResult[] {
    let filteredProviders = providers;

    // Filtro per query di testo
    if (filters.query) {
      const query = filters.query.toLowerCase();
      filteredProviders = filteredProviders.filter(provider => {
        const searchText = [
          provider.company_name,
          provider.description,
          ...(provider.services?.map(s => s.name) || []),
          ...(provider.services?.map(s => s.description) || [])
        ].join(' ').toLowerCase();
        
        return searchText.includes(query);
      });
    }

    // Filtro per categoria
    if (filters.category) {
      filteredProviders = filteredProviders.filter(provider => 
        provider.services?.some(service => service.category === filters.category)
      );
    }

    // Filtro per prezzo
    if (filters.price_min !== undefined || filters.price_max !== undefined) {
      filteredProviders = filteredProviders.filter(provider => {
        return provider.services?.some(service => {
          const price = service.price_range?.min || 0;
          const priceMax = service.price_range?.max || price;
          
          const minCheck = filters.price_min === undefined || price >= filters.price_min;
          const maxCheck = filters.price_max === undefined || priceMax <= filters.price_max;
          
          return minCheck && maxCheck;
        });
      });
    }

    // Filtro geografico
    if (filters.location?.coordinates) {
      const radiusKm = filters.location.radius_km || 50;
      return this.filterByLocation(
        filteredProviders,
        filters.location.coordinates,
        radiusKm
      );
    }

    // Se non ci sono coordinate, restituisci tutti i provider filtrati senza distanza
    return filteredProviders.map(provider => ({
      provider,
      distance: 0,
      matchedServices: provider.services?.map(s => s.name) || []
    }));
  }

  /**
   * Trova provider nelle vicinanze di una posizione specifica
   */
  static findNearbyProviders(
    providers: Provider[],
    coordinates: { lat: number; lng: number },
    radiusKm: number = 10,
    limit: number = 10
  ): GeoSearchResult[] {
    const results = this.filterByLocation(providers, coordinates, radiusKm);
    return results.slice(0, limit);
  }

  /**
   * Raggruppa i risultati per distanza
   */
  static groupByDistance(results: GeoSearchResult[]): {
    nearby: GeoSearchResult[]; // 0-10km
    close: GeoSearchResult[]; // 10-25km
    distant: GeoSearchResult[]; // 25km+
  } {
    return {
      nearby: results.filter(r => r.distance <= 10),
      close: results.filter(r => r.distance > 10 && r.distance <= 25),
      distant: results.filter(r => r.distance > 25)
    };
  }

  /**
   * Calcola statistiche sui risultati di ricerca
   */
  static getSearchStats(results: GeoSearchResult[]): {
    total: number;
    averageDistance: number;
    closestDistance: number;
    farthestDistance: number;
  } {
    if (results.length === 0) {
      return {
        total: 0,
        averageDistance: 0,
        closestDistance: 0,
        farthestDistance: 0
      };
    }

    const distances = results.map(r => r.distance);
    
    return {
      total: results.length,
      averageDistance: distances.reduce((a, b) => a + b, 0) / distances.length,
      closestDistance: Math.min(...distances),
      farthestDistance: Math.max(...distances)
    };
  }
}

/**
 * Hook personalizzato per la ricerca geografica
 */
export function useGeoSearch() {
  const searchProviders = (providers: Provider[], filters: SearchFilters) => {
    return GeoSearchService.searchProviders(providers, filters);
  };

  const findNearby = (
    providers: Provider[],
    coordinates: { lat: number; lng: number },
    radiusKm?: number,
    limit?: number
  ) => {
    return GeoSearchService.findNearbyProviders(providers, coordinates, radiusKm, limit);
  };

  return {
    searchProviders,
    findNearby,
    groupByDistance: GeoSearchService.groupByDistance,
    getSearchStats: GeoSearchService.getSearchStats
  };
}