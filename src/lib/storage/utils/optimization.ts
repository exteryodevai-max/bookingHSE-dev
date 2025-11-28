import { OptimizationOptions } from '../types';

/**
 * Optimize an image file using canvas and compression
 */
export async function optimizeImage(file: File, options: OptimizationOptions): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      try {
        const { width: originalWidth, height: originalHeight } = img;
        
        // Calculate new dimensions
        const { width: newWidth, height: newHeight } = calculateDimensions(
          originalWidth,
          originalHeight,
          options.resize
        );

        canvas.width = newWidth;
        canvas.height = newHeight;

        // Apply image smoothing for better quality
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Draw the resized image
        ctx.drawImage(img, 0, 0, newWidth, newHeight);

        // Determine output format
        const outputFormat = determineOutputFormat(file.type, options.format);
        const quality = (options.quality || 85) / 100;

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const optimizedFile = new File([blob], file.name, {
                type: outputFormat,
                lastModified: Date.now()
              });
              resolve(optimizedFile);
            } else {
              reject(new Error('Failed to create optimized image blob'));
            }
          },
          outputFormat,
          quality
        );

        // Clean up
        URL.revokeObjectURL(img.src);
      } catch (error) {
        URL.revokeObjectURL(img.src);
        reject(error);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for optimization'));
    };

    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions based on resize options
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  resize?: OptimizationOptions['resize']
): { width: number; height: number } {
  if (!resize) {
    return { width: originalWidth, height: originalHeight };
  }

  const { width: targetWidth, height: targetHeight, fit = 'cover' } = resize;

  // If no target dimensions specified, return original
  if (!targetWidth && !targetHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  // If only one dimension specified, maintain aspect ratio
  if (targetWidth && !targetHeight) {
    const aspectRatio = originalHeight / originalWidth;
    return {
      width: targetWidth,
      height: Math.round(targetWidth * aspectRatio)
    };
  }

  if (targetHeight && !targetWidth) {
    const aspectRatio = originalWidth / originalHeight;
    return {
      width: Math.round(targetHeight * aspectRatio),
      height: targetHeight
    };
  }

  // Both dimensions specified
  const targetAspectRatio = targetWidth! / targetHeight!;
  const originalAspectRatio = originalWidth / originalHeight;

  switch (fit) {
    case 'contain':
      // Fit entire image within target dimensions
      if (originalAspectRatio > targetAspectRatio) {
        return {
          width: targetWidth!,
          height: Math.round(targetWidth! / originalAspectRatio)
        };
      } else {
        return {
          width: Math.round(targetHeight! * originalAspectRatio),
          height: targetHeight!
        };
      }

    case 'fill':
      // Stretch to exact dimensions (may distort)
      return {
        width: targetWidth!,
        height: targetHeight!
      };

    case 'cover':
    default:
      // Cover entire target area (may crop)
      if (originalAspectRatio > targetAspectRatio) {
        return {
          width: Math.round(targetHeight! * originalAspectRatio),
          height: targetHeight!
        };
      } else {
        return {
          width: targetWidth!,
          height: Math.round(targetWidth! / originalAspectRatio)
        };
      }
  }
}

/**
 * Determine the best output format based on input and options
 */
function determineOutputFormat(
  originalType: string,
  requestedFormat?: OptimizationOptions['format']
): string {
  if (requestedFormat && requestedFormat !== 'auto') {
    switch (requestedFormat) {
      case 'webp':
        return 'image/webp';
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
    }
  }

  // Auto format selection
  if (requestedFormat === 'auto' || !requestedFormat) {
    // Use WebP if supported, otherwise fall back to JPEG for photos, PNG for graphics
    if (isWebPSupported()) {
      return 'image/webp';
    }
    
    // For PNG images with transparency, keep as PNG
    if (originalType === 'image/png') {
      return 'image/png';
    }
    
    // Default to JPEG for photos
    return 'image/jpeg';
  }

  // Fallback to original type
  return originalType;
}

/**
 * Check if WebP is supported by the browser
 */
function isWebPSupported(): boolean {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
}

/**
 * Create multiple optimized versions of an image
 */
export async function createImageVariants(
  file: File,
  variants: Array<{ name: string; options: OptimizationOptions }>
): Promise<Array<{ name: string; file: File }>> {
  const results: Array<{ name: string; file: File }> = [];

  for (const variant of variants) {
    try {
      const optimizedFile = await optimizeImage(file, variant.options);
      results.push({
        name: variant.name,
        file: optimizedFile
      });
    } catch (error) {
      console.warn(`Failed to create variant '${variant.name}':`, error);
    }
  }

  return results;
}

/**
 * Predefined optimization presets
 */
export const OptimizationPresets = {
  // High quality for hero images
  hero: {
    quality: 90,
    format: 'webp' as const,
    resize: { width: 1920, height: 1080, fit: 'cover' as const },
    progressive: true
  },

  // Medium quality for gallery images
  gallery: {
    quality: 85,
    format: 'webp' as const,
    resize: { width: 800, height: 600, fit: 'cover' as const },
    progressive: true
  },

  // Small thumbnails
  thumbnail: {
    quality: 80,
    format: 'webp' as const,
    resize: { width: 300, height: 300, fit: 'cover' as const },
    progressive: false
  },

  // Profile avatars
  avatar: {
    quality: 85,
    format: 'webp' as const,
    resize: { width: 200, height: 200, fit: 'cover' as const },
    progressive: false
  },

  // Service card images
  serviceCard: {
    quality: 85,
    format: 'webp' as const,
    resize: { width: 400, height: 300, fit: 'cover' as const },
    progressive: true
  },

  // High compression for mobile
  mobile: {
    quality: 75,
    format: 'webp' as const,
    resize: { width: 600, height: 400, fit: 'cover' as const },
    progressive: true
  }
};

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(originalSize: number, compressedSize: number): number {
  return Math.round(((originalSize - compressedSize) / originalSize) * 100);
}

/**
 * Get image dimensions without loading the full image
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    
    img.onload = () => {
      const dimensions = {
        width: img.naturalWidth,
        height: img.naturalHeight
      };
      URL.revokeObjectURL(img.src);
      resolve(dimensions);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image'));
    };
    
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Check if image needs optimization
 */
export function shouldOptimizeImage(file: File, maxSize: number = 1024 * 1024): boolean {
  // Optimize if file is larger than maxSize (default 1MB)
  if (file.size > maxSize) {
    return true;
  }
  
  // Optimize if format is not WebP and WebP is supported
  if (file.type !== 'image/webp' && isWebPSupported()) {
    return true;
  }
  
  return false;
}