/**
 * Gestione della cache globale per l'applicazione
 * Utilizza una semplice cache in memoria con supporto per TTL (Time To Live)
 */

export interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export class GlobalCache {
  private static instance: GlobalCache;
  private cache: Map<string, CacheItem<unknown>>;

  private constructor() {
    this.cache = new Map();
  }

  public static getInstance(): GlobalCache {
    if (!GlobalCache.instance) {
      GlobalCache.instance = new GlobalCache();
    }
    return GlobalCache.instance;
  }

  /**
   * Inserisce un elemento nella cache
   */
  set<T>(key: string, data: T, ttl: number = CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  /**
   * Recupera un elemento dalla cache
   * Restituisce null se l'elemento non esiste o è scaduto
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    
    if (!item) {
      return null;
    }

    const isExpired = Date.now() - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * Rimuove un elemento dalla cache
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Pulisce tutta la cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Pulisce gli elementi scaduti
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Restituisce il numero di elementi nella cache
   */
  size(): number {
    return this.cache.size;
  }
}

// Chiavi di cache standardizzate
export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  SESSION_DATA: 'session_data',
  USER_TYPE: 'user_type',
  PROVIDER_SERVICES: 'provider_services',
  PROVIDER_ARCHIVED_SERVICES: 'provider_archived_services',
  PROVIDER_PROFILE: 'provider_profile',
  SERVICES_STATS: 'services_stats',
  CATEGORIES: 'categories',
  SEARCH_RESULTS: 'search_results',
  PROVIDERS_LIST: 'providers_list',
  CATEGORY_STATS: 'category_stats',
  SERVICE_DETAILS: 'service_details',
  PROVIDER_DETAILS: 'provider_details'
} as const;

// TTL predefinito: 30 minuti (in millisecondi)
export const CACHE_TTL = 30 * 60 * 1000;

// Istanza globale della cache
export const globalCache = GlobalCache.getInstance();