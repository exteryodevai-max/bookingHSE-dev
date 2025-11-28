// Export principale per il sistema di gestione errori Supabase

// Tipi e interfacce
export type {
  SupabaseError,
  RetryOptions
} from './supabaseErrors';

// Funzioni principali di gestione errori
export {
  parseSupabaseError,
  withRetry,
  useSupabaseError,
  logSupabaseError,
  withErrorHandling,
  SupabaseErrorClass
} from './supabaseErrors';

// Funzioni di utilità per compatibilità
export {
  handleSupabaseError,
  getErrorMessage,
  isErrorType,
  isCriticalError,
  isWarning,
  isNotFoundError,
  isDuplicateError,
  isPermissionError
} from './supabaseErrors';

// Componenti Error Boundary
export {
  SupabaseErrorBoundary,
  SectionErrorBoundary,
  useErrorBoundary,
  withErrorBoundary
} from './errorBoundary';

// Re-export per compatibilità con il codice esistente
export { parseSupabaseError as handleError } from './supabaseErrors';
export { SupabaseErrorBoundary as ErrorBoundary } from './errorBoundary';

// Costanti utili
export const ERROR_SEVERITY = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const
};

export const ERROR_CATEGORIES = {
  AUTH: 'auth' as const,
  DATABASE: 'database' as const,
  STORAGE: 'storage' as const,
  NETWORK: 'network' as const,
  VALIDATION: 'validation' as const
};

// Configurazioni predefinite per retry
export const RETRY_CONFIGS = {
  // Configurazione standard per operazioni normali
  STANDARD: {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000
  },
  
  // Configurazione per operazioni critiche
  CRITICAL: {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 10000
  },
  
  // Configurazione per operazioni di rete
  NETWORK: {
    maxAttempts: 3,
    baseDelay: 2000,
    maxDelay: 8000
  },
  
  // Configurazione per operazioni veloci
  FAST: {
    maxAttempts: 2,
    baseDelay: 500,
    maxDelay: 2000
  }
} as const;

// Utility per creare configurazioni personalizzate
export function createRetryConfig(
  maxAttempts: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 5000
): RetryOptions {
  return {
    maxAttempts,
    baseDelay,
    maxDelay
  };
}

// Helper per logging in sviluppo
export function devLog(message: string, data?: any) {
  if (import.meta.env.DEV) {
    console.log(`[Supabase Errors] ${message}`, data);
  }
}

// Helper per verificare se siamo in produzione
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

// Helper per verificare se Sentry è disponibile
export function isSentryAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).Sentry;
}

// Funzione di utilità per inizializzare il sistema di errori
export function initializeErrorHandling(config?: {
  enableSentry?: boolean;
  enableConsoleLogging?: boolean;
  defaultRetryConfig?: RetryOptions;
}) {
  const {
    enableSentry = isProduction(),
    enableConsoleLogging = !isProduction(),
    defaultRetryConfig = RETRY_CONFIGS.STANDARD
  } = config || {};

  devLog('Initializing Supabase Error Handling System', {
    enableSentry,
    enableConsoleLogging,
    defaultRetryConfig,
    environment: import.meta.env.MODE
  });

  // Qui potresti aggiungere logica di inizializzazione globale
  // come configurazione di Sentry, logging globale, etc.
  
  return {
    enableSentry,
    enableConsoleLogging,
    defaultRetryConfig
  };
}

// Export di default per importazione semplice
// Rimosso per evitare conflitti di riferimento