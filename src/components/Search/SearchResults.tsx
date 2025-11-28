import React, { memo, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  StarIcon, 
  MapPinIcon, 
  CheckBadgeIcon,
  ClockIcon,
  CurrencyEuroIcon
} from '@heroicons/react/24/solid';
import { ServiceSearchItem, SearchFilters } from '../../types';
import { GeoSearchResult } from '../../lib/geoSearch';

// Utility function to extract URL from image object or return string as-is
const getImageUrl = (image: any): string => {
  if (!image) return '';
  
  // Se è già una stringa URL diretta (formato legacy), restituiscila
  if (typeof image === 'string') {
    // Se è un oggetto JSON serializzato come stringa, prova a parsarlo
    if (image.startsWith('{') && image.endsWith('}')) {
      try {
        const parsed = JSON.parse(image);
        // Gestisci oggetti complessi con varie proprietà
        if (parsed.url) return parsed.url;
        if (parsed.path) return parsed.path;
        if (parsed.src) return parsed.src;
        if (parsed.href) return parsed.href;
        // Se ha thumbnails, usa la prima disponibile
        if (parsed.thumbnails && Array.isArray(parsed.thumbnails) && parsed.thumbnails.length > 0) {
          const thumbnail = parsed.thumbnails[0];
          if (typeof thumbnail === 'string') return thumbnail;
          if (thumbnail.url) return thumbnail.url;
          if (thumbnail.path) return thumbnail.path;
        }
      } catch (e) {
        console.warn('Errore nel parsing dell\'immagine JSON:', e);
        return image; // Restituisci la stringa originale se il parsing fallisce
      }
    }
    return image; // Restituisci la stringa URL diretta
  }
  
  // Se è un oggetto con varie proprietà possibili
  if (typeof image === 'object' && image !== null) {
    // Prova le proprietà più comuni per l'URL
    if (image.url) return image.url;
    if (image.path) return image.path;
    if (image.src) return image.src;
    if (image.href) return image.href;
    
    // Se ha thumbnails, usa la prima disponibile
    if (image.thumbnails && Array.isArray(image.thumbnails) && image.thumbnails.length > 0) {
      const thumbnail = image.thumbnails[0];
      if (typeof thumbnail === 'string') return thumbnail;
      if (thumbnail && typeof thumbnail === 'object') {
        if (thumbnail.url) return thumbnail.url;
        if (thumbnail.path) return thumbnail.path;
        if (thumbnail.src) return thumbnail.src;
      }
    }
    
    // Se ha metadata con URL
    if (image.metadata && typeof image.metadata === 'object' && image.metadata.url) {
      return image.metadata.url;
    }
  }
  
  console.warn('Formato immagine non riconosciuto:', image);
  return '';
};

interface SearchResultsProps {
  results: ServiceSearchItem[] | GeoSearchResult[];
  totalCount: number;
  currentPage: number;
  loading: boolean;
  filters: SearchFilters;
  onPageChange: (page: number) => void;
  onSortChange: (sortBy: string) => void;
  showDistance?: boolean;
}

// Memoized constants to avoid recreation on each render
const BASE_SORT_OPTIONS = [
  { value: 'relevance', label: 'Rilevanza' },
  { value: 'price_asc', label: 'Prezzo crescente' },
  { value: 'price_desc', label: 'Prezzo decrescente' },
  { value: 'rating', label: 'Valutazione' },
];

const DISTANCE_OPTION = { value: 'distance', label: 'Distanza' };

const getSortOptions = (hasCoordinates: boolean) => {
  return hasCoordinates 
    ? [...BASE_SORT_OPTIONS, DISTANCE_OPTION]
    : BASE_SORT_OPTIONS;
};

// Memoized label mappings to avoid recreation
const CATEGORY_LABELS: Record<string, string> = {
  consultation_management: 'Consulenza & Gestione HSE',
  workplace_safety: 'Sicurezza sul Lavoro',
  training_education: 'Formazione & Addestramento',
  environment: 'Ambiente',
  occupational_health: 'Salute Occupazionale',
  emergency_crisis: 'Emergenza & Gestione Crisi',
  innovation_digital: 'Innovazione & Digital HSE',
  specialized_services: 'Servizi Specialistici',
};

const PRICING_UNIT_LABELS: Record<string, string> = {
  fixed: 'fisso',
  per_hour: '/ora',
  per_day: '/giorno',
  per_participant: '/partecipante',
  per_employee: '/dipendente',
  hourly: '/ora',
  daily: '/giorno',
  project: 'a progetto',
};

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: 'Disponibile subito',
  within_week: 'Entro una settimana',
  within_month: 'Entro un mese',
  on_request: 'Su richiesta',
};

const AVAILABILITY_COLORS: Record<string, string> = {
  immediate: 'bg-green-100 text-green-800',
  within_week: 'bg-blue-100 text-blue-800',
  within_month: 'bg-yellow-100 text-yellow-800',
  on_request: 'bg-gray-100 text-gray-800',
};

const getCategoryLabel = (category: string) => CATEGORY_LABELS[category] || category;
const getPricingUnitLabel = (unit: string) => PRICING_UNIT_LABELS[unit] || '';
const getAvailabilityLabel = (availability: string) => AVAILABILITY_LABELS[availability] || availability;
const getAvailabilityColor = (availability: string) => AVAILABILITY_COLORS[availability] || 'bg-gray-100 text-gray-800';

const SearchResults = memo(function SearchResults({
  results,
  totalCount,
  currentPage,
  loading,
  filters,
  onPageChange,
  onSortChange
}: SearchResultsProps) {
  const hasCoordinates = !!filters.location?.coordinates;
  const isServiceItem = (item: ServiceSearchItem | GeoSearchResult): item is ServiceSearchItem => {
    return (item as ServiceSearchItem).pricing !== undefined && (item as ServiceSearchItem).title !== undefined;
  };
  const isGeoItem = (item: ServiceSearchItem | GeoSearchResult): item is GeoSearchResult => {
    return (item as GeoSearchResult).provider !== undefined && (item as any).title === undefined;
  };
  
  const sortOptions = useMemo(() => getSortOptions(hasCoordinates), [hasCoordinates]);
  
  const paginationData = useMemo(() => {
    const itemsPerPage = filters.limit || 20;
    const totalPages = Math.ceil(totalCount / itemsPerPage);
    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalCount);
    
    return { itemsPerPage, totalPages, startItem, endItem };
  }, [filters.limit, totalCount, currentPage]);
  
  const { totalPages, startItem, endItem } = paginationData;

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
            <div className="flex space-x-4">
              <div className="w-24 h-24 bg-gray-200 rounded-lg"></div>
              <div className="flex-1 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-3 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {totalCount > 0 ? `${totalCount} servizi trovati` : 'Nessun servizio trovato'}
          </h2>
          {totalCount > 0 && (
            <p className="text-gray-600 mt-1">
              Mostrando {startItem}-{endItem} di {totalCount} risultati
            </p>
          )}
        </div>

        {totalCount > 0 && (
          <div className="mt-4 sm:mt-0">
            <select
              value={filters.sort_by}
              onChange={(e) => onSortChange(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  Ordina per: {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Results List */}
      {results.length > 0 ? (
        <div className="space-y-4" role="list" aria-label="Risultati della ricerca">
          {results.map((item) => (
            isServiceItem(item) ? (
              <div
                key={item.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6"
                role="listitem"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="w-full lg:w-32 h-32 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {Array.isArray(item.images) && item.images.length > 0 ? (
                      <img src={getImageUrl(item.images[0])} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <CurrencyEuroIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {item.featured && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2 py-1 rounded-full">In evidenza</span>
                          )}
                          <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">{getCategoryLabel(item.category)}</span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          <Link to={`/services/${item.id}`} className="hover:text-blue-600 transition-colors">{item.title}</Link>
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">{item.subcategory}</p>
                      </div>
                      <div className="flex-shrink-0 ml-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getAvailabilityColor(item.availability)}`}>
                          <ClockIcon className="h-3 w-3 mr-1" />
                          {getAvailabilityLabel(item.availability)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{item.provider.business_name}</span>
                        {item.provider.verified && (<CheckBadgeIcon className="h-5 w-5 text-green-500 ml-1" />)}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPinIcon className="h-4 w-4 mr-1" />
                        <>{item.provider.location.city}, {item.provider.location.province}</>
                      </div>
                      {item.provider.rating_average > 0 && (
                        <div className="flex items-center">
                          <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                          <span className="text-sm font-medium text-gray-900">{item.provider.rating_average.toFixed(1)}</span>
                          <span className="text-sm text-gray-500 ml-1">({item.provider.reviews_count})</span>
                        </div>
                      )}
                    </div>
                    {Array.isArray(item.tags) && item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {item.tags.slice(0, 4).map((tag) => (
                          <span key={tag} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{tag}</span>
                        ))}
                        {item.tags.length > 4 && (
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">+{item.tags.length - 4}</span>
                        )}
                      </div>
                    )}
                    <div className="flex items-center justify-between">
                      <div className="flex items-baseline">
                        <span className="text-2xl font-bold text-gray-900">€{item.pricing.base_price}</span>
                        <span className="text-gray-500 ml-1">{getPricingUnitLabel(item.pricing.pricing_unit)}</span>
                      </div>
                      <div className="flex gap-2">
                        <Link to={`/services/${item.id}`} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-4 py-2 rounded-lg transition-colors text-sm">Dettagli</Link>
                        <Link to={`/services/${item.id}/book`} className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg transition-colors text-sm">{item.availability === 'immediate' ? 'Prenota Ora' : 'Richiedi Preventivo'}</Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : isGeoItem(item) ? (
              <div
                key={item.provider.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6"
                role="listitem"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">
                          <Link to={`/providers/${item.provider.id}`} className="hover:text-blue-600 transition-colors">{item.provider.provider_profile.business_name}</Link>
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <div className="flex items-center">
                            <MapPinIcon className="h-4 w-4 mr-1" />
                            <>{item.provider.provider_profile.address?.city}, {item.provider.provider_profile.address?.province}</>
                          </div>
                          <div className="flex items-center">
                            <ClockIcon className="h-4 w-4 mr-1" />
                            <span className="text-blue-600 font-medium">{item.distance.toFixed(1)} km</span>
                          </div>
                          {item.provider.provider_profile.rating_average > 0 && (
                            <div className="flex items-center">
                              <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                              <span className="text-sm font-medium text-gray-900">{item.provider.provider_profile.rating_average.toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {item.provider.provider_profile.verified && (<CheckBadgeIcon className="h-5 w-5 text-green-500 ml-4" />)}
                    </div>
                    {Array.isArray(item.matchedServices) && item.matchedServices.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-4">
                        {item.matchedServices.slice(0, 4).map((tag) => (
                          <span key={tag} className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">{tag}</span>
                        ))}
                        {item.matchedServices.length > 4 && (
                          <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded-full">+{item.matchedServices.length - 4}</span>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Link to={`/providers/${item.provider.id}`} className="bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 font-medium px-4 py-2 rounded-lg transition-colors text-sm">Vedi Fornitore</Link>
                    </div>
                  </div>
                </div>
              </div>
            ) : null
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.562M15 6.306a7.962 7.962 0 00-6 0m6 0V5a2 2 0 00-2-2H9a2 2 0 00-2 2v1.306" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nessun servizio trovato</h3>
          <p className="text-gray-600 mb-4">
            Prova a modificare i filtri di ricerca o ampliare l'area geografica.
          </p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6 mt-8 rounded-lg">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Vai alla pagina precedente"
            >
              Precedente
            </button>
            <button
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Vai alla pagina successiva"
            >
              Successivo
            </button>
          </div>
          
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{startItem}</span> - <span className="font-medium">{endItem}</span> di{' '}
                <span className="font-medium">{totalCount}</span> risultati
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Navigazione pagine risultati" role="navigation">
                <button
                  onClick={() => onPageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Vai alla pagina precedente"
                >
                  <span className="sr-only">Precedente</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clipRule="evenodd" />
                  </svg>
                </button>
                
                {/* Page Numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => onPageChange(pageNum)}
                      className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold ${
                        pageNum === currentPage
                          ? 'z-10 bg-blue-600 text-white focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                          : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => onPageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  aria-label="Vai alla pagina successiva"
                >
                  <span className="sr-only">Successivo</span>
                  <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clipRule="evenodd" />
                  </svg>
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default SearchResults;