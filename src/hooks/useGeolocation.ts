import { useState, useEffect, useMemo } from 'react';

export interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
  permission: 'granted' | 'prompt' | 'denied' | null;
}

export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
  watch?: boolean;
}

const defaultOptions: GeolocationOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 300000, // 5 minuti
  watch: false
};

export function useGeolocation(options: GeolocationOptions = {}) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    error: null,
    loading: false,
    permission: null
  });
  
  const opts = useMemo(() => ({ ...defaultOptions, ...options }), [
    options.enableHighAccuracy,
    options.timeout,
    options.maximumAge,
    options.watch
  ]);
  const isSecure = typeof window !== 'undefined' && (window.isSecureContext || location.protocol === 'https:' || location.hostname === 'localhost');
  
  useEffect(() => {
    if (typeof navigator.permissions !== 'undefined') {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((status) => {
        setState(prev => ({ ...prev, permission: status.state as 'granted' | 'prompt' | 'denied' }));
      }).catch(() => {});
    }
    if (!navigator.geolocation || !isSecure) {
      setState(prev => ({
        ...prev,
        error: !isSecure ? 'La geolocalizzazione richiede HTTPS o localhost' : 'Geolocalizzazione non supportata dal browser',
        loading: false
      }));
      return;
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    const onSuccess = (position: GeolocationPosition) => {
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        error: null,
        loading: false
      });
    };
    
    const onError = (error: GeolocationPositionError) => {
      let errorMessage = 'Errore sconosciuto';
      
      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage = 'Permesso di geolocalizzazione negato';
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = 'Posizione non disponibile';
          break;
        case error.TIMEOUT:
          errorMessage = 'Timeout nella richiesta di geolocalizzazione';
          break;
      }
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
    };
    
    let watchId: number | undefined;
    
    if (opts.watch) {
      watchId = navigator.geolocation.watchPosition(onSuccess, onError, opts);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, opts);
    }
    
    return () => {
      if (watchId !== undefined) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [opts]);
  
  const getCurrentPosition = () => {
    if (!navigator.geolocation || !isSecure) {
      setState(prev => ({
        ...prev,
        error: !isSecure ? 'La geolocalizzazione richiede HTTPS o localhost' : 'Geolocalizzazione non supportata dal browser'
      }));
      return Promise.reject(new Error('Geolocalizzazione non disponibile'));
    }
    
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    return new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            error: null,
            loading: false
          });
          resolve(position);
        },
        (error) => {
          let errorMessage = 'Errore sconosciuto';
          
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = 'Permesso di geolocalizzazione negato';
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = 'Posizione non disponibile';
              break;
            case error.TIMEOUT:
              errorMessage = 'Timeout nella richiesta di geolocalizzazione';
              break;
          }
          
          setState(prev => ({
            ...prev,
            error: errorMessage,
            loading: false
          }));
          reject(error);
        },
        opts
      );
    });
  };
  
  return {
    ...state,
    getCurrentPosition,
    isSupported: !!navigator.geolocation,
    isSecureContext: isSecure
  };
}