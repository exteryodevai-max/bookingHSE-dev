import { useState, useEffect, useCallback } from 'react';
import { getImageCache, ImageCache } from '../lib/storage/cache/ImageCache';
import { optimizeImage } from '../lib/storage/utils/optimization';
import { OptimizationOptions } from '../lib/storage/types';

interface UseImageCacheOptions {
  optimization?: OptimizationOptions;
  fallbackUrl?: string;
  lazy?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

interface ImageCacheState {
  url: string | null;
  loading: boolean;
  error: string | null;
  cached: boolean;
}

/**
 * Hook for cached and optimized image loading
 */
export function useImageCache(
  originalUrl: string | null,
  options: UseImageCacheOptions = {}
) {
  const [state, setState] = useState<ImageCacheState>({
    url: null,
    loading: false,
    error: null,
    cached: false
  });

  const cache = getImageCache();

  const loadImage = useCallback(async () => {
    if (!originalUrl) {
      setState({
        url: options.fallbackUrl || null,
        loading: false,
        error: null,
        cached: false
      });
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Generate cache key
      const cacheKey = ImageCache.generateKey(originalUrl, options.optimization);
      
      // Try to get from cache first
      const cachedUrl = await cache.get(cacheKey);
      if (cachedUrl) {
        setState({
          url: cachedUrl,
          loading: false,
          error: null,
          cached: true
        });
        options.onLoad?.();
        return;
      }

      // Load original image
      const response = await fetch(originalUrl);
      if (!response.ok) {
        throw new Error(`Failed to load image: ${response.statusText}`);
      }

      const blob = await response.blob();
      let finalBlob = blob;

      // Optimize if requested and it's an image
      if (options.optimization && blob.type.startsWith('image/')) {
        try {
          const file = new File([blob], 'image', { type: blob.type });
          const optimizedFile = await optimizeImage(file, options.optimization);
          finalBlob = optimizedFile;
        } catch (optimizationError) {
          console.warn('Image optimization failed, using original:', optimizationError);
        }
      }

      // Cache the result
      await cache.set(cacheKey, finalBlob, {
        originalUrl,
        optimized: !!options.optimization,
        format: finalBlob.type,
        quality: options.optimization?.quality
      });

      // Create object URL
      const objectUrl = URL.createObjectURL(finalBlob);
      setState({
        url: objectUrl,
        loading: false,
        error: null,
        cached: false // Just cached, but this is the first load
      });
      
      options.onLoad?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load image';
      setState({
        url: options.fallbackUrl || null,
        loading: false,
        error: errorMessage,
        cached: false
      });
      options.onError?.(errorMessage);
    }
  }, [originalUrl, options, cache]);

  // Load image when URL changes or immediately if not lazy
  useEffect(() => {
    if (!options.lazy) {
      loadImage();
    }
  }, [loadImage, options.lazy]);

  // Manual load function for lazy loading
  const load = useCallback(() => {
    if (options.lazy && !state.loading && !state.url) {
      loadImage();
    }
  }, [loadImage, options.lazy, state.loading, state.url]);

  return {
    ...state,
    load
  };
}

/**
 * Hook for preloading multiple images
 */
export function useImagePreloader(
  urls: string[],
  options: UseImageCacheOptions = {}
) {
  const [state, setState] = useState({
    loading: false,
    loaded: 0,
    total: urls.length,
    errors: [] as string[]
  });

  const cache = getImageCache();

  const preloadImages = useCallback(async () => {
    if (urls.length === 0) return;

    setState({
      loading: true,
      loaded: 0,
      total: urls.length,
      errors: []
    });

    const errors: string[] = [];
    let loaded = 0;

    for (const url of urls) {
      try {
        const cacheKey = ImageCache.generateKey(url, options.optimization);
        
        // Check if already cached
        const cachedUrl = await cache.get(cacheKey);
        if (cachedUrl) {
          loaded++;
          setState(prev => ({ ...prev, loaded }));
          continue;
        }

        // Load and cache image
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to load ${url}: ${response.statusText}`);
        }

        const blob = await response.blob();
        let finalBlob = blob;

        // Optimize if requested
        if (options.optimization && blob.type.startsWith('image/')) {
          try {
            const file = new File([blob], 'image', { type: blob.type });
            const optimizedFile = await optimizeImage(file, options.optimization);
            finalBlob = optimizedFile;
          } catch (optimizationError) {
            console.warn('Image optimization failed for', url, optimizationError);
          }
        }

        // Cache the result
        await cache.set(cacheKey, finalBlob, {
          originalUrl: url,
          optimized: !!options.optimization,
          format: finalBlob.type,
          quality: options.optimization?.quality
        });

        loaded++;
        setState(prev => ({ ...prev, loaded }));
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : `Failed to load ${url}`;
        errors.push(errorMessage);
      }
    }

    setState(prev => ({
      ...prev,
      loading: false,
      errors
    }));
  }, [urls, options, cache]);

  useEffect(() => {
    preloadImages();
  }, [preloadImages]);

  return {
    ...state,
    progress: state.total > 0 ? (state.loaded / state.total) * 100 : 0,
    reload: preloadImages
  };
}

/**
 * Hook for cache management
 */
export function useCacheManager() {
  const [stats, setStats] = useState({
    totalSize: 0,
    entryCount: 0,
    hitRate: 0,
    totalHits: 0,
    totalMisses: 0
  });

  const cache = getImageCache();

  const updateStats = useCallback(() => {
    const currentStats = cache.getStats();
    setStats(currentStats);
  }, [cache]);

  const clearCache = useCallback(async () => {
    await cache.clear();
    updateStats();
  }, [cache, updateStats]);

  const removeFromCache = useCallback(async (key: string) => {
    await cache.remove(key);
    updateStats();
  }, [cache, updateStats]);

  // Update stats periodically
  useEffect(() => {
    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [updateStats]);

  return {
    stats,
    clearCache,
    removeFromCache,
    updateStats
  };
}

/**
 * Specialized hooks for different image types
 */
export function useServiceImage(
  url: string | null,
  size: 'thumbnail' | 'card' | 'gallery' | 'hero' = 'card',
  options: Omit<UseImageCacheOptions, 'optimization'> = {}
) {
  const optimizationMap = {
    thumbnail: {
      quality: 80,
      format: 'webp' as const,
      resize: { width: 300, height: 300, fit: 'cover' as const }
    },
    card: {
      quality: 85,
      format: 'webp' as const,
      resize: { width: 400, height: 300, fit: 'cover' as const }
    },
    gallery: {
      quality: 85,
      format: 'webp' as const,
      resize: { width: 800, height: 600, fit: 'cover' as const }
    },
    hero: {
      quality: 90,
      format: 'webp' as const,
      resize: { width: 1920, height: 1080, fit: 'cover' as const }
    }
  };

  return useImageCache(url, {
    ...options,
    optimization: optimizationMap[size]
  });
}

export function useProfileImage(
  url: string | null,
  size: 'avatar' | 'cover' = 'avatar',
  options: Omit<UseImageCacheOptions, 'optimization'> = {}
) {
  const optimizationMap = {
    avatar: {
      quality: 85,
      format: 'webp' as const,
      resize: { width: 200, height: 200, fit: 'cover' as const }
    },
    cover: {
      quality: 85,
      format: 'webp' as const,
      resize: { width: 800, height: 400, fit: 'cover' as const }
    }
  };

  return useImageCache(url, {
    ...options,
    optimization: optimizationMap[size]
  });
}