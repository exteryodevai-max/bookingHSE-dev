import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

// Tipi per la gestione degli errori
export interface SupabaseError {
  code: string;
  message: string;
  userMessage: string;
  details?: string;
  hint?: string;
  retryable: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: any) => void;
}

// Mappa degli errori PostgreSQL/Supabase più comuni
const ERROR_CODES: Record<string, Omit<SupabaseError, 'message' | 'details'>> = {
  // Errori di autenticazione
  'invalid_credentials': {
    code: 'invalid_credentials',
    userMessage: 'Email o password non corretti',
    hint: 'Verifica le tue credenziali e riprova',
    retryable: false,
    severity: 'medium'
  },
  'email_not_confirmed': {
    code: 'email_not_confirmed',
    userMessage: 'Email non confermata',
    hint: 'Controlla la tua casella email e clicca sul link di conferma',
    retryable: false,
    severity: 'medium'
  },
  'signup_disabled': {
    code: 'signup_disabled',
    userMessage: 'Registrazione temporaneamente disabilitata',
    hint: 'Riprova più tardi o contatta il supporto',
    retryable: true,
    severity: 'high'
  },
  'email_address_invalid': {
    code: 'email_address_invalid',
    userMessage: 'Indirizzo email non valido',
    hint: 'Inserisci un indirizzo email valido',
    retryable: false,
    severity: 'low'
  },
  'password_too_short': {
    code: 'password_too_short',
    userMessage: 'Password troppo corta',
    hint: 'La password deve essere di almeno 6 caratteri',
    retryable: false,
    severity: 'low'
  },
  'weak_password': {
    code: 'weak_password',
    userMessage: 'Password troppo debole',
    hint: 'La password deve contenere almeno una lettera maiuscola, una minuscola e un numero',
    retryable: false,
    severity: 'low'
  },
  'user_already_registered': {
    code: 'user_already_registered',
    userMessage: 'Un utente con questa email è già registrato',
    hint: 'Prova con un\'altra email o effettua il login',
    retryable: false,
    severity: 'medium'
  },
  'session_not_found': {
    code: 'session_not_found',
    userMessage: 'Sessione scaduta',
    hint: 'Effettua nuovamente l\'accesso',
    retryable: false,
    severity: 'medium'
  },
  'token_expired': {
    code: 'token_expired',
    userMessage: 'Sessione scaduta',
    hint: 'Effettua nuovamente l\'accesso',
    retryable: false,
    severity: 'medium'
  },

  // Errori PostgreSQL
  '23505': {
    code: '23505',
    userMessage: 'Questo dato è già presente nel sistema',
    hint: 'Prova con informazioni diverse',
    retryable: false,
    severity: 'medium'
  },
  '23503': {
    code: '23503',
    userMessage: 'Riferimento non valido',
    hint: 'Assicurati che tutti i dati collegati esistano',
    retryable: false,
    severity: 'medium'
  },
  '23502': {
    code: '23502',
    userMessage: 'Campo obbligatorio mancante',
    hint: 'Compila tutti i campi richiesti',
    retryable: false,
    severity: 'medium'
  },
  '23514': {
    code: '23514',
    userMessage: 'Valore non valido per questo campo',
    hint: 'Controlla i dati inseriti',
    retryable: false,
    severity: 'medium'
  },
  '42501': {
    code: '42501',
    userMessage: 'Accesso negato',
    hint: 'Non hai i permessi per eseguire questa operazione',
    retryable: false,
    severity: 'high'
  },
  '42P01': {
    code: '42P01',
    userMessage: 'Risorsa non trovata',
    hint: 'La risorsa richiesta non esiste',
    retryable: false,
    severity: 'medium'
  },
  '08000': {
    code: '08000',
    userMessage: 'Problema di connessione al database',
    hint: 'Riprova tra qualche istante',
    retryable: true,
    severity: 'high'
  },
  '08003': {
    code: '08003',
    userMessage: 'Connessione al database persa',
    hint: 'Riprova tra qualche istante',
    retryable: true,
    severity: 'high'
  },
  '08006': {
    code: '08006',
    userMessage: 'Impossibile connettersi al database',
    hint: 'Controlla la tua connessione internet',
    retryable: true,
    severity: 'high'
  },
  '42601': {
    code: '42601',
    userMessage: 'Errore interno del sistema',
    hint: 'Riprova più tardi o contatta il supporto',
    retryable: false,
    severity: 'critical'
  },
  '42703': {
    code: '42703',
    userMessage: 'Campo richiesto non disponibile',
    hint: 'Contatta il supporto tecnico',
    retryable: false,
    severity: 'high'
  },

  // Errori PostgREST
  'PGRST116': {
    code: 'PGRST116',
    userMessage: 'Record non trovato',
    hint: 'Il dato richiesto non esiste o è stato eliminato',
    retryable: false,
    severity: 'medium'
  },
  'PGRST301': {
    code: 'PGRST301',
    userMessage: 'Richiesta non valida',
    hint: 'Controlla i dati inseriti e riprova',
    retryable: false,
    severity: 'medium'
  },
  'PGRST302': {
    code: 'PGRST302',
    userMessage: 'Campo richiesto non disponibile',
    hint: 'Contatta il supporto tecnico',
    retryable: false,
    severity: 'high'
  },
  'PGRST204': {
    code: 'PGRST204',
    userMessage: 'Nessun dato disponibile',
    hint: 'Non ci sono dati da visualizzare',
    retryable: false,
    severity: 'low'
  },

  // Errori di rete
  'NetworkError': {
    code: 'NetworkError',
    userMessage: 'Problema di connessione',
    hint: 'Controlla la tua connessione internet e riprova',
    retryable: true,
    severity: 'medium'
  },
  'TimeoutError': {
    code: 'TimeoutError',
    userMessage: 'Operazione scaduta',
    hint: 'Il server sta impiegando troppo tempo a rispondere, riprova',
    retryable: true,
    severity: 'medium'
  },

  // Errori Storage
  'storage/object-not-found': {
    code: 'storage/object-not-found',
    userMessage: 'File non trovato',
    hint: 'Il file richiesto non esiste o è stato eliminato',
    retryable: false,
    severity: 'medium'
  },
  'storage/unauthorized': {
    code: 'storage/unauthorized',
    userMessage: 'Accesso al file negato',
    hint: 'Non hai i permessi per accedere a questo file',
    retryable: false,
    severity: 'high'
  },
  'storage/quota-exceeded': {
    code: 'storage/quota-exceeded',
    userMessage: 'Spazio di archiviazione esaurito',
    hint: 'Elimina alcuni file per liberare spazio',
    retryable: false,
    severity: 'high'
  }
};

// Funzione principale per il parsing degli errori
export function parseSupabaseError(error: any, context?: string): SupabaseError {
  console.error('Supabase Error:', error, 'Context:', context);

  // Estrai il codice errore da diverse strutture possibili
  const errorCode = error?.code || 
                   error?.error_code || 
                   error?.name || 
                   error?.message?.includes('duplicate key') ? '23505' :
                   error?.message?.includes('violates foreign key') ? '23503' :
                   error?.message?.includes('violates not-null') ? '23502' :
                   error?.message?.includes('violates check') ? '23514' :
                   error?.message?.includes('already exists') ? '23505' :
                   error?.message?.includes('already registered') ? '23505' :
                   'unknown';

  // Cerca il mapping dell'errore
  const mappedError = ERROR_CODES[errorCode];
  
  if (mappedError) {
    const result: SupabaseError = {
      ...mappedError,
      message: error?.message || 'Errore sconosciuto',
      details: error?.details || error?.hint || undefined
    };

    // Personalizza il messaggio per contesti specifici
    if (errorCode === '23505') {
      // Check for email-related duplicates in context or error message
      const errorMessage = (error?.message || '').toLowerCase();
      const errorDetails = (error?.details || '').toLowerCase();
      const errorHint = (error?.hint || '').toLowerCase();
      
      if (context?.includes('email') || 
          errorMessage.includes('email') ||
          errorDetails.includes('email') ||
          errorHint.includes('email') ||
          errorMessage.includes('users_email_key') ||
          errorDetails.includes('users_email_key') ||
          errorMessage.includes('duplicate key') && (errorMessage.includes('email') || errorDetails.includes('email'))) {
        result.userMessage = 'Questa email è già registrata';
        result.hint = 'Prova con un\'altra email o effettua il login';
      } else if (context?.includes('vat') || context?.includes('partita_iva')) {
        result.userMessage = 'Questa partita IVA è già registrata';
        result.hint = 'Verifica la partita IVA inserita';
      } else if (context?.includes('fiscal_code') || context?.includes('codice_fiscale')) {
        result.userMessage = 'Questo codice fiscale è già registrato';
        result.hint = 'Verifica il codice fiscale inserito';
      }
    }

    return result;
  }

  // Errore non mappato - crea un errore generico
  return {
    code: errorCode,
    message: error?.message || 'Errore sconosciuto',
    userMessage: 'Si è verificato un errore imprevisto',
    hint: 'Riprova tra qualche istante. Se il problema persiste, contatta il supporto',
    retryable: isRetryableError(error),
    severity: 'medium',
    details: JSON.stringify(error, null, 2)
  };
}

// Determina se un errore è riprovabile
function isRetryableError(error: any): boolean {
  const retryableCodes = ['NetworkError', 'TimeoutError', 'signup_disabled', '08000', '08003', '08006'];
  const errorCode = error?.code || error?.name || '';
  
  // Errori di rete sono generalmente riprovabili
  if (error?.name === 'NetworkError' || error?.message?.includes('network')) {
    return true;
  }
  
  // Errori di timeout
  if (error?.name === 'TimeoutError' || error?.message?.includes('timeout')) {
    return true;
  }
  
  // Errori del server (5xx)
  if (error?.status >= 500 && error?.status < 600) {
    return true;
  }
  
  return retryableCodes.includes(errorCode);
}

// Funzione di retry con backoff esponenziale
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      const parsedError = parseSupabaseError(error);
      
      // Se l'errore non è riprovabile, fallisci immediatamente
      if (!parsedError.retryable || attempt === maxAttempts) {
        throw error;
      }

      // Calcola il delay con backoff esponenziale
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      
      // Notifica il tentativo di retry
      if (onRetry) {
        onRetry(attempt, error);
      }

      console.warn(`Tentativo ${attempt}/${maxAttempts} fallito, riprovo tra ${delay}ms:`, error);
      
      // Aspetta prima del prossimo tentativo
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Hook React per la gestione degli errori
export function useSupabaseError() {
  const handleError = useCallback((error: any, context?: string) => {
    const supabaseError = parseSupabaseError(error, context);
    
    // Log per debugging
    console.error('Supabase Error Handled:', {
      code: supabaseError.code,
      userMessage: supabaseError.userMessage,
      context,
      originalError: error
    });

    // Mostra toast all'utente
    toast.error(supabaseError.userMessage, {
      duration: supabaseError.severity === 'critical' ? 8000 : 4000,
      position: 'top-right'
    });

    // In produzione, invia a Sentry o altro servizio di monitoring
    if (import.meta.env.PROD && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          error_code: supabaseError.code,
          context: context || 'unknown'
        },
        extra: {
          user_message: supabaseError.userMessage,
          details: supabaseError.details
        }
      });
    }

    return supabaseError;
  }, []);

  const handleErrorWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    context?: string,
    retryOptions?: RetryOptions
  ): Promise<T> => {
    try {
      return await withRetry(operation, {
        ...retryOptions,
        onRetry: (attempt, error) => {
          const supabaseError = parseSupabaseError(error, context);
          toast.loading(`Tentativo ${attempt}... ${supabaseError.userMessage}`, {
            duration: 2000
          });
          retryOptions?.onRetry?.(attempt, error);
        }
      });
    } catch (error) {
      handleError(error, context);
      throw error;
    }
  }, [handleError]);

  const logError = useCallback((error: SupabaseError, context?: string) => {
    logSupabaseError(error, context);
  }, []);

  return {
    handleError,
    handleErrorWithRetry,
    parseSupabaseError,
    logError
  };
}

// Utility per logging strutturato
export function logSupabaseError(error: SupabaseError, context?: string) {
  const logData = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    userMessage: error.userMessage,
    context: context || 'unknown',
    severity: error.severity,
    retryable: error.retryable,
    details: error.details
  };

  if (import.meta.env.DEV) {
    console.group(`🚨 Supabase Error [${error.severity.toUpperCase()}]`);
    console.error('Code:', error.code);
    console.error('User Message:', error.userMessage);
    console.error('Technical Message:', error.message);
    if (error.hint) console.info('Hint:', error.hint);
    if (context) console.info('Context:', context);
    console.error('Details:', logData);
    console.groupEnd();
  }

  // In produzione, invia al servizio di logging
  if (import.meta.env.PROD) {
    // Qui puoi integrare con servizi come Sentry, LogRocket, etc.
    console.error('Supabase Error:', logData);
  }
}

// Funzioni di utilità per compatibilità con il codice esistente
export function handleSupabaseError(error: any): SupabaseError {
  return parseSupabaseError(error);
}

export function getErrorMessage(error: any): string {
  return parseSupabaseError(error).userMessage;
}

export function isErrorType(error: any, category: string): boolean {
  const supabaseError = parseSupabaseError(error);
  // Mappa le categorie vecchie a quelle nuove
  const categoryMap: Record<string, boolean> = {
    'auth': ['invalid_credentials', 'email_not_confirmed', 'signup_disabled', 'session_not_found', 'token_expired'].includes(supabaseError.code),
    'database': supabaseError.code.startsWith('PGRST') || /^\d+$/.test(supabaseError.code),
    'storage': supabaseError.code.startsWith('storage/'),
    'network': ['NetworkError', 'TimeoutError'].includes(supabaseError.code),
    'validation': ['email_address_invalid', 'password_too_short', 'weak_password', '23505', '23502', '23514'].includes(supabaseError.code)
  };
  
  return categoryMap[category] || false;
}

export function isCriticalError(error: any): boolean {
  return parseSupabaseError(error).severity === 'critical';
}

export function isWarning(error: any): boolean {
  return parseSupabaseError(error).severity === 'low';
}

export function isNotFoundError(error: any): boolean {
  const supabaseError = parseSupabaseError(error);
  return supabaseError.code === 'PGRST116';
}

export function isDuplicateError(error: any): boolean {
  const supabaseError = parseSupabaseError(error);
  return supabaseError.code === '23505';
}

export function isPermissionError(error: any): boolean {
  const supabaseError = parseSupabaseError(error);
  return supabaseError.code === '42501' || isErrorType(error, 'auth');
}

// Wrapper per operazioni async con gestione errori
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  context?: string
): Promise<{ data: T | null; error: SupabaseError | null }> {
  try {
    const data = await operation();
    return { data, error: null };
  } catch (err) {
    const error = parseSupabaseError(err, context);
    logSupabaseError(error, context);
    return { data: null, error };
  }
}

// Classe per errori personalizzati di Supabase
export class SupabaseErrorClass extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly severity: SupabaseError['severity'];
  public readonly retryable: boolean;

  constructor(errorInfo: SupabaseError) {
    super(errorInfo.message);
    this.name = 'SupabaseError';
    this.code = errorInfo.code;
    this.userMessage = errorInfo.userMessage;
    this.severity = errorInfo.severity;
    this.retryable = errorInfo.retryable;
  }

  static fromError(error: any): SupabaseErrorClass {
    const errorInfo = parseSupabaseError(error);
    return new SupabaseErrorClass(errorInfo);
  }
}