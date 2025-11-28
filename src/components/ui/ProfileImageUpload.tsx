import React, { useState } from 'react';
import { Upload, X, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

interface ProfileImageUploadProps {
  bucket: string;
  path: string;
  accept?: string;
  maxSize?: number;
  onUploadComplete?: (url: string) => void;
  onUploadError?: (error: string) => void;
  className?: string;
  currentImageUrl?: string | null;
}

export function ProfileImageUpload({
  bucket,
  path,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB
  onUploadComplete,
  onUploadError,
  className,
  currentImageUrl
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'Il file deve essere un\'immagine' };
    }

    // Check file size
    if (file.size > maxSize) {
      return { 
        valid: false, 
        error: `Il file è troppo grande. Massimo ${formatFileSize(maxSize)}` 
      };
    }

    // Check accepted types
    if (accept !== 'image/*') {
      const acceptedTypes = accept.split(',').map(type => type.trim());
      const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
      if (!acceptedTypes.includes(file.type) && !acceptedTypes.includes(fileExtension)) {
        return { valid: false, error: 'Tipo di file non supportato' };
      }
    }

    return { valid: true };
  };

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);
      setProgress(0);

      // Validate file
      const validation = validateFile(file);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${path}/${fileName}`;

      // Upload to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setProgress(100);
      onUploadComplete?.(publicUrl);
      toast.success('Immagine caricata con successo!');

    } catch (error) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore durante il caricamento';
      onUploadError?.(errorMessage);
      toast.error(errorMessage);
    } finally {
      setUploading(false);
      setProgress(0);
      setPreviewUrl(null);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    if (uploading) return;
    
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!uploading) {
      setDragActive(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
    // Reset input value
    e.target.value = '';
  };

  const clearPreview = () => {
    setPreviewUrl(null);
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Current Image Preview */}
      {(currentImageUrl || previewUrl) && (
        <div className="flex items-center gap-4">
          <div className="relative">
            <img
              src={previewUrl || currentImageUrl || ''}
              alt="Anteprima immagine profilo"
              className="w-24 h-24 rounded-full object-cover border-2 border-gray-200"
            />
            {previewUrl && (
              <button
                onClick={clearPreview}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900">
              {previewUrl ? 'Nuova immagine' : 'Immagine attuale'}
            </p>
            <p className="text-xs text-gray-500">
              Formati supportati: JPG, PNG, WebP
            </p>
          </div>
        </div>
      )}

      {/* Upload Area */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200',
          {
            'border-blue-300 bg-blue-50': dragActive,
            'border-gray-300 hover:border-gray-400': !dragActive && !uploading,
            'border-gray-200 bg-gray-50': uploading,
            'cursor-pointer': !uploading
          }
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!uploading) {
            document.getElementById('profile-image-input')?.click();
          }
        }}
      >
        <div className="text-center">
          {uploading ? (
            <div className="space-y-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Caricamento in corso...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{progress}%</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className={cn(
                'mx-auto h-8 w-8',
                dragActive ? 'text-blue-500' : 'text-gray-400'
              )} />
              <div>
                <p className={cn(
                  'text-sm font-medium',
                  dragActive ? 'text-blue-600' : 'text-gray-900'
                )}>
                  Trascina un'immagine qui o clicca per selezionare
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Massimo {formatFileSize(maxSize)} • JPG, PNG, WebP
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Hidden file input */}
        <input
          id="profile-image-input"
          type="file"
          accept={accept}
          onChange={handleInputChange}
          className="hidden"
          disabled={uploading}
        />
      </div>

      {/* Upload Status */}
      {uploading && (
        <div className="flex items-center space-x-2 text-blue-600 text-sm">
          <CheckCircle className="h-4 w-4" />
          <span>Caricamento dell'immagine in corso...</span>
        </div>
      )}
    </div>
  );
}