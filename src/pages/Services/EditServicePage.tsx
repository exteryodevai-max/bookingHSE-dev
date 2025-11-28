import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Save, Trash2 } from 'lucide-react';
import Layout from '../../components/Layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import { Service } from '../../types';
import { serviceCategories, pricingUnits } from '../../utils/categories';
import { useServiceImageUpload } from '../../hooks/useFileUpload';
import { FileUpload } from '../../components/ui/FileUpload';
import toast from 'react-hot-toast';

// Utility function to extract URL from image object or return string as-is
const getImageUrl = (image: any): string => {
  if (!image) return '';
  
  // Se è già una stringa (formato legacy), restituiscila
  if (typeof image === 'string') {
    return image;
  }
  
  // Se è un oggetto con proprietà url (nuovo formato), estrai l'URL
  if (typeof image === 'object' && image.url) {
    return image.url;
  }
  
  // Se è un oggetto serializzato come stringa, prova a parsarlo
  if (typeof image === 'string' && image.startsWith('{')) {
    try {
      const parsed = JSON.parse(image);
      if (parsed.url) {
        return parsed.url;
      }
    } catch (e) {
      console.warn('Errore nel parsing dell\'immagine:', e);
    }
  }
  
  console.warn('Formato immagine non riconosciuto:', image);
  return '';
};

export default function EditServicePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [loadingService, setLoadingService] = useState(true);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [service, setService] = useState<Service | null>(null);
  
  const {
    uploadFiles,
    uploading,
    progress,
    cancelUpload
  } = useServiceImageUpload();

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
    images: [] as string[],
    active: true,
    featured: false
  });

  const loadService = useCallback(async () => {
    try {
      setLoadingService(true);
      const serviceData = await db.getServiceById(id!);
      
      if (!serviceData) {
        toast.error('Servizio non trovato');
        navigate('/my-services');
        return;
      }

      // Verifica che il servizio appartenga al fornitore corrente
      if (serviceData.provider_id !== user?.id) {
        toast.error('Non hai i permessi per modificare questo servizio');
        navigate('/my-services');
        return;
      }

      setService(serviceData);
      
      // Popola il form con i dati del servizio
      setFormData({
        title: serviceData.title || '',
        description: serviceData.description || '',
        category: serviceData.category || '',
        subcategory: serviceData.subcategory || '',
        service_type: serviceData.service_type || 'on_request',
        location_type: serviceData.location_type || 'on_site',
        pricing: {
          base_price: serviceData.pricing?.base_price?.toString() || '',
          pricing_unit: serviceData.pricing?.pricing_unit || 'fixed',
          currency: serviceData.pricing?.currency || 'EUR'
        },
        service_areas: serviceData.service_areas || '',
        requirements: serviceData.requirements || '',
        duration_hours: serviceData.duration_hours?.toString() || '',
        max_participants: serviceData.max_participants?.toString() || '',
        tags: serviceData.tags?.join(', ') || '',
        images: serviceData.images || [],
        active: serviceData.active ?? true,
        featured: serviceData.featured ?? false
      });
    } catch (error) {
      console.error('Errore nel caricamento del servizio:', error);
      toast.error('Errore nel caricamento del servizio');
      navigate('/my-services');
    } finally {
      setLoadingService(false);
    }
  }, [id, user, navigate]);

  useEffect(() => {
    if (id && user) {
      loadService();
    }
  }, [id, user, loadService]);

  if (!user || user.user_type !== 'provider') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accesso Riservato ai Fornitori</h1>
          <p className="text-gray-600 mb-8">Solo i fornitori registrati possono modificare i servizi.</p>
        </div>
      </Layout>
    );
  }

  if (loadingService) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

  const handleUploadImages = async () => {
    if (selectedFiles.length === 0) return;

    try {
      const uploadResults = await uploadFiles(selectedFiles);
      // Extract URLs from UploadResult objects
      const uploadedUrls = uploadResults.map(result => result.url);
      const currentImages = formData.images || []; // Ensure images is an array
      const newImages = [...currentImages, ...uploadedUrls];
      
      if (newImages.length > 10) {
        toast.error('Puoi caricare massimo 10 immagini');
        return;
      }

      // Aggiorna lo stato locale
      setFormData(prev => ({ ...prev, images: newImages }));
      setSelectedFiles([]);

      // SALVA IMMEDIATAMENTE LE IMMAGINI NEL DATABASE
      if (service) {
        try {
          await db.updateService(service.id, { images: newImages });
          console.log('✅ Immagini salvate immediatamente nel database:', newImages);
          toast.success(`${uploadedUrls.length} immagini caricate e salvate con successo`);
        } catch (dbError) {
          console.error('❌ Errore nel salvare le immagini nel database:', dbError);
          toast.error('Immagini caricate ma errore nel salvataggio. Premi "Salva" per riprovare.');
        }
      }
    } catch (error) {
      console.error('Errore nel caricamento delle immagini:', error);
      toast.error('Errore nel caricamento delle immagini');
    }
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = formData.images || []; // Ensure images is an array
    const newImages = currentImages.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, images: newImages }));
  };

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles(files => files.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!service) return;

    try {
      setLoading(true);

      // Upload any remaining selected files and wait for completion
      await handleUploadImages();

      console.log('Updating service with images:', formData.images);

      const serviceData = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        subcategory: formData.subcategory || null,
        service_type: formData.service_type,
        location_type: formData.location_type,
        base_price: parseFloat(formData.pricing.base_price),
        pricing_unit: formData.pricing.pricing_unit,
        currency: formData.pricing.currency,
        service_areas: formData.service_areas,
        requirements: formData.requirements || null,
        duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : null,
        tags: formData.tags ? formData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
        images: formData.images || [], // Ensure images is an array
        active: formData.active,
        featured: formData.featured
      };

      await db.updateService(service.id, serviceData);
      
      toast.success('Servizio aggiornato con successo!');
      navigate('/my-services');
    } catch (error) {
      console.error('Errore nell\'aggiornamento del servizio:', error);
      toast.error('Errore nell\'aggiornamento del servizio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Modifica Servizio</h1>
          <p className="text-gray-600">Aggiorna le informazioni del tuo servizio HSE</p>
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

              {/* Status Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="active"
                    checked={formData.active}
                    onChange={(e) => handleInputChange('active', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="active" className="ml-2 block text-sm text-gray-700">
                    Servizio Attivo
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="featured"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="featured" className="ml-2 block text-sm text-gray-700">
                    In Evidenza
                  </label>
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

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Immagini del Servizio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* File Upload */}
              {formData.images.length < 10 && (
                <div className="space-y-4">
                  <FileUpload
                    onFilesSelected={(files) => {
                      console.log('🔍 [EditService] Files selected:', files.length);
                      files.forEach((file, index) => {
                        console.log(`📁 [EditService] File ${index + 1}:`, {
                          name: file.name,
                          size: file.size,
                          sizeInMB: (file.size / 1024 / 1024).toFixed(2) + ' MB',
                          type: file.type,
                          lastModified: new Date(file.lastModified).toISOString()
                        });
                      });
                      setSelectedFiles(files);
                    }}
                    maxFiles={10 - formData.images.length}
                    accept="image/*"
                    multiple
                  />
                  
                  {selectedFiles.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-gray-700">
                        File selezionati ({selectedFiles.length}):
                      </p>
                      <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-2 bg-gray-50 rounded"
                          >
                            <span className="text-sm text-gray-600 truncate">{file.name}</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveSelectedFile(index)}
                            >
                              Rimuovi
                            </Button>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-2 pt-2">
                        <Button 
                          type="button"
                          onClick={handleUploadImages}
                          disabled={uploading}
                          className="flex-1"
                        >
                          {uploading ? 'Caricamento...' : `Carica ${selectedFiles.length} File`}
                        </Button>
                        
                        {uploading && (
                          <Button 
                            type="button"
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
                </div>
              )}

              {/* Existing Images */}
              {formData.images.length > 0 && (
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-700">
                    Immagini caricate ({formData.images.length}/10):
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {formData.images.map((imageUrl, index) => (
                      <div key={index} className="relative group">
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
              onClick={() => navigate('/my-services')}
            >
              Annulla
            </Button>
            <Button
              type="submit"
              disabled={loading || uploading || !formData.title || !formData.description}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Aggiornamento...' : 'Aggiorna Servizio'}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}