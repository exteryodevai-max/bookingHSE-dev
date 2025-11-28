import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout/Layout';
import { db } from '../lib/supabase';
import { SearchFilters, ServiceSearchItem, User, ProviderProfile } from '../types';
import SearchForm from '../components/Search/SearchForm';
import SearchResults from '../components/Search/SearchResults';
import SearchFiltersPanel from '../components/Search/SearchFiltersPanel';
import GeoFilters from '../components/Search/GeoFilters';
import { GeoSearchService, GeoSearchResult } from '../lib/geoSearch';
import { isRegionName, getRegionCapitals } from '../lib/locations';
import toast from 'react-hot-toast';
import { globalCache, CACHE_KEYS, CACHE_TTL } from '../lib/cache/cacheManager';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

export default function Search() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState<ServiceSearchItem[] | GeoSearchResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [providers, setProviders] = useState<(User & { profile: ProviderProfile })[]>([]);
  const requestIdRef = useRef(0);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [filters, setFilters] = useState<SearchFilters>({
    query: searchParams.get('q') || '',
    location: {
      city: searchParams.get('location') || '',
    },
    category: searchParams.get('category') || undefined,
    sort_by: 'relevance',
    page: 1,
    limit: 20,
  });

  // Carica i provider all'avvio con caching
  useEffect(() => {
    const loadProviders = async () => {
      try {
        // Controlla se i provider sono già in cache
        const cachedProviders = globalCache.get(CACHE_KEYS.PROVIDERS_LIST);
        if (cachedProviders) {
          setProviders(cachedProviders);
          return;
        }

        const providersData = await db.getProviders();
        setProviders(providersData);
        
        // Salva i provider in cache
        globalCache.set(CACHE_KEYS.PROVIDERS_LIST, providersData, CACHE_TTL);
        console.log('Provider salvati in cache');
      } catch (error) {
        console.error('Error loading providers:', error);
      }
    };
    loadProviders();
  }, []);

  // Funzione per generare una chiave di cache univoca basata sui filtri
  const getSearchCacheKey = (searchFilters: SearchFilters): string => {
    const keyParts = [
      CACHE_KEYS.SEARCH_RESULTS,
      searchFilters.query || '',
      searchFilters.location?.city || '',
      searchFilters.category || '',
      searchFilters.sort_by || 'relevance',
      searchFilters.page?.toString() || '1',
    ];
    
    if (searchFilters.location?.coordinates) {
      keyParts.push(
        searchFilters.location.coordinates.lat.toString(),
        searchFilters.location.coordinates.lng.toString(),
        (searchFilters.location.radius_km || 50).toString()
      );
    }
    
    return keyParts.join('_');
  };

  const performSearch = useCallback(async () => {
    try {
      setLoading(true);
      requestIdRef.current += 1;
      const requestId = requestIdRef.current;
      
      console.log('🔍 Search.tsx - Inizio ricerca con filtri:', filters);
      
      const cacheKey = getSearchCacheKey(filters);
      
      // Controlla se i risultati sono già in cache
      const cachedResults = globalCache.get(cacheKey);
      if (cachedResults && !filters.location?.coordinates) {
        console.log('📦 Search.tsx - Usando risultati dalla cache');
        if (requestId === requestIdRef.current) {
          setResults(cachedResults.results);
          setTotalCount(cachedResults.totalCount);
        }
        setLoading(false);
        return;
      }
      
      // Se abbiamo coordinate, usa la ricerca geografica
      const providersHaveCoords = providers.some(p => !!(p as any)?.provider_profile?.address?.coordinates);
      const coordsValid = !!(filters.location?.coordinates && filters.location.coordinates.lat !== 0 && filters.location.coordinates.lng !== 0);
      if (coordsValid && providers.length > 0 && providersHaveCoords) {
        console.log('🌍 Search.tsx - Usando ricerca geografica');
        const geoResults = GeoSearchService.filterByLocation(
          providers,
          filters.location.coordinates,
          filters.location.radius_km || 50
        );
        if (requestId === requestIdRef.current) {
          setResults(geoResults);
          setTotalCount(geoResults.length);
        }
      } else {
        // Altrimenti usa la ricerca tradizionale
        const locationTokens: string[] = [];
        if (filters.location?.city) {
          const loc = filters.location.city.trim();
          if (isRegionName(loc)) {
            locationTokens.push(loc.toLowerCase());
            getRegionCapitals(loc).forEach(c => locationTokens.push(c.toLowerCase()));
          } else {
            locationTokens.push(loc.toLowerCase());
          }
        }
        const searchFilters = {
          ...filters,
          search_query: filters.query, // Mappa query a search_query per il backend
          location_tokens: locationTokens.length ? locationTokens : undefined,
        };
        const searchResults = await db.getServices(searchFilters);
        
        console.log('📋 Search.tsx - Risultati da db.getServices:', {
          services_count: searchResults.services?.length || 0,
          total_count: searchResults.total_count,
          search_query: filters.query,
          services: searchResults.services
        });
        
        // Transform results to match SearchResult interface
        let transformedResults: ServiceSearchItem[] = searchResults.services.map((service: Record<string, unknown>) => ({
          id: service.id,
          title: service.title,
          category: service.category,
          subcategory: service.subcategory,
          provider: {
            id: service.provider?.id || service.provider_id || '',
            business_name: service.provider?.provider_profile?.business_name || service.provider?.business_name || 'Fornitore non disponibile',
            rating_average: service.provider?.provider_profile?.rating_average || service.provider?.rating_average || 0,
            reviews_count: service.provider?.provider_profile?.reviews_count || service.provider?.reviews_count || 0,
            verified: service.provider?.provider_profile?.verified || service.provider?.verified || false,
            location: {
              city: service.provider?.provider_profile?.city || service.provider?.location?.city || '',
              province: service.provider?.provider_profile?.province || service.provider?.location?.province || '',
            },
          },
          pricing: {
            base_price: service.pricing?.base_price || service.base_price || 0,
            pricing_unit: service.pricing?.pricing_unit || service.pricing_unit || 'fixed',
            currency: service.pricing?.currency || service.currency || 'EUR',
          },
          availability: service.service_type === 'instant' ? 'immediate' : service.availability || 'on_request',
          featured: service.featured,
          images: service.images || [],
          tags: service.tags || [],
        }));

        if (filters.query) {
          const q = filters.query.toLowerCase();
          transformedResults = transformedResults.filter(s =>
            (s.title || '').toLowerCase().includes(q) ||
            (s.subcategory || '').toLowerCase().includes(q) ||
            (s.provider.business_name || '').toLowerCase().includes(q)
          );
        }
        if (filters.location?.city) {
          const city = filters.location.city.toLowerCase();
          transformedResults = transformedResults.filter(s => {
            const provCity = (s.provider.location.city || '').toLowerCase();
            const provProv = (s.provider.location.province || '').toLowerCase();
            return provCity.includes(city) || provProv.includes(city);
          });
          const caps = isRegionName(filters.location.city) ? getRegionCapitals(filters.location.city).map(c => c.toLowerCase()) : [];
          transformedResults = transformedResults.sort((a, b) => {
            const score = (s: ServiceSearchItem) => {
              const c = s.provider.location.city?.toLowerCase() || '';
              const p = s.provider.location.province?.toLowerCase() || '';
              if (c === city) return 3;
              if (caps.length && caps.includes(c)) return 2;
              if (p.includes(city)) return 1;
              return 0;
            };
            return score(b) - score(a);
          });
        }
        console.log('🎯 Search.tsx - Servizi trasformati:', {
          transformed_count: transformedResults.length,
          first_service: transformedResults[0]
        });

        // Fallback: se la ricerca con località non trova nulla, riprova senza località e filtra client-side
        if (filters.location?.city && (searchResults.total_count === 0 || transformedResults.length === 0)) {
          const searchNoLocation = await db.getServices({
            ...filters,
            location: { ...filters.location, city: undefined },
            search_query: filters.query
          });
          let fallbackResults: ServiceSearchItem[] = searchNoLocation.services.map((service: Record<string, unknown>) => ({
            id: service.id,
            title: service.title,
            category: service.category,
            subcategory: service.subcategory,
            provider: {
              id: service.provider?.id || service.provider_id || '',
              business_name: service.provider?.provider_profile?.business_name || service.provider?.business_name || 'Fornitore non disponibile',
              rating_average: service.provider?.provider_profile?.rating_average || service.provider?.rating_average || 0,
              reviews_count: service.provider?.provider_profile?.reviews_count || service.provider?.reviews_count || 0,
              verified: service.provider?.provider_profile?.verified || service.provider?.verified || false,
              location: {
                city: service.provider?.provider_profile?.city || service.provider?.location?.city || '',
                province: service.provider?.provider_profile?.province || service.provider?.location?.province || '',
              },
            },
            pricing: {
              base_price: service.pricing?.base_price || service.base_price || 0,
              pricing_unit: service.pricing?.pricing_unit || service.pricing_unit || 'fixed',
              currency: service.pricing?.currency || service.currency || 'EUR',
            },
            availability: service.service_type === 'instant' ? 'immediate' : service.availability || 'on_request',
            featured: service.featured,
            images: service.images || [],
            tags: service.tags || [],
          }));
          const city = filters.location.city.toLowerCase();
          fallbackResults = fallbackResults.filter(s => {
            const provCity = (s.provider.location.city || '').toLowerCase();
            const provProv = (s.provider.location.province || '').toLowerCase();
            return provCity.includes(city) || provProv.includes(city);
          });
          if (requestId === requestIdRef.current) {
            setResults(fallbackResults);
            setTotalCount(fallbackResults.length);
          }
        } else {
          if (requestId === requestIdRef.current) {
            setResults(transformedResults);
            setTotalCount(transformedResults.length);
          }
        }
        
        // Salva i risultati in cache (solo per ricerche non geografiche)
        if (!filters.location?.coordinates) {
          globalCache.set(cacheKey, {
            results: transformedResults,
            totalCount: transformedResults.length
          }, 1800);
          console.log('Risultati di ricerca salvati in cache');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Errore durante la ricerca');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      performSearch();
    }, 400);
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [performSearch, filters]);

  // Esegui la ricerca quando cambiano i filtri o i provider
  useEffect(() => {
    console.log('🔄 Search.tsx - useEffect triggered:', {
      providers_length: providers.length,
      filters: filters,
      query: filters.query
    });
    
    // Forza sempre la ricerca, anche senza provider
    performSearch();
  }, [filters, providers.length, performSearch]);

  const handleFiltersChange = useCallback((newFilters: Partial<SearchFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters,
      page: 1, // Reset to first page when filters change
    }));
    setCurrentPage(1);
  }, []);

  const handlePageChange = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Funzione per aggiornare/refresh dei dati
  const handleRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      
      // Pulisci tutte le cache relative alla ricerca
      globalCache.clear(CACHE_KEYS.PROVIDERS_LIST);
      globalCache.clear(CACHE_KEYS.SEARCH_RESULTS);
      
      // Pulisci anche le cache specifiche dei risultati di ricerca
      const cacheKey = getSearchCacheKey(filters);
      globalCache.clear(cacheKey);
      
      // Ricarica i provider dal database
      const providersData = await db.getProviders();
      setProviders(providersData);
      
      // Salva i nuovi provider in cache
      globalCache.set(CACHE_KEYS.PROVIDERS_LIST, providersData, CACHE_TTL);
      
      // Esegui nuovamente la ricerca con i filtri attuali
      await performSearch();
      
      toast.success('Dati aggiornati con successo!');
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast.error('Errore durante l\'aggiornamento dei dati');
    } finally {
      setRefreshing(false);
    }
  }, [filters, performSearch, getSearchCacheKey]);

  // Forza il refresh quando si naviga alla pagina Servizi
  useEffect(() => {
    console.log('🔄 Search.tsx - Componente montato o route cambiata:', location.pathname);
    
    // Se siamo sulla route /services senza parametri di ricerca, forza il caricamento
    // SOLO al primo caricamento della pagina, non ad ogni cambio di filtri
    if (location.pathname === '/services' && !searchParams.get('q') && results.length === 0 && !loading) {
      console.log('🔄 Search.tsx - Forzando refresh per navigazione a Servizi (primo caricamento)');
      
      // Pulisci la cache per forzare il refresh
      globalCache.clear(CACHE_KEYS.SEARCH_RESULTS);
      
      // Forza il reload dei servizi
      performSearch();
    }
  }, [location.pathname, searchParams.get('q')]);

  return (
    <Layout>
      <div className="bg-gray-50 min-h-screen">
        {/* Search Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <SearchForm
                  initialFilters={filters}
                  onFiltersChange={handleFiltersChange}
                  onSearch={performSearch}
                />
              </div>
              
              {/* Pulsante Aggiorna */}
              <div className="flex-shrink-0">
                <button
                  onClick={handleRefresh}
                  disabled={refreshing || loading}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  title="Aggiorna i risultati di ricerca per visualizzare i servizi più recenti"
                >
                  <ArrowPathIcon 
                    className={`h-5 w-5 mr-2 ${refreshing ? 'animate-spin' : ''}`} 
                  />
                  {refreshing ? 'Aggiornamento...' : 'Aggiorna'}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-80 space-y-6">
              {/* Filtri Geografici */}
              <GeoFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                showAdvanced={true}
              />
              
              {/* Altri Filtri */}
              <SearchFiltersPanel
                filters={filters}
                onFiltersChange={handleFiltersChange}
                totalResults={totalCount}
                show={showFilters}
                onToggle={() => setShowFilters(!showFilters)}
              />
            </div>

            {/* Results */}
            <div className="flex-1">
              <SearchResults
                results={results}
                totalCount={totalCount}
                currentPage={currentPage}
                loading={loading}
                filters={filters}
                onPageChange={handlePageChange}
                onSortChange={(sortBy) => handleFiltersChange({ sort_by: sortBy })}
                showDistance={!!filters.location?.coordinates}
              />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}