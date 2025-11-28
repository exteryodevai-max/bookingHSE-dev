import React, { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { useServiceImageUpload } from '@/hooks/useFileUpload';
import { useServiceImage } from '@/hooks/useImageCache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, Eye, Upload } from 'lucide-react';


interface ServiceImageUploadExampleProps {
  serviceId: string;
  existingImages?: string[];
  onImagesChange?: (images: string[]) => void;
  maxImages?: number;
}

/**
 * Example component showing how to integrate the file upload system
 * for service images with caching and optimization
 */
export function ServiceImageUploadExample({
  serviceId,
  existingImages = [],
  onImagesChange,
  maxImages = 10
}: ServiceImageUploadExampleProps) {
  const [images, setImages] = useState<string[]>(existingImages);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  
  const {
    uploadFiles,
    uploading,
    progress,
    error: uploadError,
    cancelUpload
  } = useServiceImageUpload();

  const handleFilesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const uploadedUrls = await uploadFiles(
        selectedFiles,
        `services/${serviceId}`
      );
      
      const newImages = [...images, ...uploadedUrls];
      setImages(newImages);
      setSelectedFiles([]);
      onImagesChange?.(newImages);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    setImages(newImages);
    onImagesChange?.(newImages);
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const canAddMore = images.length + selectedFiles.length < maxImages;

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Carica Immagini Servizio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canAddMore && (
            <FileUpload
              onFilesSelected={handleFilesSelected}
              accept="image/*"
              multiple
              maxFiles={maxImages - images.length}
              maxSize={10 * 1024 * 1024} // 10MB
              className="border-dashed border-2 border-gray-300 rounded-lg p-6"
            />
          )}

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">File Selezionati:</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedFiles.map((file, index) => (
                  <SelectedFilePreview
                    key={index}
                    file={file}
                    onRemove={() => handleRemoveSelectedFile(index)}
                  />
                ))}
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <Button 
                  onClick={handleUpload}
                  disabled={uploading}
                  className="flex-1"
                >
                  {uploading ? 'Caricamento...' : `Carica ${selectedFiles.length} File`}
                </Button>
                
                {uploading && (
                  <Button 
                    variant="outline" 
                    onClick={cancelUpload}
                    size="sm"
                  >
                    Annulla
                  </Button>
                )}
              </div>
              
              {uploading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {uploadError && (
            <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
              {uploadError}
            </div>
          )}

          <div className="text-sm text-gray-500">
            {images.length}/{maxImages} immagini caricate
          </div>
        </CardContent>
      </Card>

      {/* Existing Images Gallery */}
      {images.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Immagini Caricate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {images.map((imageUrl, index) => (
                <ImagePreview
                  key={imageUrl}
                  url={imageUrl}
                  index={index}
                  onRemove={() => handleRemoveImage(index)}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/**
 * Component for previewing selected files before upload
 */
function SelectedFilePreview({ 
  file, 
  onRemove 
}: { 
  file: File; 
  onRemove: () => void; 
}) {
  const [preview, setPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  return (
    <div className="relative group">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {preview ? (
          <img 
            src={preview} 
            alt={file.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <Upload className="h-8 w-8" />
          </div>
        )}
      </div>
      
      <Button
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
      
      <div className="mt-1 text-xs text-gray-600 truncate">
        {file.name}
      </div>
      
      <Badge variant="secondary" className="text-xs">
        {(file.size / 1024 / 1024).toFixed(1)} MB
      </Badge>
    </div>
  );
}

/**
 * Component for previewing uploaded images with caching
 */
function ImagePreview({ 
  url, 
  index, 
  onRemove 
}: { 
  url: string; 
  index: number; 
  onRemove: () => void; 
}) {
  // Use cached and optimized image
  const { 
    url: optimizedUrl, 
    loading, 
    error, 
    cached 
  } = useServiceImage(url, 'card');

  return (
    <div className="relative group">
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : error ? (
          <div className="w-full h-full flex items-center justify-center text-red-400">
            <span className="text-xs">Errore caricamento</span>
          </div>
        ) : optimizedUrl ? (
          <img 
            src={optimizedUrl} 
            alt={`Immagine ${index + 1}`}
            className="w-full h-full object-cover"
          />
        ) : null}
      </div>
      
      <Button
        variant="destructive"
        size="sm"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={onRemove}
      >
        <Trash2 className="h-3 w-3" />
      </Button>
      
      {cached && (
        <Badge 
          variant="secondary" 
          className="absolute bottom-2 left-2 text-xs bg-green-100 text-green-800"
        >
          Cached
        </Badge>
      )}
    </div>
  );
}

/**
 * Example usage in a service form
 */
export function ServiceFormExample() {
  const [serviceData, setServiceData] = useState({
    title: '',
    description: '',
    images: [] as string[]
  });

  const handleImagesChange = (images: string[]) => {
    setServiceData(prev => ({ ...prev, images }));
  };

  const handleSubmit = async () => {
    // Submit service data with image URLs
    console.log('Submitting service:', serviceData);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold">Crea Nuovo Servizio</h1>
      
      {/* Other form fields */}
      <Card>
        <CardContent className="space-y-4 pt-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Titolo Servizio
            </label>
            <input 
              type="text"
              value={serviceData.title}
              onChange={(e) => setServiceData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full p-2 border rounded"
              placeholder="Inserisci il titolo del servizio"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">
              Descrizione
            </label>
            <textarea 
              value={serviceData.description}
              onChange={(e) => setServiceData(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-2 border rounded h-24"
              placeholder="Descrivi il tuo servizio"
            />
          </div>
        </CardContent>
      </Card>
      
      {/* Image upload section */}
      <ServiceImageUploadExample
        serviceId="new-service"
        existingImages={serviceData.images}
        onImagesChange={handleImagesChange}
        maxImages={8}
      />
      
      <Button 
        onClick={handleSubmit}
        className="w-full"
        disabled={!serviceData.title || serviceData.images.length === 0}
      >
        Crea Servizio
      </Button>
    </div>
  );
}