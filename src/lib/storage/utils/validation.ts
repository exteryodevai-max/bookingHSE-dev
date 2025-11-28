import { ValidationRule, ValidationResult } from '../types';

/**
 * Validate a file against specified rules
 */
export function validateFile(file: File, rules: ValidationRule): ValidationResult | Promise<ValidationResult> {
  console.log('🔍 [Validation] Starting file validation:', {
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    rules: rules
  });

  const errors: string[] = [];

  // Check file size
  if (rules.maxSize && file.size > rules.maxSize) {
    const maxSizeMB = (rules.maxSize / (1024 * 1024)).toFixed(1);
    const fileSizeMB = (file.size / (1024 * 1024)).toFixed(1);
    const sizeError = `File size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`;
    console.log('❌ [Validation] Size validation failed:', sizeError);
    errors.push(sizeError);
  }

  // Check file type
  if (rules.allowedTypes && file.type && !rules.allowedTypes.includes(file.type)) {
    const typeError = `File type '${file.type}' is not allowed. Allowed types: ${rules.allowedTypes.join(', ')}`;
    console.log('❌ [Validation] Type validation failed:', typeError);
    errors.push(typeError);
  }

  // Check file extension
  if (rules.allowedExtensions) {
    const fileExtension = getFileExtension(file.name);
    if (!rules.allowedExtensions.includes(fileExtension)) {
      const extensionError = `File extension '${fileExtension}' is not allowed. Allowed extensions: ${rules.allowedExtensions.join(', ')}`;
      console.log('❌ [Validation] Extension validation failed:', extensionError);
      errors.push(extensionError);
    }
  }

  // For images, check dimensions if rules are provided
  if (file.type && file.type.startsWith('image/') && (rules.minWidth || rules.minHeight || rules.maxWidth || rules.maxHeight)) {
    console.log('🖼️ [Validation] Image detected, checking dimensions asynchronously...');
    return validateImageDimensions(file, rules, errors);
  }

  const result = {
    isValid: errors.length === 0,
    errors
  };

  console.log('✅ [Validation] Synchronous validation completed:', result);
  return result;
}

/**
 * Validate image dimensions asynchronously
 */
function validateImageDimensions(file: File, rules: ValidationRule, existingErrors: string[]): Promise<ValidationResult> {
  return new Promise((resolve) => {
    console.log('🖼️ [Validation] Creating image object for dimension validation...');
    const img = new Image();
    const errors = [...existingErrors];

    img.onload = () => {
      const { width, height } = img;
      console.log('📐 [Validation] Image dimensions loaded:', { width, height });

      if (rules.minWidth && width < rules.minWidth) {
        const widthError = `Image width (${width}px) is below minimum required width (${rules.minWidth}px)`;
        console.log('❌ [Validation] Min width validation failed:', widthError);
        errors.push(widthError);
      }

      if (rules.minHeight && height < rules.minHeight) {
        const heightError = `Image height (${height}px) is below minimum required height (${rules.minHeight}px)`;
        console.log('❌ [Validation] Min height validation failed:', heightError);
        errors.push(heightError);
      }

      if (rules.maxWidth && width > rules.maxWidth) {
        const maxWidthError = `Image width (${width}px) exceeds maximum allowed width (${rules.maxWidth}px)`;
        console.log('❌ [Validation] Max width validation failed:', maxWidthError);
        errors.push(maxWidthError);
      }

      if (rules.maxHeight && height > rules.maxHeight) {
        const maxHeightError = `Image height (${height}px) exceeds maximum allowed height (${rules.maxHeight}px)`;
        console.log('❌ [Validation] Max height validation failed:', maxHeightError);
        errors.push(maxHeightError);
      }

      URL.revokeObjectURL(img.src);
      const result = {
        isValid: errors.length === 0,
        errors
      };
      console.log('✅ [Validation] Image dimension validation completed:', result);
      resolve(result);
    };

    img.onerror = (error) => {
      console.error('❌ [Validation] Image loading failed:', error);
      errors.push('Invalid image file or corrupted image data');
      URL.revokeObjectURL(img.src);
      const result = {
        isValid: false,
        errors
      };
      console.log('❌ [Validation] Image validation failed due to loading error:', result);
      resolve(result);
    };

    try {
      img.src = URL.createObjectURL(file);
      console.log('🔗 [Validation] Created object URL for image validation');
    } catch (error) {
      console.error('❌ [Validation] Failed to create object URL:', error);
      errors.push('Failed to process image file');
      resolve({
        isValid: false,
        errors
      });
    }
  });
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  if (!filename || typeof filename !== 'string') {
    return '';
  }
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex !== -1 ? filename.substring(lastDotIndex).toLowerCase() : '';
}

/**
 * Check if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type ? file.type.startsWith('image/') : false;
}

/**
 * Check if file is a PDF
 */
export function isPDFFile(file: File): boolean {
  return file.type ? file.type === 'application/pdf' : false;
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Validate multiple files
 */
export function validateFiles(files: File[], rules: ValidationRule): ValidationResult {
  const errors: string[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const result = validateFile(file, rules);
    
    if (!result.isValid) {
      errors.push(`File ${i + 1} (${file.name}): ${result.errors.join(', ')}`);
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Security validation - check for potentially dangerous files
 */
export function validateFileSecurity(file: File): ValidationResult {
  const errors: string[] = [];
  const dangerousExtensions = [
    '.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js', '.jar',
    '.app', '.deb', '.pkg', '.dmg', '.rpm', '.msi', '.run', '.sh', '.ps1'
  ];
  
  const fileExtension = getFileExtension(file.name);
  
  if (dangerousExtensions.includes(fileExtension)) {
    errors.push(`File type '${fileExtension}' is not allowed for security reasons`);
  }
  
  // Check for double extensions (e.g., image.jpg.exe)
  const parts = file.name.split('.');
  if (parts.length > 2) {
    const secondLastExtension = '.' + parts[parts.length - 2].toLowerCase();
    if (dangerousExtensions.includes(secondLastExtension)) {
      errors.push('Files with double extensions are not allowed for security reasons');
    }
  }
  
  // Check for suspicious MIME types
  const suspiciousMimeTypes = [
    'application/x-msdownload',
    'application/x-executable',
    'application/x-winexe',
    'application/x-msdos-program'
  ];
  
  if (file.type && suspiciousMimeTypes.includes(file.type)) {
    errors.push(`MIME type '${file.type}' is not allowed for security reasons`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Predefined validation rules for common use cases
 */
export const ValidationPresets = {
  // For service images
  serviceImages: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    minWidth: 400,
    minHeight: 300,
    maxWidth: 4096,
    maxHeight: 4096
  } as ValidationRule,
  
  // For profile avatars
  profileAvatars: {
    maxSize: 2 * 1024 * 1024, // 2MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp'],
    minWidth: 100,
    minHeight: 100,
    maxWidth: 2048,
    maxHeight: 2048
  } as ValidationRule,
  
  // For certification documents
  certificationDocuments: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/png'],
    allowedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
  } as ValidationRule,
  
  // For general documents
  documents: {
    maxSize: 15 * 1024 * 1024, // 15MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ],
    allowedExtensions: ['.pdf', '.doc', '.docx', '.txt']
  } as ValidationRule
};