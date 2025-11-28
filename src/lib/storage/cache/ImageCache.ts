import { CacheConfig } from '../types';

interface CacheEntry {
  url: string;
  blob: Blob;
  timestamp: number;
  accessCount: number;
  lastAccessed: number;
  size: number;
  metadata: {
    originalUrl: string;
    optimized: boolean;
    format: string;
    quality?: number;
  };
}

interface CacheStats {
  totalSize: number;
  entryCount: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
}

/**
 * Intelligent image cache with LRU eviction and size management
 * Stores optimized images in memory and IndexedDB for persistence
 */
export class ImageCache {
  private memoryCache = new Map<string, CacheEntry>();
  private config: CacheConfig;
  private stats: CacheStats;
  private dbName = 'BookingHSE_ImageCache';
  private dbVersion = 1;
  private db: IDBDatabase | null = null;

  constructor(config: CacheConfig) {
    this.config = {
      enabled: true,
      ttl: 24 * 60 * 60, // 24 hours default
      maxSize: 50, // 50MB default
      strategy: 'lru',
      ...config
    };

    this.stats = {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0
    };

    this.initializeDB();
    this.startCleanupInterval();
  }

  /**
   * Initialize IndexedDB for persistent caching
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        if (!db.objectStoreNames.contains('images')) {
          const store = db.createObjectStore('images', { keyPath: 'key' });
          store.createIndex('timestamp', 'timestamp');
          store.createIndex('lastAccessed', 'lastAccessed');
        }
      };
    });
  }

  /**
   * Get cached image
   */
  async get(key: string): Promise<string | null> {
    if (!this.config.enabled) {
      return null;
    }

    // Check memory cache first
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      this.updateAccessStats(memoryEntry);
      this.stats.totalHits++;
      this.updateHitRate();
      return URL.createObjectURL(memoryEntry.blob);
    }

    // Check IndexedDB
    const dbEntry = await this.getFromDB(key);
    if (dbEntry && !this.isExpired(dbEntry)) {
      // Move to memory cache
      this.memoryCache.set(key, dbEntry);
      this.updateAccessStats(dbEntry);
      this.stats.totalHits++;
      this.updateHitRate();
      return URL.createObjectURL(dbEntry.blob);
    }

    this.stats.totalMisses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Store image in cache
   */
  async set(
    key: string,
    blob: Blob,
    metadata: CacheEntry['metadata']
  ): Promise<void> {
    if (!this.config.enabled) {
      return;
    }

    const entry: CacheEntry = {
      url: URL.createObjectURL(blob),
      blob,
      timestamp: Date.now(),
      accessCount: 1,
      lastAccessed: Date.now(),
      size: blob.size,
      metadata
    };

    // Check if we need to make space
    await this.ensureSpace(entry.size);

    // Store in memory cache
    this.memoryCache.set(key, entry);
    this.stats.totalSize += entry.size;
    this.stats.entryCount++;

    // Store in IndexedDB for persistence
    await this.saveToDB(key, entry);
  }

  /**
   * Remove item from cache
   */
  async remove(key: string): Promise<void> {
    const entry = this.memoryCache.get(key);
    if (entry) {
      URL.revokeObjectURL(entry.url);
      this.memoryCache.delete(key);
      this.stats.totalSize -= entry.size;
      this.stats.entryCount--;
    }

    await this.removeFromDB(key);
  }

  /**
   * Clear entire cache
   */
  async clear(): Promise<void> {
    // Clean up memory cache URLs
    for (const entry of this.memoryCache.values()) {
      URL.revokeObjectURL(entry.url);
    }
    
    this.memoryCache.clear();
    this.stats = {
      totalSize: 0,
      entryCount: 0,
      hitRate: 0,
      totalHits: 0,
      totalMisses: 0
    };

    await this.clearDB();
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    const now = Date.now();
    const age = (now - entry.timestamp) / 1000; // Convert to seconds
    return age > this.config.ttl;
  }

  /**
   * Update access statistics for an entry
   */
  private updateAccessStats(entry: CacheEntry): void {
    entry.accessCount++;
    entry.lastAccessed = Date.now();
  }

  /**
   * Update hit rate calculation
   */
  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses;
    this.stats.hitRate = total > 0 ? (this.stats.totalHits / total) * 100 : 0;
  }

  /**
   * Ensure there's enough space for a new entry
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const maxSizeBytes = this.config.maxSize * 1024 * 1024; // Convert MB to bytes
    
    while (this.stats.totalSize + requiredSize > maxSizeBytes && this.memoryCache.size > 0) {
      await this.evictLeastUsed();
    }
  }

  /**
   * Evict least recently used item
   */
  private async evictLeastUsed(): Promise<void> {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    if (this.config.strategy === 'lru') {
      // Find least recently used
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.lastAccessed < oldestTime) {
          oldestTime = entry.lastAccessed;
          oldestKey = key;
        }
      }
    } else if (this.config.strategy === 'fifo') {
      // Find oldest entry
      for (const [key, entry] of this.memoryCache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }
    }

    if (oldestKey) {
      await this.remove(oldestKey);
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanupInterval(): void {
    setInterval(() => {
      this.cleanupExpired();
    }, 5 * 60 * 1000); // Run every 5 minutes
  }

  /**
   * Remove expired entries
   */
  private async cleanupExpired(): Promise<void> {
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.memoryCache.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.remove(key);
    }
  }

  /**
   * Get entry from IndexedDB
   */
  private async getFromDB(key: string): Promise<CacheEntry | null> {
    if (!this.db) return null;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readonly');
      const store = transaction.objectStore('images');
      const request = store.get(key);

      request.onsuccess = () => {
        const result = request.result;
        if (result) {
          resolve({
            url: '', // Will be regenerated
            blob: result.blob,
            timestamp: result.timestamp,
            accessCount: result.accessCount,
            lastAccessed: result.lastAccessed,
            size: result.size,
            metadata: result.metadata
          });
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Save entry to IndexedDB
   */
  private async saveToDB(key: string, entry: CacheEntry): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      
      const dbEntry = {
        key,
        blob: entry.blob,
        timestamp: entry.timestamp,
        accessCount: entry.accessCount,
        lastAccessed: entry.lastAccessed,
        size: entry.size,
        metadata: entry.metadata
      };

      const request = store.put(dbEntry);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Remove entry from IndexedDB
   */
  private async removeFromDB(key: string): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear IndexedDB
   */
  private async clearDB(): Promise<void> {
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['images'], 'readwrite');
      const store = transaction.objectStore('images');
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Generate cache key from URL and optimization parameters
   */
  static generateKey(
    originalUrl: string,
    optimization?: {
      width?: number;
      height?: number;
      quality?: number;
      format?: string;
    }
  ): string {
    const params = optimization ? JSON.stringify(optimization) : '';
    return `${originalUrl}_${btoa(params)}`;
  }
}

// Global cache instance
let globalImageCache: ImageCache | null = null;

/**
 * Get or create global image cache instance
 */
export function getImageCache(config?: CacheConfig): ImageCache {
  if (!globalImageCache) {
    globalImageCache = new ImageCache(config || {
      enabled: true,
      ttl: 24 * 60 * 60, // 24 hours
      maxSize: 50, // 50MB
      strategy: 'lru'
    });
  }
  return globalImageCache;
}

/**
 * Clear global cache
 */
export async function clearImageCache(): Promise<void> {
  if (globalImageCache) {
    await globalImageCache.clear();
  }
}