import { 
  StorageProvider, 
  StorageConfig, 
  UploadOptions, 
  UploadResult, 
  UploadProgress,
  ValidationRule,
  ValidationResult,
  OptimizationOptions,
  FileMetadata
} from './types';
import { SupabaseStorageProvider } from './providers/SupabaseStorageProvider';
import { validateFile } from './utils/validation';
import { optimizeImage } from './utils/optimization';

/**
 * Main Storage Adapter - Provides a unified interface for file storage
 * Supports multiple storage providers through the adapter pattern
 */
export class StorageAdapter {
  private provider: StorageProvider;
  private config: StorageConfig;
  private defaultValidationRules: ValidationRule;

  constructor(config: StorageConfig) {
    this.config = config;
    this.provider = this.createProvider(config);
    
    // Default validation rules
    this.defaultValidationRules = {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
      allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.pdf'],
      maxWidth: 4096,
      maxHeight: 4096
    };
  }

  private createProvider(config: StorageConfig): StorageProvider {
    switch (config.provider) {
      case 'supabase':
        return new SupabaseStorageProvider(config as SupabaseStorageConfig);
      case 'cloudinary':
        throw new Error('Cloudinary provider not implemented yet');
      case 's3':
        throw new Error('S3 provider not implemented yet');
      default: {
        // TypeScript should ensure this never happens, but we handle it for runtime safety
        const exhaustiveCheck: never = config;
        throw new Error(`Unsupported storage provider: ${(exhaustiveCheck as StorageConfig).provider}`);
      }
    }
  }

  /**
   * Upload a single file with validation and optimization
   */
  async upload(
    file: File,
    options: UploadOptions = {},
    validationRules?: ValidationRule,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    // Validate file
    const validation = await this.validateFile(file, validationRules);
    if (!validation.isValid) {
      // Ensure errors array exists and is not undefined
      const errorMessages = validation.errors && Array.isArray(validation.errors) 
        ? validation.errors.join(', ') 
        : 'Unknown validation error';
      throw new Error(`File validation failed: ${errorMessages}`);
    }

    let processedFile = file;

    // Optimize image if requested and file is an image
    if (options.optimize && file.type.startsWith('image/')) {
      try {
        processedFile = await this.optimizeFile(file, options);
      } catch (error) {
        console.warn('Image optimization failed, using original file:', error);
      }
    }

    // Upload using the configured provider
    return await this.provider.upload(processedFile, options, onProgress);
  }

  /**
   * Upload multiple files
   */
  async uploadMultiple(
    files: File[],
    options: UploadOptions = {},
    validationRules?: ValidationRule,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    // Validate all files first
    for (const file of files) {
      const validation = await this.validateFile(file, validationRules);
      if (!validation.isValid) {
        // Ensure errors array exists and is not undefined
        const errorMessages = validation.errors && Array.isArray(validation.errors) 
          ? validation.errors.join(', ') 
          : 'Unknown validation error';
        throw new Error(`File validation failed for ${file.name}: ${errorMessages}`);
      }
    }

    // Process files if optimization is enabled
    const processedFiles: File[] = [];
    for (const file of files) {
      if (options.optimize && file.type.startsWith('image/')) {
        try {
          const optimized = await this.optimizeFile(file, options);
          processedFiles.push(optimized);
        } catch (error) {
          console.warn(`Image optimization failed for ${file.name}, using original:`, error);
          processedFiles.push(file);
        }
      } else {
        processedFiles.push(file);
      }
    }

    return await this.provider.uploadMultiple(processedFiles, options, onProgress);
  }

  /**
   * Delete a file
   */
  async delete(path: string): Promise<void> {
    return await this.provider.delete(path);
  }

  /**
   * Delete multiple files
   */
  async deleteMultiple(paths: string[]): Promise<void> {
    return await this.provider.deleteMultiple(paths);
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(path: string): string {
    return this.provider.getPublicUrl(path);
  }

  /**
   * Get signed URL for private files
   */
  async getSignedUrl(path: string, expiresIn?: number): Promise<string> {
    return await this.provider.getSignedUrl(path, expiresIn);
  }

  /**
   * Check if file exists
   */
  async exists(path: string): Promise<boolean> {
    return await this.provider.exists(path);
  }

  /**
   * Get file metadata
   */
  async getMetadata(path: string): Promise<FileMetadata> {
    return await this.provider.getMetadata(path);
  }

  /**
   * Validate file against rules
   */
  private async validateFile(file: File, customRules?: ValidationRule): Promise<ValidationResult> {
    const rules = { ...this.defaultValidationRules, ...customRules };
    console.log('🔍 [StorageAdapter] Validating file with rules:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      rules: rules
    });
    
    const result = await validateFile(file, rules);
    
    // Ensure the result always has a valid errors array
    if (!result.errors || !Array.isArray(result.errors)) {
      console.warn('⚠️ [StorageAdapter] Validation result missing errors array, initializing empty array');
      result.errors = [];
    }
    
    console.log('✅ [StorageAdapter] Validation completed:', result);
    return result;
  }

  /**
   * Optimize image file
   */
  private async optimizeFile(file: File, options: UploadOptions): Promise<File> {
    const optimizationOptions: OptimizationOptions = {
      quality: 85,
      format: 'webp',
      progressive: true,
      ...options
    };

    return await optimizeImage(file, optimizationOptions);
  }

  /**
   * Get storage provider info
   */
  getProviderInfo() {
    return {
      name: this.provider.name,
      config: this.config.provider
    };
  }

  /**
   * Generate organized file path based on context
   */
  generatePath(context: 'service' | 'profile' | 'certification' | 'temp', userId: string, fileName: string): string {
    const timestamp = Date.now();
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    
    switch (context) {
      case 'service':
        return `services/${userId}/${timestamp}_${sanitizedFileName}`;
      case 'profile':
        return `profiles/${userId}/${timestamp}_${sanitizedFileName}`;
      case 'certification':
        return `certifications/${userId}/${timestamp}_${sanitizedFileName}`;
      case 'temp':
        return `temp/${userId}/${timestamp}_${sanitizedFileName}`;
      default:
        return `misc/${userId}/${timestamp}_${sanitizedFileName}`;
    }
  }
}