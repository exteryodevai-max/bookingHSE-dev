// Storage Types and Interfaces

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface UploadOptions {
  bucket?: string;
  folder?: string;
  fileName?: string;
  maxSize?: number;
  allowedTypes?: string[];
  optimize?: boolean;
  generateThumbnail?: boolean;
  thumbnailSizes?: { width: number; height: number }[];
}

export interface UploadResult {
  url: string;
  path: string;
  size: number;
  thumbnails?: { size: string; url: string }[];
  metadata: FileMetadata;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface StorageError {
  code: string;
  message: string;
  details?: unknown;
}

// Storage Provider Interface
export interface StorageProvider {
  name: string;
  
  // Core upload functionality
  upload(
    file: File,
    options?: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult>;
  
  // Batch upload
  uploadMultiple(
    files: File[],
    options?: UploadOptions,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]>;
  
  // File management
  delete(path: string): Promise<void>;
  deleteMultiple(paths: string[]): Promise<void>;
  
  // URL generation
  getPublicUrl(path: string): string;
  getSignedUrl(path: string, expiresIn?: number): Promise<string>;
  
  // File info
  exists(path: string): Promise<boolean>;
  getMetadata(path: string): Promise<FileMetadata>;
}

// Configuration types for different providers
export interface SupabaseStorageConfig {
  provider: 'supabase';
  url: string;
  anonKey: string;
  buckets: {
    services: string;
    profiles: string;
    certifications: string;
    temp: string;
  };
}

export interface CloudinaryConfig {
  provider: 'cloudinary';
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  uploadPreset?: string;
}

export interface S3Config {
  provider: 's3';
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export type StorageConfig = SupabaseStorageConfig | CloudinaryConfig | S3Config;

// File validation
export interface ValidationRule {
  maxSize?: number; // in bytes
  allowedTypes?: string[];
  allowedExtensions?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Image optimization
export interface OptimizationOptions {
  quality?: number; // 0-100
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  resize?: {
    width?: number;
    height?: number;
    fit?: 'cover' | 'contain' | 'fill';
  };
  progressive?: boolean;
}

// Cache configuration
export interface CacheConfig {
  enabled: boolean;
  ttl: number; // Time to live in seconds
  maxSize: number; // Max cache size in MB
  strategy: 'lru' | 'fifo';
}