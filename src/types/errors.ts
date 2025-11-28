// Tipi per gestione errori specifici
export interface SupabaseError {
  code?: string;
  message: string;
  details?: string;
  hint?: string;
  status?: number;
}

export interface ValidationError extends Error {
  name: 'ValidationError';
  errors?: string[];
  inner?: ValidationError[];
}

export interface NetworkError extends Error {
  name: 'NetworkError';
  code: 'NETWORK_ERROR';
  status?: number;
}

export interface DatabaseError extends Error {
  code: string;
  message: string;
  severity?: 'ERROR' | 'WARNING' | 'INFO';
}

// Union type per tutti i possibili errori
export type AppError =
  | SupabaseError
  | ValidationError
  | NetworkError
  | DatabaseError
  | Error
  | unknown;

// Type guard functions
export function isSupabaseError(error: AppError): error is SupabaseError {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export function isValidationError(error: AppError): error is ValidationError {
  return error instanceof Error && error.name === 'ValidationError';
}

export function isNetworkError(error: AppError): error is NetworkError {
  return typeof error === 'object' &&
         error !== null &&
         'code' in error &&
         (error as any).code === 'NETWORK_ERROR';
}

export function isDatabaseError(error: AppError): error is DatabaseError {
  return typeof error === 'object' &&
         error !== null &&
         'code' in error &&
         typeof (error as any).code === 'string';
}

// Utility function per estrarre messaggio da qualsiasi tipo di errore
export function getErrorMessage(error: AppError): string {
  if (isValidationError(error)) {
    return `Errore di validazione: ${error.message}`;
  }

  if (isNetworkError(error) ||
      (typeof error === 'object' && error !== null && 'message' in error &&
       (error as any).message?.includes('fetch'))) {
    return 'Errore di connessione. Verifica la tua connessione internet e riprova.';
  }

  if (isDatabaseError(error)) {
    switch (error.code) {
      case '23505':
        return 'Questo profilo esiste già. Verifica i dati inseriti.';
      case 'PGRST301':
        return 'Non hai i permessi per aggiornare questo profilo.';
      case 'PGRST116':
        return 'Errore di connessione al database. Riprova tra qualche minuto.';
      case '42501':
        return 'Accesso negato. Verifica le tue credenziali.';
      case '08006':
        return 'Connessione al database interrotta. Riprova.';
      default:
        break;
    }
  }

  if (isSupabaseError(error) && error.status) {
    switch (error.status) {
      case 400:
        return 'Dati non validi. Verifica le informazioni inserite.';
      case 401:
        return 'Sessione scaduta. Effettua nuovamente il login.';
      case 403:
        return 'Non hai i permessi per questa operazione.';
      case 404:
        return 'Risorsa non trovata.';
      case 429:
        return 'Troppe richieste. Attendi qualche minuto prima di riprovare.';
      case 500:
        return 'Errore del server. Riprova tra qualche minuto.';
      case 503:
        return 'Servizio temporaneamente non disponibile.';
      default:
        return `Errore HTTP ${error.status}. Riprova.`;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String((error as any).message);
  }

  return 'Si è verificato un errore imprevisto. Riprova o contatta il supporto.';
}