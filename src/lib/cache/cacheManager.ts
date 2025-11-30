/**
 * Gestore centralizzato del caching per BookingHSE
 * Supporta localStorage, sessionStorage e memory cache con strategie LRU
 */

export interface CacheConfig {
  ttl?: number; // Time to live in seconds
  strategy?: 'lru' | 'fifo' | 'lfu';
  maxSize?: number; // Max size in MB
  persist?: boolean; // Whether to persist to localStorage
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
  size: number; // Estimated size in bytes
}

export class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private config: Required<CacheConfig>;
  private totalSize = 0;
  private stats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    totalSize: 0
  };

  constructor(config: CacheConfig = {}) {
    this.config = {
      ttl: config.ttl || 3600, // 1 hour default
      strategy: config.strategy || 'lru',
      maxSize: config.maxSize || 10, // 10MB default
      persist: config.persist ?? true
    };
  }

  /**
   * Store data in cache
   */
  set<T>(key: string, data: T, customTtl?: number): void {
    const ttl = customTtl || this.config.ttl;
    const now = Date.now();
    
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt: now + (ttl * 1000),
      accessCount: 0,
      lastAccessed: now,
      size: this.estimateSize(data)
    };

    // Check if we need to make space
    this.ensureSpace(entry.size);

    // Store in memory
    this.memoryCache.set(key, entry);
    this.totalSize += entry.size;

    // Persist to localStorage if enabled
    if (this.config.persist) {
      try {
        localStorage.setItem(
          `cache_${key}`,
          JSON.stringify({
            ...entry,
            data: JSON.stringify(data)
          })
        );
      } catch (error) {
        console.warn('Failed to persist cache to localStorage:', error);
      }
    }
  }

  /**
   * Get data from cache
   */
  get<T>(key: string): T | null {
    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.updateAccessStats(memoryEntry);
      this.stats.hits++;
      return memoryEntry.data as T;
    }

    // Check localStorage if enabled
    if (this.config.persist) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const entry: CacheEntry = JSON.parse(stored);
          entry.data = JSON.parse(entry.data as string);
          
          if (!this.isExpired(entry)) {
            // Move to memory cache
            this.memoryCache.set(key, entry);
            this.totalSize += entry.size;
            this.updateAccessStats(entry);
            this.stats.hits++;
            return entry.data as T;
          } else {
            // Remove expired entry
            localStorage.removeItem(`cache_${key}`);
          }
        }
      } catch (error) {
        console.warn('Failed to retrieve cache from localStorage:', error);
      }
    }

    this.stats.misses++;
    return null;
  }

  /**
   * Remove item from cache
   */
  remove(key: string): void {
    const entry = this.memoryCache.get(key);
    if (entry) {
      this.totalSize -= entry.size;
      this.memoryCache.delete(key);
    }

    if (this.config.persist) {
      localStorage.removeItem(`cache_${key}`);
    }
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    this.memoryCache.clear();
    this.totalSize = 0;
    this.stats = { hits: 0, misses: 0, evictions: 0, totalSize: 0 };

    if (this.config.persist) {
      // Remove all cache items from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      ...this.stats,
      totalSize: this.totalSize,
      hitRate: this.stats.hits / (this.stats.hits + this.stats.misses) || 0,
      entries: this.memoryCache.size
    };
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * Update access statistics for cache entry
   */
  private updateAccessStats(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * Ensure there's enough space in cache
   */
  private ensureSpace(requiredSize: number): void {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024;
    
    while (this.totalSize + requiredSize > maxSizeBytes && this.memoryCache.size > 0) {
      this.evictOldest();
    }
  }

  /**
   * Evict oldest entry based on strategy
   */
  private evictOldest(): void {
    let keyToEvict: string | null = null;
    let oldestValue: number = Infinity;

    for (const [key, entry] of this.memoryCache.entries()) {
      let value: number;
      
      switch (this.config.strategy) {
        case 'lru':
          value = entry.lastAccessed;
          break;
        case 'lfu':
          value = -entry.accessCount; // Lower access count = older
          break;
        case 'fifo':
        default:
          value = entry.timestamp;
          break;
      }

      if (value < oldestValue) {
        oldestValue = value;
        keyToEvict = key;
      }
    }

    if (keyToEvict) {
      const entry = this.memoryCache.get(keyToEvict)!;
      this.totalSize -= entry.size;
      this.memoryCache.delete(keyToEvict);
      this.stats.evictions++;

      // Also remove from localStorage
      if (this.config.persist) {
        localStorage.removeItem(`cache_${keyToEvict}`);
      }
    }
  }

  /**
   * Estimate size of data in bytes
   */
  private estimateSize(data: any): number {
    try {
      const json = JSON.stringify(data);
      return new Blob([json]).size;
    } catch {
      return 1024; // Default 1KB estimate
    }
  }
}

// Global cache instance
export const globalCache = new CacheManager({
  ttl: 1800, // 30 minutes
  maxSize: 20, // 20MB
  strategy: 'lru',
  persist: true
});

// Cache version - increment this when data structure changes to invalidate old cache
const CACHE_VERSION = 'v3';

// Clear old cache on app start
const CACHE_VERSION_KEY = 'cache_version';
if (typeof window !== 'undefined') {
  const storedVersion = localStorage.getItem(CACHE_VERSION_KEY);
  if (storedVersion !== CACHE_VERSION) {
    console.log('🗑️ Cache version changed from', storedVersion, 'to', CACHE_VERSION, '- clearing all cache...');

    // Clear the globalCache instance (both memory and localStorage)
    globalCache.clear();

    // Also clear any orphaned localStorage items
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes('search_results') || key.includes('providers_list'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => {
      console.log('  Removing orphaned key:', key);
      localStorage.removeItem(key);
    });

    localStorage.setItem(CACHE_VERSION_KEY, CACHE_VERSION);
    console.log('✅ Cache cleared, new version set:', CACHE_VERSION);
  }
}

export const CACHE_KEYS = {
  USER_PROFILE: 'user_profile',
  SESSION_DATA: 'session_data',
  USER_TYPE: 'user_type',
  PROVIDER_SERVICES: (providerId: string) => `provider_services_${providerId}`,
  PROVIDER_ARCHIVED_SERVICES: (providerId: string) => `provider_archived_services_${providerId}`,
  PROVIDER_PROFILE: (providerId: string) => `provider_profile_${providerId}`,
  SERVICES_STATS: 'services_stats',
  CATEGORIES: 'categories',
  SEARCH_RESULTS: `search_results_${CACHE_VERSION}`,
  PROVIDERS_LIST: `providers_list_${CACHE_VERSION}`
} as const;

export const CACHE_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds