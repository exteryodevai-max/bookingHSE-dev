/**
 * API avanzate per la gestione dei servizi HSE
 * Include filtri complessi, ricerca geografica e categorizzazione
 */

import { supabase } from './supabase';
import type { Service, ServiceCategory, ServiceType, LocationType, PricingUnit } from '../types/service';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '../utils/cacheManager';

export interface ServiceFilters {
  // Filtri di base
  category?: ServiceCategory;
  subcategory?: string;
  serviceType?: ServiceType;
  locationType?: LocationType;
  
  // Filtri di prezzo
  minPrice?: number;
  maxPrice?: number;
  pricingUnit?: PricingUnit;
  
  // Filtri geografici
  latitude?: number;
  longitude?: number;
  radius?: number; // in km
  serviceAreas?: string[];
  
  // Filtri provider
  providerId?: string;
  minRating?: number;
  verifiedOnly?: boolean;
  
  // Filtri temporali
  availableFrom?: Date;
  availableTo?: Date;
  
  // Filtri di capacità
  minParticipants?: number;
  maxParticipants?: number;
  
  // Ricerca testuale
  searchQuery?: string;
  
  // Ordinamento
  sortBy?: 'price' | 'rating' | 'distance' | 'created_at' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  
  // Paginazione
  page?: number;
  limit?: number;
}

export interface ServiceSearchResult {
  services: Service[];
  total: number;
  page: number;
  totalPages: number;
  filters: ServiceFilters;
}

export interface ServiceStats {
  totalServices: number;
  averagePrice: number;
  categoriesCount: Record<ServiceCategory, number>;
  topProviders: Array<{
    providerId: string;
    providerName: string;
    servicesCount: number;
    averageRating: number;
  }>;
}

/**
 * Classe per la gestione avanzata dei servizi
 */
export class ServicesAPI {
  /**
   * Ricerca avanzata dei servizi con filtri complessi
   */
  static async searchServices(filters: ServiceFilters = {}): Promise<ServiceSearchResult> {
    try {
      let query = supabase
        .from('services')
        .select(`
          *,
          provider_profiles!inner(
            id,
            business_name,
            rating_average,
            verified,
            latitude,
            longitude,
            service_areas
          )
        `)
        .eq('active', true);

      // Filtri di base
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.subcategory) {
        query = query.eq('subcategory', filters.subcategory);
      }
      
      if (filters.serviceType) {
        query = query.eq('service_type', filters.serviceType);
      }
      
      if (filters.locationType) {
        query = query.eq('location_type', filters.locationType);
      }

      // Filtri di prezzo
      if (filters.minPrice !== undefined) {
        query = query.gte('base_price', filters.minPrice);
      }
      
      if (filters.maxPrice !== undefined) {
        query = query.lte('base_price', filters.maxPrice);
      }
      
      if (filters.pricingUnit) {
        query = query.eq('pricing_unit', filters.pricingUnit);
      }

      // Filtri provider
      if (filters.providerId) {
        query = query.eq('provider_id', filters.providerId);
      }
      
      if (filters.minRating !== undefined) {
        query = query.gte('provider_profiles.rating_average', filters.minRating);
      }
      
      if (filters.verifiedOnly) {
        query = query.eq('provider_profiles.verified', true);
      }

      // Filtri di capacità
      if (filters.minParticipants !== undefined) {
        query = query.gte('min_participants', filters.minParticipants);
      }
      
      if (filters.maxParticipants !== undefined) {
        query = query.lte('max_participants', filters.maxParticipants);
      }

      // Ricerca testuale
      if (filters.searchQuery) {
        const searchTerms = filters.searchQuery.toLowerCase().split(' ');
        const searchConditions = searchTerms.map(term => 
          `title.ilike.%${term}%,description.ilike.%${term}%,subcategory.ilike.%${term}%`
        ).join(',');
        query = query.or(searchConditions);
      }

      // Filtri geografici
      if (filters.serviceAreas && filters.serviceAreas.length > 0) {
        query = query.overlaps('service_areas', filters.serviceAreas);
      }

      // Ordinamento
      const sortBy = filters.sortBy || 'created_at';
      const sortOrder = filters.sortOrder || 'desc';
      
      if (sortBy === 'rating') {
        query = query.order('rating_average', { 
          ascending: sortOrder === 'asc',
          referencedTable: 'provider_profiles'
        });
      } else if (sortBy === 'distance' && filters.latitude && filters.longitude) {
        // Per la distanza, useremo una funzione PostGIS personalizzata
        query = query.rpc('services_by_distance', {
          lat: filters.latitude,
          lng: filters.longitude,
          radius_km: filters.radius || 50
        });
      } else {
        query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      }

      // Paginazione
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const offset = (page - 1) * limit;
      
      query = query.range(offset, offset + limit - 1);

      const { data: services, error, count } = await query;
      
      if (error) {
        console.error('Errore ricerca servizi:', error);
        throw new Error(`Errore ricerca servizi: ${error.message}`);
      }

      const total = count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        services: services || [],
        total,
        page,
        totalPages,
        filters
      };
    } catch (error) {
      console.error('Errore searchServices:', error);
      throw error;
    }
  }

  /**
   * Ricerca geografica dei servizi
   */
  static async searchServicesByLocation(
    latitude: number,
    longitude: number,
    radius: number = 50,
    additionalFilters: Omit<ServiceFilters, 'latitude' | 'longitude' | 'radius'> = {}
  ): Promise<ServiceSearchResult> {
    return this.searchServices({
      ...additionalFilters,
      latitude,
      longitude,
      radius,
      sortBy: 'distance'
    });
  }

  /**
   * Ottieni servizi per categoria con statistiche
   */
  static async getServicesByCategory(category: ServiceCategory): Promise<{
    services: Service[];
    stats: {
      totalServices: number;
      averagePrice: number;
      priceRange: { min: number; max: number };
      topSubcategories: Array<{ name: string; count: number }>;
    };
  }> {
    try {
      // Controlla se i dati sono in cache
      const cacheKey = `${CACHE_KEYS.CATEGORY_STATS}:${category}`;
      const cachedData = globalCache.get<{
        services: Service[];
        stats: {
          totalServices: number;
          averagePrice: number;
          priceRange: { min: number; max: number };
          topSubcategories: Array<{ name: string; count: number }>;
        };
      }>(cacheKey);
      
      if (cachedData) {
        console.log(`[Cache] Servizi per categoria ${category} recuperati dalla cache`);
        return cachedData;
      }

      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          provider_profiles!inner(
            business_name,
            rating_average,
            verified
          )
        `)
        .eq('category', category)
        .eq('active', true);

      if (error) throw error;

      const prices = services?.map(s => s.base_price) || [];
      const subcategories = services?.reduce((acc, service) => {
        const sub = service.subcategory || 'Altri';
        acc[sub] = (acc[sub] || 0) + 1;
        return acc;
      }, {} as Record<string, number>) || {};

      const stats = {
        totalServices: services?.length || 0,
        averagePrice: prices.length > 0 ? prices.reduce((a, b) => a + b, 0) / prices.length : 0,
        priceRange: {
          min: prices.length > 0 ? Math.min(...prices) : 0,
          max: prices.length > 0 ? Math.max(...prices) : 0
        },
        topSubcategories: Object.entries(subcategories)
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
      };

      const result = {
        services: services || [],
        stats
      };

      // Salva i dati in cache
      globalCache.set(cacheKey, result, CACHE_TTL);
      console.log(`[Cache] Servizi per categoria ${category} salvati in cache`);

      return result;
    } catch (error) {
      console.error('Errore getServicesByCategory:', error);
      throw error;
    }
  }

  /**
   * Ottieni statistiche generali dei servizi
   */
  static async getServicesStats(): Promise<ServiceStats> {
    try {
      // Controlla se i dati sono in cache
      const cacheKey = CACHE_KEYS.SERVICES_STATS;
      const cachedData = globalCache.get<ServiceStats>(cacheKey);
      
      if (cachedData) {
        console.log('[Cache] Statistiche servizi recuperate dalla cache');
        return cachedData;
      }

      const { data: services, error } = await supabase
        .from('services')
        .select(`
          *,
          provider_profiles!inner(
            business_name,
            rating_average
          )
        `)
        .eq('active', true);

      if (error) throw error;

      const totalServices = services?.length || 0;
      const averagePrice = services?.length > 0 
        ? services.reduce((sum, s) => sum + s.base_price, 0) / services.length 
        : 0;

      // Conteggio per categoria
      const categoriesCount = services?.reduce((acc, service) => {
        acc[service.category] = (acc[service.category] || 0) + 1;
        return acc;
      }, {} as Record<ServiceCategory, number>) || {} as Record<ServiceCategory, number>;

      // Top provider
      const providerStats = services?.reduce((acc, service) => {
        const providerId = service.provider_id;
        if (!acc[providerId]) {
          acc[providerId] = {
            providerId,
            providerName: service.provider_profiles?.business_name || 'N/A',
            servicesCount: 0,
            totalRating: 0,
            ratingCount: 0
          };
        }
        acc[providerId].servicesCount++;
        if (service.provider_profiles?.rating_average) {
          acc[providerId].totalRating += service.provider_profiles.rating_average;
          acc[providerId].ratingCount++;
        }
        return acc;
      }, {} as Record<string, {
        providerId: string;
        providerName: string;
        servicesCount: number;
        totalRating: number;
        ratingCount: number;
      }>) || {};

      const topProviders = Object.values(providerStats)
        .map((provider: {
          providerId: string;
          providerName: string;
          servicesCount: number;
          totalRating: number;
          ratingCount: number;
        }) => ({
          providerId: provider.providerId,
          providerName: provider.providerName,
          servicesCount: provider.servicesCount,
          averageRating: provider.ratingCount > 0 
            ? provider.totalRating / provider.ratingCount 
            : 0
        }))
        .sort((a, b) => b.servicesCount - a.servicesCount)
        .slice(0, 10);

      const result = {
        totalServices,
        averagePrice,
        categoriesCount,
        topProviders
      };

      // Salva i dati in cache
      globalCache.set(cacheKey, result, CACHE_TTL);
      console.log('[Cache] Statistiche servizi salvate in cache');

      return result;
    } catch (error) {
      console.error('Errore getServicesStats:', error);
      throw error;
    }
  }

  /**
   * Suggerimenti di ricerca basati su input parziale
   */
  static async getSearchSuggestions(query: string, limit: number = 10): Promise<{
    services: Array<{ id: string; title: string; category: string }>;
    categories: Array<{ category: ServiceCategory; count: number }>;
    providers: Array<{ id: string; name: string; servicesCount: number }>;
  }> {
    try {
      const searchTerm = query.toLowerCase();

      // Suggerimenti servizi
      const { data: services } = await supabase
        .from('services')
        .select('id, title, category')
        .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('active', true)
        .limit(limit);

      // Suggerimenti categorie
      const { data: categoryData } = await supabase
        .from('services')
        .select('category')
        .or(`title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%`)
        .eq('active', true);

      const categoriesCount = categoryData?.reduce((acc, item) => {
        acc[item.category] = (acc[item.category] || 0) + 1;
        return acc;
      }, {} as Record<ServiceCategory, number>) || {};

      const categories = Object.entries(categoriesCount)
        .map(([category, count]) => ({ category: category as ServiceCategory, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Suggerimenti provider
      const { data: providers } = await supabase
        .from('provider_profiles')
        .select(`
          id,
          business_name,
          services!inner(id)
        `)
        .ilike('business_name', `%${searchTerm}%`)
        .eq('verified', true)
        .limit(limit);

      const providerSuggestions = providers?.map(provider => ({
        id: provider.id,
        name: provider.business_name,
        servicesCount: provider.services?.length || 0
      })) || [];

      return {
        services: services || [],
        categories,
        providers: providerSuggestions
      };
    } catch (error) {
      console.error('Errore getSearchSuggestions:', error);
      throw error;
    }
  }

  /**
   * Servizi correlati basati su categoria e caratteristiche simili
   */
  static async getRelatedServices(
    serviceId: string,
    limit: number = 6
  ): Promise<Service[]> {
    try {
      // Prima ottieni il servizio di riferimento
      const { data: referenceService, error: refError } = await supabase
        .from('services')
        .select('category, subcategory, base_price, location_type')
        .eq('id', serviceId)
        .maybeSingle();

      if (refError || !referenceService) {
        throw new Error('Servizio di riferimento non trovato');
      }

      // Trova servizi simili
      const { data: relatedServices, error } = await supabase
        .from('services')
        .select(`
          *,
          provider_profiles!inner(
            business_name,
            rating_average,
            verified
          )
        `)
        .eq('category', referenceService.category)
        .eq('active', true)
        .neq('id', serviceId)
        .limit(limit * 2); // Prendiamo più risultati per poi filtrarli

      if (error) throw error;

      // Ordina per similarità (stesso subcategory, prezzo simile, ecc.)
      const scored = relatedServices?.map(service => {
        let score = 0;
        
        // Stesso subcategory
        if (service.subcategory === referenceService.subcategory) score += 3;
        
        // Prezzo simile (±30%)
        const priceDiff = Math.abs(service.base_price - referenceService.base_price);
        const priceThreshold = referenceService.base_price * 0.3;
        if (priceDiff <= priceThreshold) score += 2;
        
        // Stesso tipo di location
        if (service.location_type === referenceService.location_type) score += 1;
        
        // Provider verificato
        if (service.provider_profiles?.verified) score += 1;
        
        // Rating alto
        if (service.provider_profiles?.rating_average >= 4.0) score += 1;

        return { ...service, similarity_score: score };
      }) || [];

      return scored
        .sort((a, b) => b.similarity_score - a.similarity_score)
        .slice(0, limit);
    } catch (error) {
      console.error('Errore getRelatedServices:', error);
      throw error;
    }
  }
}

// Esporta l'istanza per uso diretto
export const servicesAPI = ServicesAPI;

// Funzioni di utilità per filtri
export const ServiceFiltersUtils = {
  /**
   * Crea filtri per ricerca geografica
   */
  createLocationFilter(lat: number, lng: number, radius: number = 50): Partial<ServiceFilters> {
    return {
      latitude: lat,
      longitude: lng,
      radius
    };
  },

  /**
   * Crea filtri per range di prezzo
   */
  createPriceFilter(min?: number, max?: number, unit?: PricingUnit): Partial<ServiceFilters> {
    return {
      minPrice: min,
      maxPrice: max,
      pricingUnit: unit
    };
  },

  /**
   * Crea filtri per provider verificati
   */
  createVerifiedFilter(minRating: number = 4.0): Partial<ServiceFilters> {
    return {
      verifiedOnly: true,
      minRating
    };
  }
};