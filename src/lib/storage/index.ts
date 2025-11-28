// Main exports for the storage system

// Core types and interfaces
export type {
  FileMetadata,
  UploadOptions,
  StorageProvider,
  SupabaseConfig,
  CloudinaryConfig,
  S3Config,
  OptimizationOptions,
  ResizeOptions,
  CacheConfig
} from './types';

// Storage adapter and providers
export { StorageAdapter } from './StorageAdapter';
export { SupabaseStorageProvider } from './providers/SupabaseStorageProvider';

// Configuration
export {
  getStorageConfig,
  validateStorageConfig,
  storageConfig
} from './config';

// Validation utilities
export {
  validateFile,
  formatFileSize,
  validateFiles,
  validateFileSecurity,
  isImageFile,
  isPDFFile
} from './utils/validation';

// Optimization utilities
export {
  optimizeImage,
  calculateCompressionRatio,
  getImageDimensions,
  shouldOptimizeImage
} from './utils/optimization';

// Cache system
export {
  ImageCache,
  getImageCache
} from './cache/ImageCache';

// React components and hooks
export { FileUpload } from '../../components/ui/FileUpload';
export {
  useFileUpload,
  useServiceImageUpload,
  useProfileImageUpload,
  useCertificationUpload
} from '../../hooks/useFileUpload';
export {
  useImageCache,
  useImagePreloader,
  useCacheManager,
  useServiceImage,
  useProfileImage
} from '../../hooks/useImageCache';

// Storage instance factory
import { StorageAdapter } from './StorageAdapter';
import { SupabaseStorageProvider } from './providers/SupabaseStorageProvider';
import { getStorageConfig } from './config';

/**
 * Create a configured storage instance
 */
export function createStorageInstance(): StorageAdapter {
  const config = getStorageConfig();
  const provider = new SupabaseStorageProvider(config.supabase);
  return new StorageAdapter(provider);
}

/**
 * Global storage instance (singleton)
 */
let globalStorageInstance: StorageAdapter | null = null;

/**
 * Get the global storage instance
 */
export function getStorageInstance(): StorageAdapter {
  if (!globalStorageInstance) {
    globalStorageInstance = createStorageInstance();
  }
  return globalStorageInstance;
}

/**
 * Reset the global storage instance (useful for testing)
 */
export function resetStorageInstance(): void {
  globalStorageInstance = null;
}

// Error classes
export class StorageError extends Error {
  constructor(
    message: string,
    public code?: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, public field?: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class OptimizationError extends StorageError {
  constructor(message: string, originalError?: Error) {
    super(message, 'OPTIMIZATION_ERROR', originalError);
    this.name = 'OptimizationError';
  }
}

export class CacheError extends StorageError {
  constructor(message: string, originalError?: Error) {
    super(message, 'CACHE_ERROR', originalError);
    this.name = 'CacheError';
  }
}

// Constants
export const SUPPORTED_IMAGE_FORMATS = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml'
] as const;

export const SUPPORTED_DOCUMENT_FORMATS = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
] as const;

export const MAX_FILE_SIZES = {
  image: 10 * 1024 * 1024, // 10MB
  document: 25 * 1024 * 1024, // 25MB
  avatar: 5 * 1024 * 1024, // 5MB
  certification: 15 * 1024 * 1024 // 15MB
} as const;

export const BUCKET_NAMES = {
  services: 'service-images',
  profiles: 'profile-images', 
  certifications: 'certifications',
  temp: 'temp-uploads'
} as const;

// Utility functions
export function generateFileName(originalName: string, prefix?: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const baseName = originalName.split('.').slice(0, -1).join('.');
  const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-');
  
  return prefix 
    ? `${prefix}-${timestamp}-${random}-${sanitizedName}.${extension}`
    : `${timestamp}-${random}-${sanitizedName}.${extension}`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

export function getMimeTypeFromExtension(extension: string): string {
  const mimeMap: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    gif: 'image/gif',
    svg: 'image/svg+xml',
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
  
  return mimeMap[extension.toLowerCase()] || 'application/octet-stream';
}



export function isDocumentFile(file: File | string): boolean {
  const mimeType = typeof file === 'string'
    ? getMimeTypeFromExtension(getFileExtension(file))
    : file.type;
  
  return SUPPORTED_DOCUMENT_FORMATS.includes(mimeType as typeof SUPPORTED_DOCUMENT_FORMATS[number]);
}