import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSupabaseError } from '../../lib/errors';
import Layout from '../../components/Layout/Layout';
import { FileUpload } from '../../components/ui/FileUpload';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Trash2, Upload, Save } from 'lucide-react';
import { db } from '../../lib/supabase';
import toast from 'react-hot-toast';

// Utility function to extract image URL from various formats
const getImageUrl = (imageData: any): string => {
  if (!imageData) return '';
  
  // If it's already a string (legacy format), return as is
  if (typeof imageData === 'string') {
    // Check if it's a JSON string that needs parsing
    if (imageData.startsWith('{') && imageData.endsWith('}')) {
      try {
        const parsed = JSON.parse(imageData);
        return parsed.url || '';
      } catch (e) {
        return imageData; // Return original if parsing fails
      }
    }
    return imageData;
  }
  
  // If it's an object with url property (new format)
  if (typeof imageData === 'object' && imageData.url) {
    return imageData.url;
  }
  
  return '';
};

const serviceCategories = [
  { value: 'consultation_management', label: 'Consulenza & Gestione HSE' },
  { value: 'workplace_safety', label: 'Sicurezza sul Lavoro' },
  { value: 'training_education', label: 'Formazione & Addestramento' },
  { value: 'environment', label: 'Ambiente' },
  { value: 'occupational_health', label: 'Salute Occupazionale' },
  { value: 'emergency_crisis', label: 'Emergenza & Gestione Crisi' },
  { value: 'innovation_digital', label: 'Innovazione & Digital HSE' },
  { value: 'specialized_services', label: 'Servizi Specialistici' },
];

const pricingUnits = [
  { value: 'fixed', label: 'Prezzo Fisso' },
  { value: 'hourly', label: 'Orario' },
  { value: 'daily', label: 'Giornaliero' },
  { value: 'project', label: 'A Progetto' },
];

export default function CreateServicePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { handleError, logError } = useSupabaseError();
  const [loading, setLoading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadError, setUploadError] = useState<string>('');
  
  // Gestione upload immagini avviene tramite handleUploadImages (upload diretto)

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    subcategory: '',
    service_type: 'on_request',
    location_type: 'on_site',
    pricing: {
      base_price: '',
      pricing_unit: 'fixed',
      currency: 'EUR'
    },
    service_areas: '',
    requirements: '',
    duration_hours: '',
    max_participants: '',
    tags: '',
    images: [] as string[]
  });

  if (!user || user.user_type !== 'provider') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accesso Riservato ai Fornitori</h1>
          <p className="text-gray-600 mb-8">Solo i fornitori registrati possono creare nuovi servizi.</p>
        </div>
      </Layout>
    );
  }

  const handleInputChange = (field: string, value: unknown) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleFilesSelected = (files: File[]) => {
    console.log('🔍 [CreateService] Files selected:', files.length);
    files.forEach((file, index) => {
      console.log(`📁 [CreateService] File ${index + 1}:`, {
        name: file.name,
        size: file.size,
        sizeInMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
        type: file.type,
        lastModified: new Date(file.lastModified).toISOString()
      });
    });
    setSelectedFiles(files);
  };

  const handleUploadImages = async () => {
    console.log('🚀 [CreateService] Starting DIRECT image upload process...');
    console.log('📊 [CreateService] Selected files count:', selectedFiles.length);
    
    if (selectedFiles.length === 0) {
      console.log('⚠️ [CreateService] No files to upload');
      return [];
    }

    const uploadedUrls: string[] = [];

    try {
      // Import supabase directly like ProfileImageUpload does
      const { supabase } = await import('../../lib/supabase');
      
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        console.log(`📤 [CreateService] Uploading file ${i + 1}/${selectedFiles.length}:`, {
          name: file.name,
          size: file.size,
          type: file.type
        });

        // Generate unique filename (same as ProfileImageUpload)
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `services/${user.id}/${fileName}`;

        console.log(`📁 [CreateService] Uploading to path: ${filePath}`);

        // Upload to Supabase Storage DIRECTLY (same as ProfileImageUpload)
        const { data, error: uploadError } = await supabase.storage
          .from('service-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error(`❌ [CreateService] Upload error for file ${file.name}:`, uploadError);
          throw uploadError;
        }

        console.log(`✅ [CreateService] File uploaded successfully:`, data);

        // Get public URL (same as ProfileImageUpload)
        const { data: { publicUrl } } = supabase.storage
          .from('service-images')
          .getPublicUrl(data.path);

        console.log(`🔗 [CreateService] Public URL generated:`, publicUrl);
        uploadedUrls.push(publicUrl);
      }
      
      console.log('✅ [CreateService] ALL uploads completed successfully:', {
        uploadedCount: uploadedUrls.length,
        urls: uploadedUrls
      });
      
      const newImages = [...formData.images, ...uploadedUrls];
      setFormData(prev => ({ ...prev, images: newImages }));
      setSelectedFiles([]);
      
      console.log('🔄 [CreateService] Updated formData.images:', newImages);
      toast.success(`${uploadedUrls.length} immagini caricate con successo!`);
      return uploadedUrls;
    } catch (error) {
      console.error('❌ [CreateService] Upload failed:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      logError(error, 'Upload failed');
      handleError(error, 'Errore durante il caricamento delle immagini');
      toast.error('Errore durante il caricamento delle immagini');
      return [];
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Step 1: Create service in database first (without images)
      const serviceData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory,
        service_type: formData.service_type,
        location_type: formData.location_type,
        base_price: parseFloat(formData.pricing.base_price),
        pricing_unit: formData.pricing.pricing_unit,
        currency: formData.pricing.currency,
        service_areas: (formData.service_areas || '').split(',').map(area => area.trim()).filter(Boolean),
        requirements: (formData.requirements || '').split(',').map(req => req.trim()).filter(Boolean),
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        tags: (formData.tags || '').split(',').map(tag => tag.trim()).filter(Boolean),
        images: formData.images, // Start with existing images (if any)
        provider_id: user.id,
        active: true
      };

      console.log('🏗️ [CreateService] Creating service with data:', serviceData);
      const result = await db.createService(serviceData);
      console.log('✅ [CreateService] Service created successfully:', result);
      
      // Step 2: Upload images if any are selected
      if (selectedFiles.length > 0) {
        console.log(`📤 [CreateService] Uploading ${selectedFiles.length} images for service ${result.id}...`);
        console.log('📁 [CreateService] Files to upload:', selectedFiles.map(f => ({
          name: f.name,
          size: f.size,
          sizeInMB: (f.size / 1024 / 1024).toFixed(2) + ' MB'
        })));
        
        try {
          // Use the working direct upload method instead of the problematic hook
          const uploadedUrls = await handleUploadImages();
          
          console.log('✅ [CreateService] Images uploaded successfully:', uploadedUrls);
          
          // Validation: Check if all files were uploaded successfully
          if (uploadedUrls.length !== selectedFiles.length) {
            console.warn('⚠️ [CreateService] Upload count mismatch:', {
              selectedFiles: selectedFiles.length,
              uploadedUrls: uploadedUrls.length,
              difference: selectedFiles.length - uploadedUrls.length
            });
          }
          
          // Validation: Check if URLs are valid
          const invalidUrls = uploadedUrls.filter(url => !url || typeof url !== 'string' || !url.startsWith('http'));
          if (invalidUrls.length > 0) {
            console.error('❌ [CreateService] Invalid URLs detected:', invalidUrls);
            throw new Error(`${invalidUrls.length} file(s) failed to upload properly`);
          }
          
          // Step 3: Update service with uploaded image URLs
          const finalImages = [...formData.images, ...uploadedUrls];
          console.log('🔄 [CreateService] Updating service with final images:', {
            serviceId: result.id,
            previousImages: formData.images,
            newImages: uploadedUrls,
            finalImages: finalImages,
            totalImages: finalImages.length
          });
          
          await db.updateService(result.id, { images: finalImages });
          console.log('✅ [CreateService] Service updated with images successfully');
        } catch (uploadError) {
          console.error('❌ [CreateService] Image upload failed:', {
            error: uploadError,
            message: uploadError instanceof Error ? uploadError.message : 'Unknown error',
            serviceId: result.id
          });
          toast.error('Servizio creato ma errore nel caricamento immagini');
        }
      } else {
        console.log('ℹ️ [CreateService] No images to upload, service created without images');
      }
      
      console.log('🎉 [CreateService] Process completed successfully');
      toast.success('Servizio creato con successo!');
      navigate(`/services/${result.id}`);
    } catch (error) {
      console.error('❌ [CreateService] Service creation failed:', {
        error: error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      logError(error, 'Error creating service');
      handleError(error, 'Errore durante la creazione del servizio');
    } finally {
      setLoading(false);
      console.log('🏁 [CreateService] Process finished, loading set to false');
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Crea Nuovo Servizio</h1>
          <p className="text-gray-600">Aggiungi un nuovo servizio HSE alla tua offerta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Informazioni di Base</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titolo del Servizio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Es. Consulenza Sicurezza sul Lavoro"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrizione *
                </label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrivi dettagliatamente il tuo servizio..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    required
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleziona categoria</option>
                    {serviceCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo di Servizio *
                  </label>
                  <select
                    required
                    value={formData.service_type}
                    onChange={(e) => handleInputChange('service_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="on_request">Su Richiesta</option>
                    <option value="instant">Prenotazione Immediata</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Prezzi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Prezzo Base *
                  </label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="0.01"
                    value={formData.pricing.base_price}
                    onChange={(e) => handleInputChange('pricing.base_price', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Unità di Prezzo *
                  </label>
                  <select
                    required
                    value={formData.pricing.pricing_unit}
                    onChange={(e) => handleInputChange('pricing.pricing_unit', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {pricingUnits.map(unit => (
                      <option key={unit.value} value={unit.value}>{unit.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Localizzazione</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Modalità di Erogazione *
                </label>
                <select
                  required
                  value={formData.location_type}
                  onChange={(e) => handleInputChange('location_type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="on_site">Presso il cliente</option>
                  <option value="provider_location">Presso il fornitore</option>
                  <option value="remote">Remoto/Online</option>
                  <option value="flexible">Flessibile</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Zone di Servizio *
                </label>
                <input
                  type="text"
                  required
                  value={formData.service_areas}
                  onChange={(e) => handleInputChange('service_areas', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Milano, Lombardia, Italia (separare con virgole)"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Inserisci le città, province o regioni dove offri il servizio, separate da virgole
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>Dettagli del Servizio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Requisiti e Prerequisiti
                </label>
                <textarea
                  value={formData.requirements}
                  onChange={(e) => handleInputChange('requirements', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrivi eventuali requisiti o prerequisiti..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durata (ore)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.duration_hours}
                    onChange={(e) => handleInputChange('duration_hours', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="8"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numero Massimo Partecipanti
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.max_participants}
                    onChange={(e) => handleInputChange('max_participants', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag (separati da virgola)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sicurezza, formazione, consulenza"
                />
              </div>
            </CardContent>
          </Card>

          {/* Image Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Immagini del Servizio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.images.length + selectedFiles.length < 10 && (
                <FileUpload
                  onFilesSelected={handleFilesSelected}
                  accept="image/*"
                  multiple
                  maxFiles={10 - formData.images.length}
                  maxSize={10 * 1024 * 1024} // 10MB
                  className="border-dashed border-2 border-gray-300 rounded-lg p-6"
                >
                  <div className="text-center">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-900 mb-2">
                      Trascina le immagini qui o clicca per selezionare
                    </p>
                    <p className="text-sm text-gray-500">
                      Supportati: JPG, PNG, WebP (max 10MB per file)
                    </p>
                  </div>
                </FileUpload>
              )}

              {/* Selected Files Preview */}
              {selectedFiles.length > 0 && (
                <div className="space-y-4">
                  <h4 className="font-medium">File Selezionati ({selectedFiles.length}):</h4>
                  <div className="grid grid-cols-1 gap-2">
                    {selectedFiles.map((file, index) => (
                      <SelectedFilePreview 
                        key={index}
                        file={file}
                        onRemove={() => handleRemoveSelectedFile(index)}
                      />
                    ))}
                  </div>
                  
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                    💡 Le immagini verranno caricate automaticamente quando crei il servizio
                  </div>
                </div>
              )}

              {uploadError && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded">
                  {uploadError}
                </div>
              )}

              {/* Uploaded Images Gallery */}
              {formData.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium">Immagini Caricate:</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.images.map((imageUrl, index) => (
                      <div key={imageUrl} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={getImageUrl(imageUrl)} 
                            alt={`Immagine ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleRemoveImage(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-sm text-gray-500">
                {formData.images.length}/10 immagini caricate
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard')}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.title || !formData.description}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? (
                selectedFiles.length > 0 ? 'Creazione e caricamento immagini...' : 'Creazione servizio...'
              ) : (
                selectedFiles.length > 0 ? `Crea Servizio (${selectedFiles.length} immagini)` : 'Crea Servizio'
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

// Component for previewing selected files before upload
function SelectedFilePreview({ 
  file, 
  onRemove 
}: { 
  file: File; 
  onRemove: () => void; 
}) {
  const [preview, setPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (file.type && file.type.startsWith('image/')) {
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
        type="button"
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
        {(() => {
          console.log('🔍 [SelectedFilePreview] File size debug:', {
            fileName: file.name,
            fileSize: file.size,
            fileSizeType: typeof file.size,
            calculation: file.size / 1024 / 1024,
            formatted: (file.size / 1024 / 1024).toFixed(2)
          });
          
          if (!file.size || typeof file.size !== 'number' || file.size === 0) {
            console.warn('⚠️ [SelectedFilePreview] File size is invalid:', file.size);
            return '0.00 MB';
          }
          
          const sizeInMB = (file.size / 1024 / 1024).toFixed(2);
          console.log('✅ [SelectedFilePreview] Calculated size:', sizeInMB + ' MB');
          return sizeInMB + ' MB';
        })()}
      </Badge>
    </div>
  );
}