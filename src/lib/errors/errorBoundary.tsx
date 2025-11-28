import React, { Component, ReactNode } from 'react';
import { parseSupabaseError, logSupabaseError, SupabaseError } from './supabaseErrors';

interface ErrorBoundaryState {
  hasError: boolean;
  error: SupabaseError | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: SupabaseError, retry: () => void) => ReactNode;
  onError?: (error: SupabaseError, errorInfo: React.ErrorInfo) => void;
}

export class SupabaseErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    // Aggiorna lo state per mostrare la UI di fallback
    const supabaseError = parseSupabaseError(error, 'ErrorBoundary');
    return {
      hasError: true,
      error: supabaseError
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const supabaseError = parseSupabaseError(error, 'ErrorBoundary');
    
    // Log dell'errore
    logSupabaseError(supabaseError, 'ErrorBoundary');
    
    // Aggiorna lo state con le informazioni dell'errore
    this.setState({
      errorInfo
    });

    // Callback personalizzata per gestire l'errore
    if (this.props.onError) {
      this.props.onError(supabaseError, errorInfo);
    }

    // In produzione, invia a Sentry
    if (import.meta.env.PROD && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        tags: {
          error_boundary: true,
          error_code: supabaseError.code
        },
        extra: {
          errorInfo,
          user_message: supabaseError.userMessage
        }
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Se è fornito un fallback personalizzato, usalo
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleRetry);
      }

      // UI di fallback predefinita
      return (
        <DefaultErrorFallback 
          error={this.state.error}
          onRetry={this.handleRetry}
          onGoHome={this.handleGoHome}
        />
      );
    }

    return this.props.children;
  }
}

interface DefaultErrorFallbackProps {
  error: SupabaseError;
  onRetry: () => void;
  onGoHome: () => void;
}

function DefaultErrorFallback({ error, onRetry, onGoHome }: DefaultErrorFallbackProps) {
  const getSeverityColor = (severity: SupabaseError['severity']) => {
    switch (severity) {
      case 'low': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'medium': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'critical': return 'text-red-800 bg-red-100 border-red-300';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: SupabaseError['severity']) => {
    switch (severity) {
      case 'low': return '⚠️';
      case 'medium': return '🔶';
      case 'high': return '🔴';
      case 'critical': return '💥';
      default: return '❓';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="text-6xl mb-4">
              {getSeverityIcon(error.severity)}
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Oops! Qualcosa è andato storto
            </h2>
            <p className="text-sm text-gray-600">
              Si è verificato un errore imprevisto nell'applicazione
            </p>
          </div>

          {/* Error Details */}
          <div className={`rounded-md border p-4 mb-6 ${getSeverityColor(error.severity)}`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-lg">
                  {getSeverityIcon(error.severity)}
                </span>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium">
                  {error.userMessage}
                </h3>
                {error.hint && (
                  <p className="mt-2 text-sm opacity-80">
                    💡 {error.hint}
                  </p>
                )}
                {import.meta.env.DEV && (
                  <details className="mt-3">
                    <summary className="text-xs cursor-pointer hover:underline">
                      Dettagli tecnici (solo in sviluppo)
                    </summary>
                    <div className="mt-2 text-xs font-mono bg-black bg-opacity-10 p-2 rounded">
                      <p><strong>Codice:</strong> {error.code}</p>
                      <p><strong>Messaggio:</strong> {error.message}</p>
                      {error.details && (
                        <p><strong>Dettagli:</strong> {error.details}</p>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {error.retryable && (
              <button
                onClick={onRetry}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🔄 Riprova
              </button>
            )}
            
            <button
              onClick={onGoHome}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              🏠 Torna alla Home
            </button>

            <button
              onClick={() => window.location.reload()}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              🔄 Ricarica Pagina
            </button>
          </div>

          {/* Support Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Se il problema persiste, contatta il supporto tecnico
            </p>
            {import.meta.env.DEV && (
              <p className="text-xs text-gray-400 mt-1">
                Errore ID: {error.code}-{Date.now()}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Hook per utilizzare l'Error Boundary in modo programmatico
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const captureError = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  return { captureError, resetError };
}

// HOC per wrappare componenti con Error Boundary
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <SupabaseErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </SupabaseErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Componente per errori specifici di sezioni
interface SectionErrorBoundaryProps extends ErrorBoundaryProps {
  sectionName: string;
  showMinimal?: boolean;
}

export function SectionErrorBoundary({ 
  sectionName, 
  showMinimal = false, 
  children, 
  ...props 
}: SectionErrorBoundaryProps) {
  const fallback = (error: SupabaseError, retry: () => void) => {
    if (showMinimal) {
      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <div className="flex items-center">
            <span className="text-red-500 mr-2">⚠️</span>
            <div className="flex-1">
              <p className="text-sm text-red-800 font-medium">
                Errore in {sectionName}
              </p>
              <p className="text-xs text-red-600 mt-1">
                {error.userMessage}
              </p>
            </div>
            {error.retryable && (
              <button
                onClick={retry}
                className="ml-2 text-xs bg-red-100 hover:bg-red-200 text-red-800 px-2 py-1 rounded transition-colors"
              >
                Riprova
              </button>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="p-6 border border-red-200 bg-red-50 rounded-lg">
        <div className="text-center">
          <div className="text-4xl mb-3">😵</div>
          <h3 className="text-lg font-medium text-red-900 mb-2">
            Errore in {sectionName}
          </h3>
          <p className="text-sm text-red-700 mb-4">
            {error.userMessage}
          </p>
          {error.hint && (
            <p className="text-xs text-red-600 mb-4">
              💡 {error.hint}
            </p>
          )}
          <div className="space-x-2">
            {error.retryable && (
              <button
                onClick={retry}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                🔄 Riprova
              </button>
            )}
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              🔄 Ricarica
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <SupabaseErrorBoundary 
      {...props} 
      fallback={fallback}
      onError={(error, errorInfo) => {
        // Log con contesto della sezione
        logSupabaseError(error, `Section: ${sectionName}`);
        props.onError?.(error, errorInfo);
      }}
    >
      {children}
    </SupabaseErrorBoundary>
  );
}