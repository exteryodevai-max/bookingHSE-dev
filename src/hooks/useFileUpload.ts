import { useState, useCallback, useRef, useEffect } from 'react';
import { StorageAdapter } from '../lib/storage/StorageAdapter';
import { getStorageConfig } from '../lib/storage/config';
import {
  UploadOptions,
  UploadResult,
  UploadProgress,
  ValidationRule
} from '../lib/storage/types';
import { useAuth } from '../contexts/AuthContext';

interface UseFileUploadOptions {
  context: 'service' | 'profile' | 'certification' | 'temp';
  validationRules?: ValidationRule;
  optimizeImages?: boolean;
  generateThumbnails?: boolean;
  onSuccess?: (results: UploadResult[]) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: UploadProgress) => void;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  results: UploadResult[];
  aborted: boolean;
}

export function useFileUpload(options: UseFileUploadOptions) {
  const { user } = useAuth();
  
  // 🔍 DEBUG: Log AuthContext state
  console.log('🔍 [useFileUpload] AuthContext state:', {
    user: user ? { id: user.id, email: user.email } : null,
    userAuthenticated: !!user,
    timestamp: new Date().toISOString()
  });
  
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    results: [],
    aborted: false
  });
  
  const storageAdapter = useRef<StorageAdapter | null>(null);
  const abortController = useRef<AbortController | null>(null);

  // Cleanup effect to prevent memory leaks
  useEffect(() => {
    return () => {
      // Cleanup AbortController on unmount
      if (abortController.current) {
        abortController.current.abort();
        abortController.current = null;
      }
      
      // Cleanup StorageAdapter on unmount
      if (storageAdapter.current) {
        storageAdapter.current = null;
      }
    };
  }, []);

  // Initialize storage adapter
  const getStorageAdapter = useCallback(() => {
    console.log('🔍 [useFileUpload] getStorageAdapter called');
    
    if (!storageAdapter.current) {
      console.log('🔍 [useFileUpload] Creating new StorageAdapter');
      
      const config = getStorageConfig();
      console.log('🔍 [useFileUpload] Storage config:', {
        provider: config.provider,
        buckets: config.buckets,
        url: config.url ? 'SET' : 'MISSING',
        anonKey: config.anonKey ? 'SET' : 'MISSING'
      });
      
      storageAdapter.current = new StorageAdapter(config);
      console.log('🔍 [useFileUpload] StorageAdapter created:', storageAdapter.current.getProviderInfo());
    } else {
      console.log('🔍 [useFileUpload] Using existing StorageAdapter');
    }
    
    return storageAdapter.current;
  }, []);

  // Reset state
  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      results: [],
      aborted: false
    });
  }, []);

  // Abort upload
  const abort = useCallback(() => {
    if (abortController.current) {
      abortController.current.abort();
      setState(prev => ({ ...prev, aborted: true, uploading: false }));
    }
  }, []);

  // Upload single file
  const uploadFile = useCallback(async (
    file: File,
    customOptions?: Partial<UploadOptions>
  ): Promise<UploadResult | null> => {
    console.log('🚀 [useFileUpload] uploadFile called with:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      customOptions,
      context: options.context,
      userAuthenticated: !!user,
      userId: user?.id
    });

    if (!user) {
      const error = 'User must be authenticated to upload files';
      console.error('❌ [useFileUpload] Authentication error:', error);
      console.log('🔍 [useFileUpload] AuthContext debug:', {
        user,
        userType: typeof user,
        userKeys: user ? Object.keys(user) : 'null'
      });
      setState(prev => ({ ...prev, error }));
      options.onError?.(error);
      return null;
    }

    try {
      console.log('🔄 [useFileUpload] Starting upload process');
      setState(prev => ({ ...prev, uploading: true, error: null, aborted: false }));
      abortController.current = new AbortController();

      const adapter = getStorageAdapter();
      console.log('📦 [useFileUpload] StorageAdapter ready:', adapter.getProviderInfo());
      
      const fileName = `${Date.now()}_${file.name}`;
      const folder = adapter.generatePath(options.context, user.id, fileName);
      
      console.log('🔍 [useFileUpload] Path generation:', {
        context: options.context,
        userId: user.id,
        fileName,
        generatedFolder: folder,
        folderParts: folder.split('/'),
        finalFolder: folder.split('/').slice(0, -1).join('/'),
        finalFileName: folder.split('/').pop()
      });

      const uploadOptions: UploadOptions = {
        folder: folder.split('/').slice(0, -1).join('/'),
        fileName: folder.split('/').pop(),
        optimize: options.optimizeImages,
        generateThumbnail: options.generateThumbnails,
        ...customOptions
      };
      
      console.log('🔍 [useFileUpload] Final upload options:', uploadOptions);

      const result = await adapter.upload(
        file,
        uploadOptions,
        options.validationRules,
        (progress) => {
          console.log('📊 [useFileUpload] Upload progress:', progress);
          setState(prev => ({ ...prev, progress: progress.percentage }));
          options.onProgress?.(progress);
        }
      );

      console.log('✅ [useFileUpload] Upload successful:', result);
      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        results: [result]
      }));

      options.onSuccess?.([result]);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('❌ [useFileUpload] Upload failed:', {
        error: errorMessage,
        errorType: typeof error,
        errorStack: error instanceof Error ? error.stack : 'No stack',
        context: options.context,
        userId: user?.id
      });
      
      setState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage
      }));
      options.onError?.(errorMessage);
      return null;
    }
  }, [user, options, getStorageAdapter]);

  // Upload multiple files
  const uploadFiles = useCallback(async (
    files: File[],
    customOptions?: Partial<UploadOptions>
  ): Promise<UploadResult[]> => {
    console.log('🚀 [useFileUpload] Starting uploadFiles function');
    console.log('📊 [useFileUpload] Input parameters:', {
      filesCount: files.length,
      customOptions,
      userAuthenticated: !!user,
      context: options.context
    });

    if (!user) {
      const error = 'User must be authenticated to upload files';
      console.error('❌ [useFileUpload] Authentication error:', error);
      setState(prev => ({ ...prev, error }));
      options.onError?.(error);
      return [];
    }

    if (files.length === 0) {
      console.log('ℹ️ [useFileUpload] No files to upload, returning empty array');
      return [];
    }

    try {
      console.log('🔄 [useFileUpload] Setting upload state to true');
      setState(prev => ({ ...prev, uploading: true, error: null, aborted: false }));
      abortController.current = new AbortController();

      const adapter = getStorageAdapter();
      console.log('📦 [useFileUpload] Storage adapter initialized:', adapter.getProviderInfo());
      
      const results: UploadResult[] = [];
      let totalProgress = 0;

      console.log('🔄 [useFileUpload] Starting file upload loop');
      for (let i = 0; i < files.length; i++) {
        if (abortController.current.signal.aborted) {
          console.log('⚠️ [useFileUpload] Upload aborted by user');
          break;
        }

        const file = files[i];
        const fileName = `${Date.now()}_${i}_${file.name}`;
        const fullPath = adapter.generatePath(options.context, user.id, fileName);

        console.log(`📤 [useFileUpload] Uploading file ${i + 1}/${files.length}:`, {
          originalName: file.name,
          generatedName: fileName,
          size: file.size,
          type: file.type,
          fullPath: fullPath
        });

        // Ensure fullPath is valid before splitting
        if (!fullPath || typeof fullPath !== 'string') {
          throw new Error(`Invalid path generated for file ${file.name}: ${fullPath}`);
        }

        const pathParts = fullPath.split('/');
        const folderPath = pathParts.slice(0, -1).join('/');
        const fileNameFromPath = pathParts.pop();

        console.log('🔍 [useFileUpload] Path analysis:', {
          fullPath,
          pathParts,
          folderPath,
          fileNameFromPath
        });

        // Handle customOptions properly - if it's a string, use it as folder override
        let finalOptions: UploadOptions = {
          folder: folderPath,
          fileName: fileNameFromPath,
          optimize: options.optimizeImages,
          generateThumbnail: options.generateThumbnails
        };

        // If customOptions is a string, use it as the folder path
        if (typeof customOptions === 'string') {
          finalOptions.folder = customOptions;
          console.log('🔧 [useFileUpload] Using string customOptions as folder:', customOptions);
        } else if (customOptions && typeof customOptions === 'object') {
          // If it's an object, spread it properly
          finalOptions = { ...finalOptions, ...customOptions };
          console.log('🔧 [useFileUpload] Merged object customOptions:', customOptions);
        } else if (customOptions !== undefined) {
          console.warn('⚠️ [useFileUpload] Unexpected customOptions type:', typeof customOptions, customOptions);
        }

        console.log('⚙️ [useFileUpload] Upload options:', finalOptions);

        const result = await adapter.upload(
          file,
          finalOptions,
          options.validationRules,
          (progress) => {
            const fileProgress = (i / files.length) * 100 + (progress.percentage / files.length);
            console.log(`📊 [useFileUpload] Progress for file ${i + 1}:`, {
              fileProgress: progress.percentage,
              overallProgress: fileProgress,
              loaded: progress.loaded,
              total: progress.total
            });
            setState(prev => ({ ...prev, progress: fileProgress }));
            options.onProgress?.({
              loaded: progress.loaded,
              total: progress.total,
              percentage: fileProgress
            });
          }
        );

        console.log(`✅ [useFileUpload] File ${i + 1} uploaded successfully:`, {
          url: result.url,
          path: result.path,
          size: result.size
        });

        results.push(result);
        totalProgress = ((i + 1) / files.length) * 100;
        setState(prev => ({ ...prev, progress: totalProgress }));
      }

      console.log('🎉 [useFileUpload] All files uploaded successfully:', {
        totalFiles: files.length,
        successfulUploads: results.length,
        results: results.map(r => ({ url: r.url, path: r.path }))
      });

      setState(prev => ({
        ...prev,
        uploading: false,
        progress: 100,
        results
      }));

      options.onSuccess?.(results);
      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      console.error('❌ [useFileUpload] Upload failed:', {
        error: error,
        message: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
        filesCount: files.length
      });
      setState(prev => ({
        ...prev,
        uploading: false,
        error: errorMessage
      }));
      options.onError?.(errorMessage);
      return [];
    }
  }, [user, options, getStorageAdapter]);

  // Delete file
  const deleteFile = useCallback(async (path: string): Promise<boolean> => {
    try {
      const adapter = getStorageAdapter();
      await adapter.delete(path);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      options.onError?.(errorMessage);
      return false;
    }
  }, [getStorageAdapter, options]);

  // Delete multiple files
  const deleteFiles = useCallback(async (paths: string[]): Promise<boolean> => {
    try {
      const adapter = getStorageAdapter();
      await adapter.deleteMultiple(paths);
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Delete failed';
      setState(prev => ({ ...prev, error: errorMessage }));
      options.onError?.(errorMessage);
      return false;
    }
  }, [getStorageAdapter, options]);

  // Get public URL
  const getPublicUrl = useCallback((path: string): string => {
    const adapter = getStorageAdapter();
    return adapter.getPublicUrl(path);
  }, [getStorageAdapter]);

  // Get signed URL for private files
  const getSignedUrl = useCallback(async (
    path: string,
    expiresIn?: number
  ): Promise<string | null> => {
    try {
      const adapter = getStorageAdapter();
      return await adapter.getSignedUrl(path, expiresIn);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get signed URL';
      setState(prev => ({ ...prev, error: errorMessage }));
      options.onError?.(errorMessage);
      return null;
    }
  }, [getStorageAdapter, options]);

  // Check if file exists
  const fileExists = useCallback(async (path: string): Promise<boolean> => {
    try {
      const adapter = getStorageAdapter();
      return await adapter.exists(path);
    } catch {
      return false;
    }
  }, [getStorageAdapter]);

  return {
    // State
    uploading: state.uploading,
    progress: state.progress,
    error: state.error,
    results: state.results,
    aborted: state.aborted,
    
    // Actions
    uploadFile,
    uploadFiles,
    deleteFile,
    deleteFiles,
    reset,
    abort,
    
    // Utilities
    getPublicUrl,
    getSignedUrl,
    fileExists
  };
}

// Specialized hooks for different contexts
export function useServiceImageUpload(options?: Partial<UseFileUploadOptions>) {
  return useFileUpload({
    context: 'service',
    optimizeImages: true,
    generateThumbnails: true,
    validationRules: {
      maxSize: 5 * 1024 * 1024, // 5MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      minWidth: 400,
      minHeight: 300,
      maxWidth: 4096,
      maxHeight: 4096
    },
    ...options
  });
}

export function useProfileImageUpload(options?: Partial<UseFileUploadOptions>) {
  return useFileUpload({
    context: 'profile',
    optimizeImages: true,
    generateThumbnails: true,
    validationRules: {
      maxSize: 2 * 1024 * 1024, // 2MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
      minWidth: 100,
      minHeight: 100,
      maxWidth: 2048,
      maxHeight: 2048
    },
    ...options
  });
}

export function useCertificationUpload(options?: Partial<UseFileUploadOptions>) {
  return useFileUpload({
    context: 'certification',
    optimizeImages: false,
    generateThumbnails: false,
    validationRules: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
      allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
    },
    ...options
  });
}