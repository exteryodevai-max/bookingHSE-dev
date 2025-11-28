import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  ChartBarIcon,
  ArrowPathIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Service } from '../../types';
import { getCategoryLabel } from '../../utils/categories';
import toast from 'react-hot-toast';
import { archiveService, restoreService, loadArchivedServices } from '../../lib/archiveService';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '../../lib/cache/cacheManager';

interface ProviderService extends Service {
  stats?: {
    views: number;
    bookings: number;
    revenue: number;
  };
}

export default function ProviderServicesPage() {
  const { user } = useAuth();
  const [services, setServices] = useState<ProviderService[]>([]);
  const [archivedServices, setArchivedServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<ProviderService | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const loadProviderServices = useCallback(async (forceRefresh = false) => {
    if (!user) return;

    try {
      setLoading(true);
      
      console.log(`[loadProviderServices] Forza refresh: ${forceRefresh}, Timestamp: ${new Date().toISOString()}`);
      
      // Se forziamo il refresh, pulisci prima la cache
      if (forceRefresh) {
        console.log('[loadProviderServices] Pulizia cache forzata');
        globalCache.remove(CACHE_KEYS.PROVIDER_SERVICES(user.id));
        globalCache.remove(CACHE_KEYS.PROVIDER_ARCHIVED_SERVICES(user.id));
        globalCache.remove(CACHE_KEYS.PROVIDER_PROFILE(user.id));
      }
      
      // Controlla se i dati sono in cache e non stiamo forzando il refresh
      if (!forceRefresh) {
        const cachedServices = globalCache.get(CACHE_KEYS.PROVIDER_SERVICES(user.id));
        const cachedArchivedServices = globalCache.get(CACHE_KEYS.PROVIDER_ARCHIVED_SERVICES(user.id));
        const cachedProfile = globalCache.get(CACHE_KEYS.PROVIDER_PROFILE(user.id));
        
        if (cachedServices && cachedArchivedServices && cachedProfile) {
          console.log('[loadProviderServices] Utilizzando dati dalla cache');
          setServices(cachedServices);
          setArchivedServices(cachedArchivedServices);
          setLoading(false);
          return;
        }
      }
      
      // Carica i servizi attivi
      let query = supabase
        .from('services')
        .select('*')
        .eq('provider_id', user?.id)
        .order('created_at', { ascending: false });

      // Se forziamo il refresh, aggiungiamo un parametro per forzare la cache refresh
      if (forceRefresh) {
        query = query.not('id', 'is', null); // Questo forza una nuova query
      }

      const { data: servicesData, error } = await query;

      if (error) throw error;

      console.log(`[loadProviderServices] Servizi attivi ricevuti: ${servicesData?.length || 0}`);

      // Carica i servizi archiviati dalla nuova tabella
      const archivedServicesData = await loadArchivedServices(user.id);
      console.log(`[loadProviderServices] Servizi archiviati ricevuti: ${archivedServicesData?.length || 0}`);

      // Carica il profilo del provider per informazioni aggiuntive
      // NOTA: La tabella potrebbe essere 'provider_profiles' invece di 'profiles'
      let providerProfile = null;
      try {
        const { data, error } = await supabase
          .from('provider_profiles')
          .select('business_name, rating_average, reviews_count')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error('Errore nel caricamento profilo provider:', error);
        } else {
          providerProfile = data;
        }
      } catch (error) {
        console.error('Errore nel tentativo di caricamento profilo:', error);
      }

      // Aggiungi statistiche mock
      const servicesWithStats = servicesData?.map(service => ({
        ...service,
        stats: {
          views: Math.floor(Math.random() * 100),
          bookings: Math.floor(Math.random() * 20),
          revenue: Math.floor(Math.random() * 5000)
        }
      })) || [];

      const archivedServicesWithStats = archivedServicesData?.map(service => ({
        ...service,
        stats: {
          views: Math.floor(Math.random() * 100),
          bookings: Math.floor(Math.random() * 20),
          revenue: Math.floor(Math.random() * 5000)
        }
      })) || [];

      setServices(servicesWithStats);
      setArchivedServices(archivedServicesWithStats);
      
      console.log(`[loadProviderServices] STATO FINALE - Attivi: ${servicesWithStats.length}, Archiviati: ${archivedServicesWithStats.length}`);
      
      // Salva i dati in cache
      globalCache.set(CACHE_KEYS.PROVIDER_SERVICES(user.id), servicesWithStats, CACHE_TTL);
      globalCache.set(CACHE_KEYS.PROVIDER_ARCHIVED_SERVICES(user.id), archivedServicesWithStats, CACHE_TTL);
      globalCache.set(CACHE_KEYS.PROVIDER_PROFILE(user.id), providerProfile, CACHE_TTL);
      
      console.log('[loadProviderServices] Dati salvati in cache');
    } catch (error) {
      console.error('Errore nel caricamento dei servizi:', error);
      toast.error('Errore nel caricamento dei servizi');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProviderServices();
    }
  }, [user, loadProviderServices]);

  const handleDeleteService = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per archiviare un servizio');
      return;
    }

    if (!serviceToDelete) {
      toast.error('Nessun servizio selezionato per l\'archiviazione');
      return;
    }

    setDeleting(true);
  
    try {
      // 1. Verifica stato autenticazione
      const { data: authData, error: authError } = await supabase.auth.getSession();
      if (authError || !authData.session) {
        console.error('Errore autenticazione:', authError);
        throw new Error('Sessione scaduta. Effettua il login nuovamente.');
      }
  
      // 2. Verifica se ci sono prenotazioni attive
      console.log('Verificando prenotazioni per il servizio:', serviceToDelete.id);
      
      const { data: activeBookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, status, booking_date')
        .eq('service_id', serviceToDelete.id)
        .in('status', ['pending', 'confirmed', 'in_progress']);
  
      if (bookingsError) {
        console.error('Errore nella verifica prenotazioni:', bookingsError);
      }
  
      // 3. Verifica dettagliata del servizio
      console.log('Verifica dettagliata servizio pre-archiviazione:', {
        service_id: serviceToDelete.id,
        provider_id: serviceToDelete.provider_id,
        actual_provider: user.id,
        title: serviceToDelete.title,
        active: serviceToDelete.active
      });
  
      // 4. Verifica che il servizio esista ancora e appartenga all'utente
      const { data: serviceCheck, error: checkError } = await supabase
        .from('services')
        .select('id, provider_id')
        .eq('id', serviceToDelete.id)
        .eq('provider_id', user.id)
        .maybeSingle();
  
      if (checkError) {
        console.error('Errore nella verifica servizio:', checkError);
        throw new Error('Errore nella verifica del servizio');
      }
  
      if (!serviceCheck) {
        console.log('Nessun servizio trovato con questi criteri:', {
          service_id: serviceToDelete.id,
          provider_id: user.id
        });
        throw new Error('Servizio non trovato o non autorizzato');
      }
  
      // 5. Controlla se ci sono prenotazioni attive
      if (activeBookings && activeBookings.length > 0) {
        const activeCount = activeBookings.filter(b => b.status === 'confirmed' || b.status === 'in_progress').length;
        const pendingCount = activeBookings.filter(b => b.status === 'pending').length;
        
        console.log('Prenotazioni attive trovate:', activeBookings);
        
        throw new Error(
          `Impossibile archiviare: ${activeCount} prenotazioni attive e ${pendingCount} in attesa. ` +
          `Contatta i clienti o attendi il completamento delle prenotazioni.`
        );
      }
  
      // 6. Archivia il servizio spostandolo nella tabella archived_services
      console.log('Tentativo di archiviazione servizio:', serviceToDelete.id);
      
      // Usa la nuova funzione di archiviazione
      await archiveService(serviceToDelete.id, user.id);
      
      console.log('Servizio archiviato con successo nella tabella archived_services:', serviceToDelete.id);
      
      // Ricarica tutti i servizi per aggiornare correttamente entrambe le liste
      setTimeout(() => {
        // Forza il refresh della cache di Supabase
        const event = new CustomEvent('supabase:refresh-cache');
        window.dispatchEvent(event);
        loadProviderServices(true); // Forza il refresh con parametri anti-cache
      }, 1500); // Aumentato a 1.5 secondi
      toast.success('Servizio archiviato con successo');
      
    } catch (error) {
      console.error('Errore nell\'eliminazione del servizio:', error);
      
      // Messaggi di errore specifici per l'utente
      if (error.message.includes('prenotazioni')) {
        toast.error(error.message, { duration: 8000 });
      } else if (error.message.includes('vincoli') || error.message.includes('database')) {
        toast.error(
          error.message + ' ' +
          'Per archiviare questo servizio, contatta il supporto tecnico.',
          { duration: 10000 }
        );
      } else if (error.message.includes('sessione') || error.message.includes('login')) {
        toast.error(error.message);
        // Forza logout per pulire la sessione corrotta
        setTimeout(() => supabase.auth.signOut(), 2000);
      } else {
        toast.error(error.message || 'Errore nell\'archiviazione del servizio');
      }
    } finally {
      setDeleting(false);
      setDeleteModalOpen(false);
      setServiceToDelete(null);
    }
  };
  
  // Funzione di soft delete non utilizzata: rimossa per evitare variabili inutilizzate.

  // Funzione per ripristinare un servizio archiviato - usa la nuova logica
  const handleRestoreService = async (service: ProviderService) => {
    if (!user) {
      toast.error('Devi essere autenticato per ripristinare un servizio');
      return;
    }

    try {
      console.log('Tentativo di ripristino servizio:', service.id);
      
      // Usa la nuova funzione di ripristino
      await restoreService(service.id, user.id);
      
      console.log('Servizio ripristinato con successo dalla tabella archived_services:', service.id);
      
      // Ricarica la lista con delay per aggiornare i servizi attivi
      setTimeout(() => {
        // Forza il refresh della cache di Supabase
        const event = new CustomEvent('supabase:refresh-cache');
        window.dispatchEvent(event);
        loadProviderServices(true); // Forza il refresh
      }, 1000); // 1 secondo di delay
      
      toast.success('Servizio ripristinato con successo');
      
    } catch (error) {
      console.error('Errore nel ripristino del servizio:', error);
      toast.error(error.message || 'Errore nel ripristino del servizio');
    }
  };

  const openDeleteModal = (service: ProviderService) => {
    setServiceToDelete(service);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setServiceToDelete(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">I Miei Servizi</h1>
            <p className="mt-2 text-gray-600">
              Gestisci i tuoi servizi HSE e monitora le performance
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-2">
            <button
              onClick={() => loadProviderServices(true)}
              className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
              disabled={loading}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Aggiorna
            </button>
            <Link
              to="/services/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Nuovo Servizio
            </Link>
          </div>
        </div>

        {/* Stats Overview */}
        {services.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Servizi Attivi</p>
                  <p className="text-2xl font-bold text-gray-900">{services.filter(s => s.active).length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <EyeIcon className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Visualizzazioni Totali</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {services.reduce((sum, s) => sum + (s.stats?.views || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-purple-600 font-bold">€</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Ricavi Totali</p>
                  <p className="text-2xl font-bold text-gray-900">
                    €{services.reduce((sum, s) => sum + (s.stats?.revenue || 0), 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <span className="text-orange-600 font-bold">#</span>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Prenotazioni</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {services.reduce((sum, s) => sum + (s.stats?.bookings || 0), 0)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Services Grid */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                {/* Service Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                        {getCategoryLabel(service.category)}
                      </span>
                      {service.featured && (
                        <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                          In Evidenza
                        </span>
                      )}
                    </div>
                    <div className={`w-3 h-3 rounded-full ${service.active ? 'bg-green-400' : 'bg-gray-400'}`} />
                  </div>
                  
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {service.title}
                  </h3>
                  
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {service.description}
                  </p>

                  {/* Pricing */}
                  <div className="mb-4">
                    <span className="text-2xl font-bold text-gray-900">
                      €{service.base_price || service.pricing?.base_price || 'N/A'}
                    </span>
                    <span className="text-sm text-gray-500 ml-1">
                      {service.pricing_unit === 'fixed' ? '' : `/${(service.pricing_unit || service.pricing?.pricing_unit)?.replace('per_', '') || ''}`}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{service.stats?.views || 0}</p>
                      <p className="text-xs text-gray-500">Visualizzazioni</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">{service.stats?.bookings || 0}</p>
                      <p className="text-xs text-gray-500">Prenotazioni</p>
                    </div>
                    <div>
                      <p className="text-lg font-semibold text-gray-900">€{service.stats?.revenue || 0}</p>
                      <p className="text-xs text-gray-500">Ricavi</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <Link
                      to={`/services/${service.id}`}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Visualizza
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/services/${service.id}/edit`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Modifica
                      </Link>
                      <button
                        onClick={() => openDeleteModal(service)}
                        className="inline-flex items-center px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded transition-colors"
                      >
                        <TrashIcon className="h-4 w-4 mr-1" />
                        Archivia
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-12">
            <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ChartBarIcon className="h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun servizio ancora</h3>
            <p className="text-gray-600 mb-6">
              Inizia creando il tuo primo servizio HSE per attirare clienti.
            </p>
            <Link
              to="/services/create"
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <PlusIcon className="h-5 w-5 mr-2" />
              Crea il tuo primo servizio
            </Link>
          </div>
        )}

        {/* Archived Services Section */}
        {archivedServices.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Servizi Archiviati</h2>
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="inline-flex items-center px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
              >
                <ArchiveBoxIcon className="h-5 w-5 mr-2" />
                {showArchived ? 'Nascondi Archiviati' : `Mostra Archiviati (${archivedServices.length})`}
              </button>
            </div>

            {showArchived && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-75">
                {archivedServices.map((service) => (
                  <div key={service.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {/* Service Header */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            {getCategoryLabel(service.category)}
                          </span>
                          <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                            Archiviato
                          </span>
                        </div>
                        <div className="w-3 h-3 rounded-full bg-gray-400" />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {service.title}
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {service.description}
                      </p>

                      {/* Pricing */}
                      <div className="mb-4">
                        <span className="text-2xl font-bold text-gray-900">
                          €{service.pricing?.base_price || 'N/A'}
                        </span>
                        <span className="text-sm text-gray-500 ml-1">
                          {service.pricing?.pricing_unit === 'fixed' ? '' : `/${service.pricing?.pricing_unit?.replace('per_', '') || ''}`}
                        </span>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{service.stats?.views || 0}</p>
                          <p className="text-xs text-gray-500">Visualizzazioni</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">{service.stats?.bookings || 0}</p>
                          <p className="text-xs text-gray-500">Prenotazioni</p>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900">€{service.stats?.revenue || 0}</p>
                          <p className="text-xs text-gray-500">Ricavi</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex items-center justify-center gap-2">
                        <Link
                          to={`/services/${service.id}`}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Visualizza
                        </Link>
                        <button
                          onClick={() => handleRestoreService(service)}
                          className="inline-flex items-center px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded transition-colors"
                        >
                          <ArrowPathIcon className="h-4 w-4 mr-1" />
                          Ripristina
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteModalOpen && serviceToDelete && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3 text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                  <TrashIcon className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Archivia Servizio
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Sei sicuro di voler archiviare il servizio "{serviceToDelete.title}"? 
                  Il servizio verrà nascosto dai risultati di ricerca ma potrai ripristinarlo in futuro.
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={closeDeleteModal}
                    disabled={deleting}
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-700 font-medium rounded transition-colors disabled:opacity-50"
                  >
                    Annulla
                  </button>
                  <button
                    onClick={handleDeleteService}
                    disabled={deleting}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white font-medium rounded transition-colors disabled:opacity-50"
                  >
                    {deleting ? 'Archiviazione...' : 'Archivia'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}