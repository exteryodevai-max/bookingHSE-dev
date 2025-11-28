import { SupabaseStorageConfig } from './types';

/**
 * Storage configuration for BookingHSE
 * Organized buckets for different types of content
 */
export const storageConfig: SupabaseStorageConfig = {
  provider: 'supabase',
  url: import.meta.env.VITE_SUPABASE_URL || '',
  anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  buckets: {
    // Service-related images (galleries, featured images)
    services: 'service-images',
    
    // User profile images (avatars, cover photos)
    profiles: 'profile-images',
    
    // Certification documents and images
    certifications: 'certifications',
    
    // Temporary uploads (for processing before moving to final location)
    temp: 'temp-uploads'
  }
};

/**
 * Bucket policies and configurations
 * These should be set up in Supabase Dashboard
 */
export const bucketConfigurations = {
  'service-images': {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 5 * 1024 * 1024, // 5MB
    description: 'Public bucket for service images and galleries'
  },
  
  'profile-images': {
    public: true,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    description: 'Public bucket for user profile images'
  },
  
  'certifications': {
    public: false, // Private bucket - requires authentication
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    fileSizeLimit: 10 * 1024 * 1024, // 10MB
    description: 'Private bucket for certification documents'
  },
  
  'temp-uploads': {
    public: false,
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    fileSizeLimit: 15 * 1024 * 1024, // 15MB
    description: 'Temporary storage for file processing',
    autoDelete: '24 hours' // Files auto-deleted after 24 hours
  }
};

/**
 * File organization patterns
 */
export const fileOrganization = {
  services: {
    pattern: 'services/{userId}/{serviceId}/{timestamp}_{filename}',
    folders: {
      gallery: 'gallery',
      featured: 'featured',
      thumbnails: 'thumbnails'
    }
  },
  
  profiles: {
    pattern: 'profiles/{userId}/{type}/{timestamp}_{filename}',
    folders: {
      avatar: 'avatar',
      cover: 'cover',
      portfolio: 'portfolio'
    }
  },
  
  certifications: {
    pattern: 'certifications/{userId}/{certId}/{timestamp}_{filename}',
    folders: {
      documents: 'documents',
      images: 'images'
    }
  },
  
  temp: {
    pattern: 'temp/{userId}/{sessionId}/{timestamp}_{filename}',
    cleanup: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
      batchSize: 100
    }
  }
};

/**
 * CDN and caching configuration
 */
export const cdnConfig = {
  // Supabase automatically provides CDN through their edge network
  cacheHeaders: {
    'Cache-Control': 'public, max-age=31536000', // 1 year for images
    'Vary': 'Accept-Encoding'
  },
  
  // Image transformation parameters (if using Supabase Image Transformations)
  transformations: {
    quality: 85,
    format: 'webp',
    progressive: true
  }
};

/**
 * Security policies for file uploads
 */
export const securityPolicies = {
  // Maximum files per upload batch
  maxFilesPerBatch: 10,
  
  // Rate limiting (files per minute per user)
  rateLimiting: {
    filesPerMinute: 20,
    bytesPerMinute: 50 * 1024 * 1024 // 50MB per minute
  },
  
  // Virus scanning (if implemented)
  virusScanning: {
    enabled: false, // Would require external service
    quarantineBucket: 'quarantine'
  },
  
  // Content validation
  contentValidation: {
    checkImageHeaders: true,
    validateMimeType: true,
    scanForMalware: false // Would require external service
  }
};

/**
 * Monitoring and analytics
 */
export const monitoringConfig = {
  // Track upload metrics
  metrics: {
    trackUploadTime: true,
    trackFileSize: true,
    trackCompressionRatio: true,
    trackErrorRates: true
  },
  
  // Logging configuration
  logging: {
    logLevel: 'info', // 'debug', 'info', 'warn', 'error'
    logUploads: true,
    logErrors: true,
    logPerformance: true
  }
};

/**
 * Environment-specific configurations
 */
export const environmentConfig = {
  development: {
    ...storageConfig,
    buckets: {
      services: 'service-images',
      profiles: 'profile-images',
      certifications: 'certifications',
      temp: 'temp-uploads'
    }
  },
  
  staging: {
    ...storageConfig,
    buckets: {
      services: 'service-images',
      profiles: 'profile-images',
      certifications: 'certifications',
      temp: 'temp-uploads'
    }
  },
  
  production: storageConfig
};

/**
 * Get configuration based on environment
 */
export function getStorageConfig(): SupabaseStorageConfig {
  const env = import.meta.env.MODE || 'development';
  
  switch (env) {
    case 'development':
      return environmentConfig.development;
    case 'staging':
      return environmentConfig.staging;
    case 'production':
      return environmentConfig.production;
    default:
      return environmentConfig.development;
  }
}

/**
 * Validate storage configuration
 */
export function validateStorageConfig(config: SupabaseStorageConfig): boolean {
  if (!config.url || !config.anonKey) {
    console.error('Missing Supabase URL or anonymous key in storage configuration');
    return false;
  }
  
  if (!config.buckets || Object.keys(config.buckets).length === 0) {
    console.error('No storage buckets configured');
    return false;
  }
  
  return true;
}

/**
 * Default export with current environment configuration
 */
export default getStorageConfig();