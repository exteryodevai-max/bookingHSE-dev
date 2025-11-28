import React, { useState, useEffect } from 'react';
import { CheckCircle, Mail, Loader2, AlertCircle } from '../../lib/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { toast } from 'react-hot-toast';

const EmailVerificationConfirm: React.FC = () => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [autoVerified, setAutoVerified] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check if user came from email link with verification tokens
  useEffect(() => {
    const checkEmailVerification = async () => {
      const accessToken = searchParams.get('access_token');
      const refreshToken = searchParams.get('refresh_token');
      const type = searchParams.get('type');

      if (accessToken && refreshToken && type === 'signup') {
        setIsVerifying(true);
        try {
          // Set the session with the tokens from the URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Error setting session:', error);
            setHasError(true);
            toast.error('Errore durante la verifica automatica');
          } else if (data.user) {
            setIsVerified(true);
            setAutoVerified(true);
            toast.success('Email verificata automaticamente!');
            
            // Redirect al profilo utente
            setTimeout(() => {
              navigate('/profile');
            }, 2000);
          }
        } catch (error) {
          console.error('Error during auto verification:', error);
          setHasError(true);
          toast.error('Errore durante la verifica automatica');
        } finally {
          setIsVerifying(false);
        }
      }
    };

    checkEmailVerification();
  }, [searchParams, navigate]);

  const handleVerifyEmail = async () => {
    setIsVerifying(true);
    
    try {
      // Ottieni la sessione corrente per verificare se l'utente è autenticato
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        toast.error('Errore durante la verifica');
        setHasError(true);
        return;
      }

      if (session?.user) {
        // L'utente è già autenticato, verifica completata
        setIsVerified(true);
        toast.success('Email verificata con successo!');
        
        // Redirect al profilo utente
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } else {
        toast.error('Sessione non valida. Riprova il processo di verifica.');
        setHasError(true);
      }
    } catch (error) {
      console.error('Errore durante la verifica:', error);
      toast.error('Errore durante la verifica');
      setHasError(true);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifica Email
          </h1>
          <p className="text-gray-600">
            Hai cliccato sul link di verifica. Clicca il pulsante qui sotto per completare la verifica del tuo account.
          </p>
        </div>

        {isVerified ? (
          <div className="bg-green-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
              <span className="font-semibold text-green-900">
                {autoVerified ? 'Email verificata automaticamente!' : 'Email verificata!'}
              </span>
            </div>
            <p className="text-sm text-green-800">
              La tua email è stata verificata con successo. Sarai reindirizzato al tuo profilo.
            </p>
          </div>
        ) : hasError ? (
          <div className="bg-red-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
              <span className="font-semibold text-red-900">Errore di verifica</span>
            </div>
            <p className="text-sm text-red-800">
              Si è verificato un errore durante la verifica. Prova a cliccare il pulsante qui sotto o richiedi un nuovo link di verifica.
            </p>
          </div>
        ) : (
          <div className="bg-blue-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center mb-2">
              <Mail className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-semibold text-blue-900">Pronto per la verifica</span>
            </div>
            <p className="text-sm text-blue-800">
              {searchParams.get('access_token') 
                ? 'Verifica automatica in corso...' 
                : 'Clicca il pulsante qui sotto per completare la verifica del tuo account.'
              }
            </p>
          </div>
        )}

        <button
          onClick={handleVerifyEmail}
          disabled={isVerifying || isVerified}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
        >
          {isVerifying ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Verifica in corso...
            </>
          ) : isVerified ? (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Email Verificata
            </>
          ) : (
            <>
              <CheckCircle className="w-5 h-5 mr-2" />
              Verifica Email
            </>
          )}
        </button>

        <div className="mt-4 text-sm text-gray-500">
          Dopo la verifica sarai reindirizzato al tuo profilo.
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationConfirm;