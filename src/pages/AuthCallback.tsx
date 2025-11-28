import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { getAuthParams, getHashParams } from '../utils/urlParams';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setLoading(true);
        setError(null);

        // Check for error parameters in URL first
        const { error_code: errorCode, error_description: errorDescription } = getAuthParams();
        
        if (errorCode) {
          let errorMessage = 'Errore durante la verifica dell\'account.';
          
          switch (errorCode) {
            case 'otp_expired':
              errorMessage = 'Il link di verifica è scaduto. Richiedi un nuovo link di conferma.';
              break;
            case 'access_denied':
              errorMessage = 'Accesso negato. Il link potrebbe essere già stato utilizzato.';
              break;
            default:
              errorMessage = errorDescription ? decodeURIComponent(errorDescription) : errorMessage;
          }
          
          setError(errorMessage);
          toast.error(errorMessage);
          setTimeout(() => navigate('/auth/login'), 5000);
          return;
        }

        // Get the session from the URL hash
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Errore durante la verifica:', error);
          setError('Errore durante la verifica dell\'email. Riprova.');
          toast.error('Errore durante la verifica dell\'email');
          return;
        }

        if (data.session) {
          toast.success('Email verificata con successo! Benvenuto!');
          // Reindirizza alla dashboard appropriata in base al tipo di utente

          // Redirect to email verification confirmation page
          navigate('/email-verification-confirm');
        } else {
          // Se non c'è sessione, potrebbe essere un link di conferma
          const hashParams = getHashParams();
          const accessToken = searchParams.get('access_token') || hashParams.get('access_token');
          const refreshToken = searchParams.get('refresh_token') || hashParams.get('refresh_token');
          
          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });
            
            if (sessionError) {
              console.error('Errore impostazione sessione:', sessionError);
              setError('Errore durante l\'attivazione dell\'account.');
              toast.error('Errore durante l\'attivazione dell\'account');
            } else {
              toast.success('Account attivato con successo!');
              
              // Get user profile and redirect to appropriate dashboard
              const { data: { user } } = await supabase.auth.getUser();
              if (user) {
                // Redirect to email verification confirmation page
                navigate('/email-verification-confirm');
              } else {
                navigate('/login?verified=true');
              }
            }
          } else {
            setError('Link di verifica non valido o scaduto.');
            toast.error('Link di verifica non valido o scaduto');
            setTimeout(() => navigate('/auth/login'), 3000);
          }
        }
      } catch (err) {
        console.error('Errore imprevisto:', err);
        setError('Si è verificato un errore imprevisto.');
        toast.error('Si è verificato un errore imprevisto');
      } finally {
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifica in corso...
          </h2>
          <p className="text-gray-600">
            Stiamo verificando il tuo account, attendere prego.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <div className="bg-red-100 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Verifica fallita
          </h2>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth/login')}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Vai al Login
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 transition-colors"
            >
              Registrati di nuovo
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default AuthCallback;