import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Image, FileText, AlertCircle, CheckCircle } from '../../lib/icons';
import { cn } from '../../lib/utils';
import { ValidationRule, ValidationResult } from '../../lib/storage/types';
import { validateFile, formatFileSize, isImageFile } from '../../lib/storage';

interface FileUploadProps {
  // Core props
  onFilesSelected: (files: File[]) => void;
  onFilesRemoved?: (files: File[]) => void;
  
  // Configuration
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  accept?: string;
  validationRules?: ValidationRule;
  
  // UI customization
  className?: string;
  disabled?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  children?: React.ReactNode;
  
  // Labels and text
  label?: string;
  description?: string;
  dragText?: string;
  browseText?: string;
  
  // Upload state
  uploading?: boolean;
  uploadProgress?: number;
  
  // Error handling
  error?: string;
  onError?: (error: string) => void;
}

interface FileWithPreview extends File {
  preview?: string | undefined;
  id: string;
  validationResult?: ValidationResult | undefined;
}

export function FileUpload({
  onFilesSelected,
  onFilesRemoved,
  multiple = false,
  maxFiles = 5,
  maxSize,
  accept,
  validationRules,
  className,
  disabled = false,
  showPreview = true,
  showProgress = false,
  children,
  label,
  description,
  dragText = 'Trascina i file qui o clicca per selezionare',
  browseText = 'Sfoglia file',
  uploading = false,
  uploadProgress = 0,
  error,
  onError
}: FileUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelection = useCallback(async (files: FileList) => {
    const fileArray = Array.from(files);
    
    // Check max files limit
    if (selectedFiles.length + fileArray.length > maxFiles) {
      const errorMsg = `Massimo ${maxFiles} file consentiti`;
      onError?.(errorMsg);
      return;
    }

    // Process files
    const processedFiles: FileWithPreview[] = [];
    
    for (const file of fileArray) {
      const fileWithPreview: FileWithPreview = Object.assign(file, {
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        preview: undefined,
        validationResult: undefined
      });

      // Basic size validation if maxSize is provided
      if (maxSize && file.size > maxSize) {
        const errorMsg = `File ${file.name} troppo grande (max ${formatFileSize(maxSize)})`;
        onError?.(errorMsg);
        continue;
      }

      // Validate file if rules provided
      if (validationRules) {
        const validation = validateFile(file, validationRules);
        fileWithPreview.validationResult = validation;
        
        if (!validation.isValid) {
          onError?.(validation.errors.join(', '));
          continue;
        }
      }

      // Generate preview for images
      if (showPreview && isImageFile(file)) {
        try {
          fileWithPreview.preview = URL.createObjectURL(file);
        } catch {
          console.warn('Failed to create preview for file:', file.name);
        }
      }

      processedFiles.push(fileWithPreview);
    }

    if (processedFiles.length > 0) {
      const newFiles = multiple ? [...selectedFiles, ...processedFiles] : processedFiles;
      setSelectedFiles(newFiles);
      onFilesSelected(newFiles);
    }
  }, [selectedFiles, maxFiles, multiple, validationRules, showPreview, onFilesSelected, onError]);

  // Handle file input change
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      handleFileSelection(files);
    }
    // Reset input value to allow selecting the same file again
    event.target.value = '';
  };

  // Handle drag and drop
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = event.dataTransfer.files;
    if (files) {
      handleFileSelection(files);
    }
  };

  // Remove file
  const removeFile = (fileId: string) => {
    const fileToRemove = selectedFiles.find(f => f.id === fileId);
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview);
    }
    
    const newFiles = selectedFiles.filter(f => f.id !== fileId);
    setSelectedFiles(newFiles);
    onFilesSelected(newFiles);
    onFilesRemoved?.([fileToRemove as File]);
  };

  // Clear all files
  const clearAllFiles = () => {
    selectedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    
    onFilesRemoved?.(selectedFiles);
    setSelectedFiles([]);
    onFilesSelected([]);
  };

  // Click to browse
  const handleBrowseClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  // Cleanup previews on unmount
  React.useEffect(() => {
    return () => {
      selectedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, [selectedFiles]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      {/* Description */}
      {description && (
        <p className="text-sm text-gray-500">{description}</p>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-colors',
          {
            'border-blue-300 bg-blue-50': isDragOver && !disabled,
            'border-gray-300 hover:border-gray-400': !isDragOver && !disabled,
            'border-gray-200 bg-gray-50 cursor-not-allowed': disabled,
            'border-red-300 bg-red-50': error
          }
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {children ? (
          <div onClick={handleBrowseClick} className="cursor-pointer">
            {children}
          </div>
        ) : (
          <div className="text-center">
            <Upload className={cn(
              'mx-auto h-12 w-12 mb-4',
              {
                'text-blue-500': isDragOver && !disabled,
                'text-gray-400': !isDragOver && !disabled,
                'text-gray-300': disabled,
                'text-red-400': error
              }
            )} />
            
            <div className="space-y-2">
              <p className={cn(
                'text-sm',
                {
                  'text-blue-600': isDragOver && !disabled,
                  'text-gray-600': !isDragOver && !disabled,
                  'text-gray-400': disabled,
                  'text-red-600': error
                }
              )}>
                {dragText}
              </p>
              
              <button
                type="button"
                onClick={handleBrowseClick}
                disabled={disabled}
                className={cn(
                  'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md transition-colors',
                  {
                    'text-blue-700 bg-blue-100 hover:bg-blue-200': !disabled,
                    'text-gray-400 bg-gray-100 cursor-not-allowed': disabled
                  }
                )}
              >
                {browseText}
              </button>
            </div>
            
            {/* File count info */}
            {maxFiles > 1 && (
              <p className="text-xs text-gray-500 mt-2">
                {selectedFiles.length} di {maxFiles} file selezionati
              </p>
            )}
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={disabled}
        />
      </div>

      {/* Upload Progress */}
      {showProgress && uploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Caricamento in corso...</span>
            <span>{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 text-red-600 text-sm">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* File Preview List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-medium text-gray-700">
              File selezionati ({selectedFiles.length})
            </h4>
            {selectedFiles.length > 1 && (
              <button
                type="button"
                onClick={clearAllFiles}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Rimuovi tutti
              </button>
            )}
          </div>
          
          <div className="space-y-2">
            {selectedFiles.map((file) => (
              <FilePreview
                key={file.id}
                file={file}
                onRemove={() => removeFile(file.id)}
                showPreview={showPreview}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// File Preview Component
interface FilePreviewProps {
  file: FileWithPreview;
  onRemove: () => void;
  showPreview: boolean;
}

function FilePreview({ file, onRemove, showPreview }: FilePreviewProps) {
  const isImage = isImageFile(file);
  const hasError = file.validationResult && !file.validationResult.isValid;

  return (
    <div className={cn(
      'flex items-center space-x-3 p-3 border rounded-lg',
      {
        'border-red-200 bg-red-50': hasError,
        'border-gray-200 bg-gray-50': !hasError
      }
    )}>
      {/* File Icon/Preview */}
      <div className="flex-shrink-0">
        {showPreview && isImage && file.preview ? (
          <img
            src={file.preview}
            alt={file.name}
            className="h-12 w-12 object-cover rounded"
          />
        ) : (
          <div className="h-12 w-12 bg-gray-200 rounded flex items-center justify-center">
            {isImage ? (
              <Image className="h-6 w-6 text-gray-400" />
            ) : (
              <FileText className="h-6 w-6 text-gray-400" />
            )}
          </div>
        )}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {file.name || 'File senza nome'}
        </p>
        <p className="text-xs text-gray-500">
          {formatFileSize(file.size || 0)}
        </p>
        
        {/* Validation Status */}
        {file.validationResult && (
          <div className="flex items-center space-x-1 mt-1">
            {file.validationResult.isValid ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">Valido</span>
              </>
            ) : (
              <>
                <AlertCircle className="h-3 w-3 text-red-500" />
                <span className="text-xs text-red-600">
                  {file.validationResult.errors?.[0] || 'Errore di validazione'}
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Remove Button */}
      <button
        type="button"
        onClick={onRemove}
        className="flex-shrink-0 p-1 text-gray-400 hover:text-red-500 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}