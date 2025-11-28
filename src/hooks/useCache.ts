import { useState, useEffect, useCallback } from 'react';
import { globalCache, CacheManager } from '../lib/cache/cacheManager';

interface UseCacheOptions {
  ttl?: number;
  enabled?: boolean;
  cacheInstance?: CacheManager;
}

interface UseCacheReturn<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  setCache: (data: T) => void;
  invalidate: () => void;
  refresh: () => void;
}

/**
 * Hook per gestire il caching dei dati con supporto per fetch automatico
 */
export function useCache<T>(
  key: string,
  fetchFn?: () => Promise<T>,
  options: UseCacheOptions = {}
): UseCacheReturn<T> {
  const {
    ttl,
    enabled = true,
    cacheInstance = globalCache
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(!!fetchFn);
  const [error, setError] = useState<Error | null>(null);

  const loadFromCache = useCallback(() => {
    if (!enabled) {
      setData(null);
      return;
    }

    const cached = cacheInstance.get<T>(key);
    if (cached) {
      setData(cached);
      setError(null);
    }
  }, [key, enabled, cacheInstance]);

  const fetchData = useCallback(async () => {
    if (!fetchFn || !enabled) return;

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      setData(result);
      
      // Cache the result
      if (enabled) {
        cacheInstance.set(key, result, ttl);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
      console.error(`Cache fetch error for key ${key}:`, err);
    } finally {
      setLoading(false);
    }
  }, [key, fetchFn, enabled, cacheInstance, ttl]);

  const setCache = useCallback((newData: T) => {
    setData(newData);
    if (enabled) {
      cacheInstance.set(key, newData, ttl);
    }
  }, [key, enabled, cacheInstance, ttl]);

  const invalidate = useCallback(() => {
    cacheInstance.remove(key);
    setData(null);
    if (fetchFn) {
      fetchData();
    }
  }, [key, fetchFn, cacheInstance, fetchData]);

  const refresh = useCallback(() => {
    invalidate();
  }, [invalidate]);

  // Load initial data from cache
  useEffect(() => {
    loadFromCache();
    
    // If we have a fetch function but no cached data, fetch
    if (fetchFn && !data && enabled) {
      fetchData();
    }
  }, [loadFromCache, fetchFn, data, enabled, fetchData]);

  return {
    data,
    loading,
    error,
    setCache,
    invalidate,
    refresh
  };
}

/**
 * Hook per gestire cache di liste con supporto per paginazione
 */
export function useListCache<T>(
  key: string,
  fetchFn?: () => Promise<T[]>,
  options: UseCacheOptions = {}
) {
  const cache = useCache<T[]>(key, fetchFn, options);

  const appendItem = useCallback((item: T) => {
    const currentList = cache.data || [];
    const newList = [...currentList, item];
    cache.setCache(newList);
  }, [cache]);

  const updateItem = useCallback((predicate: (item: T) => boolean, updates: Partial<T>) => {
    const currentList = cache.data || [];
    const newList = currentList.map(item => 
      predicate(item) ? { ...item, ...updates } : item
    );
    cache.setCache(newList);
  }, [cache]);

  const removeItem = useCallback((predicate: (item: T) => boolean) => {
    const currentList = cache.data || [];
    const newList = currentList.filter(item => !predicate(item));
    cache.setCache(newList);
  }, [cache]);

  return {
    ...cache,
    appendItem,
    updateItem,
    removeItem
  };
}

/**
 * Hook per gestire cache di entità con ID
 */
export function useEntityCache<T extends { id: string }>(
  key: string,
  fetchFn?: () => Promise<T[]>,
  options: UseCacheOptions = {}
) {
  const listCache = useListCache<T>(key, fetchFn, options);

  const getById = useCallback((id: string) => {
    return listCache.data?.find(item => item.id === id) || null;
  }, [listCache.data]);

  const updateById = useCallback((id: string, updates: Partial<T>) => {
    listCache.updateItem(item => item.id === id, updates);
  }, [listCache]);

  const removeById = useCallback((id: string) => {
    listCache.removeItem(item => item.id === id);
  }, [listCache]);

  return {
    ...listCache,
    getById,
    updateById,
    removeById
  };
}