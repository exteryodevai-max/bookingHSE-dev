import { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../supabase';
import {
  StorageProvider,
  SupabaseStorageConfig,
  UploadOptions,
  UploadResult,
  UploadProgress,
  FileMetadata,
  StorageError
} from '../types';

/**
 * Supabase Storage Provider Implementation
 * Handles file uploads, downloads, and management using Supabase Storage
 * 
 * CORREZIONE: Utilizza il client Supabase autenticato condiviso invece di crearne uno nuovo
 * per garantire che le operazioni di storage abbiano accesso alla sessione utente
 */
export class SupabaseStorageProvider implements StorageProvider {
  public readonly name = 'supabase';
  private client: SupabaseClient;
  private config: SupabaseStorageConfig;

  constructor(config: SupabaseStorageConfig) {
    this.config = config;
    // ✅ CORREZIONE: Usa il client autenticato condiviso invece di crearne uno nuovo
    // Questo garantisce che il client abbia accesso alla sessione utente per le operazioni di storage
    this.client = supabase;
  }

  /**
   * Upload a single file to Supabase Storage
   */
  async upload(
    file: File,
    options: UploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    console.log('🚀 [SupabaseStorageProvider] upload called with:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      options,
      configBuckets: this.config.buckets
    });
    
    try {
      const bucket = options.bucket || this.config.buckets.services;
      const fileName = options.fileName || file.name;
      const folder = options.folder || '';
      const filePath = folder ? `${folder}/${fileName}` : fileName;
      
      console.log('🔍 [SupabaseStorageProvider] Upload parameters:', {
        bucket,
        fileName,
        folder,
        filePath,
        bucketFromConfig: this.config.buckets.services,
        bucketUsed: bucket
      });

      // Simulate progress for small files (Supabase doesn't provide native progress)
      if (onProgress) {
        onProgress({ loaded: 0, total: file.size, percentage: 0 });
      }

      console.log('📤 [SupabaseStorageProvider] Starting Supabase upload...');
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('❌ [SupabaseStorageProvider] Supabase upload error:', {
          error: error.message,
          bucket,
          filePath,
          errorDetails: error
        });
        throw this.handleStorageError(error);
      }
      
      console.log('✅ [SupabaseStorageProvider] Supabase upload successful:', data);

      if (onProgress) {
        onProgress({ loaded: file.size, total: file.size, percentage: 100 });
      }

      const publicUrl = this.getPublicUrl(data.path, bucket);

      const result: UploadResult = {
        url: publicUrl,
        path: data.path,
        size: file.size,
        metadata: {
          name: file.name,
          size: file.size,
          type: file.type,
          lastModified: file.lastModified
        }
      };

      // Generate thumbnails if requested
      if (options.generateThumbnail && file.type.startsWith('image/')) {
        result.thumbnails = await this.generateThumbnails(file, data.path, bucket, options);
      }

      return result;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[],
    options: UploadOptions = {},
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    let totalLoaded = 0;
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      const fileProgress = (progress: UploadProgress) => {
        const overallLoaded = totalLoaded + progress.loaded;
        const overallPercentage = (overallLoaded / totalSize) * 100;
        
        if (onProgress) {
          onProgress({
            loaded: overallLoaded,
            total: totalSize,
            percentage: overallPercentage
          });
        }
      };

      const result = await this.upload(file, {
        ...options,
        fileName: options.fileName ? `${i}_${options.fileName}` : file.name
      }, fileProgress);
      
      results.push(result);
      totalLoaded += file.size;
    }

    return results;
  }

  /**
   * Delete a file from Supabase Storage
   */
  async delete(path: string, bucket?: string): Promise<void> {
    try {
      const targetBucket = bucket || this.config.buckets.services;
      
      const { error } = await this.client.storage
        .from(targetBucket)
        .remove([path]);

      if (error) {
        throw this.handleStorageError(error);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(paths: string[], bucket?: string): Promise<void> {
    try {
      const targetBucket = bucket || this.config.buckets.services;
      
      const { error } = await this.client.storage
        .from(targetBucket)
        .remove(paths);

      if (error) {
        throw this.handleStorageError(error);
      }
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string, bucket?: string): string {
    const targetBucket = bucket || this.config.buckets.services;
    
    const { data } = this.client.storage
      .from(targetBucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Get signed URL for private access
   */
  async getSignedUrl(path: string, expiresIn: number = 3600, bucket?: string): Promise<string> {
    try {
      const targetBucket = bucket || this.config.buckets.services;
      
      const { data, error } = await this.client.storage
        .from(targetBucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw this.handleStorageError(error);
      }

      return data.signedUrl;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Check if file exists
   */
  async exists(path: string, bucket?: string): Promise<boolean> {
    try {
      const targetBucket = bucket || this.config.buckets.services;
      
      const { data, error } = await this.client.storage
        .from(targetBucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        });

      if (error) {
        return false;
      }

      return data.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string, bucket?: string): Promise<FileMetadata> {
    try {
      const targetBucket = bucket || this.config.buckets.services;
      
      const { data, error } = await this.client.storage
        .from(targetBucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          search: path.split('/').pop()
        });

      if (error || data.length === 0) {
        throw new Error(`File not found: ${path}`);
      }

      const fileInfo = data[0];
      
      return {
        name: fileInfo.name,
        size: fileInfo.metadata?.size || 0,
        type: fileInfo.metadata?.mimetype || 'application/octet-stream',
        lastModified: new Date(fileInfo.updated_at || fileInfo.created_at).getTime()
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generate thumbnails for images
   */
  private async generateThumbnails(
    file: File,
    originalPath: string,
    bucket: string,
    options: UploadOptions
  ): Promise<{ size: string; url: string }[]> {
    const thumbnails: { size: string; url: string }[] = [];
    const defaultSizes = [
      { width: 150, height: 150 },
      { width: 300, height: 300 },
      { width: 600, height: 600 }
    ];
    
    const sizes = options.thumbnailSizes || defaultSizes;

    for (const size of sizes) {
      try {
        // Create thumbnail using canvas (basic implementation)
        const thumbnailFile = await this.createThumbnail(file, size.width, size.height);
        const thumbnailPath = originalPath.replace(/\.[^/.]+$/, `_thumb_${size.width}x${size.height}$&`);
        
        const { data, error } = await this.client.storage
          .from(bucket)
          .upload(thumbnailPath, thumbnailFile, {
            cacheControl: '3600',
            upsert: false
          });

        if (!error && data) {
          thumbnails.push({
            size: `${size.width}x${size.height}`,
            url: this.getPublicUrl(data.path, bucket)
          });
        }
      } catch (error) {
        console.warn(`Failed to generate thumbnail ${size.width}x${size.height}:`, error);
      }
    }

    return thumbnails;
  }

  /**
   * Create thumbnail using canvas
   */
  private async createThumbnail(file: File, width: number, height: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        canvas.width = width;
        canvas.height = height;
        
        // Calculate aspect ratio
        const aspectRatio = img.width / img.height;
        let drawWidth = width;
        let drawHeight = height;
        let offsetX = 0;
        let offsetY = 0;

        if (aspectRatio > 1) {
          drawHeight = width / aspectRatio;
          offsetY = (height - drawHeight) / 2;
        } else {
          drawWidth = height * aspectRatio;
          offsetX = (width - drawWidth) / 2;
        }

        ctx!.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const thumbnailFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(thumbnailFile);
          } else {
            reject(new Error('Failed to create thumbnail blob'));
          }
        }, 'image/jpeg', 0.8);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Handle Supabase storage errors
   */
  private handleStorageError(error: unknown): StorageError {
    const errorObj = error as Record<string, unknown>;
    return {
      code: (typeof errorObj?.statusCode === 'string' ? errorObj.statusCode : 'STORAGE_ERROR'),
      message: (typeof errorObj?.message === 'string' ? errorObj.message : 'Storage operation failed'),
      details: error
    };
  }

  /**
   * Handle general errors
   */
  private handleError(error: unknown): Error {
    if (error instanceof Error) {
      return error;
    }
    return new Error(`Storage operation failed: ${JSON.stringify(error)}`);
  }
}