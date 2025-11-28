// Servizio di geocoding utilizzando Nominatim (OpenStreetMap)
// Gratuito e open source, ma con rate limiting

export interface GeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  importance: number;
  place_id: string;
}

interface NominatimApiResponse {
  lat: string;
  lon: string;
  display_name: string;
  address?: { [key: string]: string };
  importance?: string;
  place_id?: string;
}

export interface ReverseGeocodingResult {
  lat: number;
  lng: number;
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
}

class GeocodingService {
  private baseUrl: string;
  private rateLimitDelay: number;
  private lastRequestTime: number = 0;
  
  constructor() {
    this.baseUrl = import.meta.env.VITE_GEOCODING_URL || 'https://nominatim.openstreetmap.org';
    this.rateLimitDelay = parseInt(import.meta.env.VITE_GEOCODING_DELAY_MS) || 1000;
  }
  
  private async waitForRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    this.lastRequestTime = Date.now();
  }
  
  /**
   * Converte un indirizzo in coordinate geografiche
   */
  async geocode(address: string, options: {
    countryCode?: string;
    limit?: number;
    bounded?: boolean;
    viewbox?: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  } = {}): Promise<GeocodingResult[]> {
    await this.waitForRateLimit();
    
    const params = new URLSearchParams({
      q: address,
      format: 'json',
      addressdetails: '1',
      limit: (options.limit || 5).toString(),
      'accept-language': 'it,en'
    });
    
    if (options.countryCode) {
      params.append('countrycodes', options.countryCode);
    }
    
    if (options.bounded && options.viewbox) {
      params.append('bounded', '1');
      params.append('viewbox', options.viewbox.join(','));
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'User-Agent': 'BookingHSE/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Geocoding failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      return data.map((item: NominatimApiResponse) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        display_name: item.display_name,
        address: item.address || {},
        importance: parseFloat(item.importance || '0'),
        place_id: item.place_id
      }));
    } catch (error) {
      console.error('Geocoding error:', error);
      throw new Error('Impossibile geocodificare l\'indirizzo');
    }
  }
  
  /**
   * Converte coordinate geografiche in un indirizzo
   */
  async reverseGeocode(lat: number, lng: number, options: {
    zoom?: number;
  } = {}): Promise<ReverseGeocodingResult | null> {
    await this.waitForRateLimit();
    
    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lng.toString(),
      format: 'json',
      addressdetails: '1',
      zoom: (options.zoom || 18).toString(),
      'accept-language': 'it,en'
    });
    
    try {
      const response = await fetch(`${this.baseUrl}/reverse?${params}`, {
        headers: {
          'User-Agent': 'BookingHSE/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Reverse geocoding failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data || data.error) {
        return null;
      }
      
      return {
        lat: parseFloat(data.lat),
        lng: parseFloat(data.lon),
        display_name: data.display_name,
        address: data.address || {}
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      throw new Error('Impossibile ottenere l\'indirizzo dalle coordinate');
    }
  }
  
  /**
   * Cerca luoghi/indirizzi con autocompletamento
   */
  async searchPlaces(query: string, options: {
    countryCode?: string;
    limit?: number;
    types?: string[]; // es: ['city', 'town', 'village']
  } = {}): Promise<GeocodingResult[]> {
    if (query.length < 3) {
      return [];
    }
    
    await this.waitForRateLimit();
    
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      addressdetails: '1',
      limit: (options.limit || 10).toString(),
      'accept-language': 'it,en'
    });
    
    if (options.countryCode) {
      params.append('countrycodes', options.countryCode);
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/search?${params}`, {
        headers: {
          'User-Agent': 'BookingHSE/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Places search failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      let results = data.map((item: NominatimApiResponse) => ({
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        display_name: item.display_name,
        address: item.address || {},
        importance: parseFloat(item.importance || '0'),
        place_id: item.place_id
      }));
      
      // Filtra per tipo se specificato
      if (options.types && options.types.length > 0) {
        results = results.filter((result: GeocodingResult) => {
          return options.types!.some(t => result.display_name.toLowerCase().includes(t));
        });
      }
      
      return results;
    } catch (error) {
      console.error('Places search error:', error);
      throw new Error('Impossibile cercare i luoghi');
    }
  }
}

// Istanza singleton del servizio
export const geocodingService = new GeocodingService();

// Utility functions
export function formatAddress(address: GeocodingResult['address']): string {
  const parts = [];
  
  if (address.road) {
    let street = address.road;
    if (address.house_number) {
      street = `${street} ${address.house_number}`;
    }
    parts.push(street);
  }
  
  const city = address.city || address.town || address.village || address.municipality;
  if (city) {
    parts.push(city);
  }
  
  if (address.state && address.state !== city) {
    parts.push(address.state);
  }
  
  if (address.postcode) {
    parts.push(address.postcode);
  }
  
  return parts.join(', ');
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Raggio della Terra in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}