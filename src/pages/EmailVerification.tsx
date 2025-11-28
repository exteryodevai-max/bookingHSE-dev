import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getAuthParams } from '../utils/urlParams';

const EmailVerification: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'expired'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        const { token_hash, type, next } = getAuthParams();

        console.log('Email verification started:', { 
          token_hash: token_hash ? 'present' : 'missing', 
          type: type || 'missing', 
          next, 
          hash: window.location.hash 
        });

        if (!token_hash || !type) {
          console.error('Missing required parameters:', { 
            token_hash: token_hash ? 'present' : 'missing', 
            type: type || 'missing' 
          });
          setStatus('error');
          setMessage('Link di verifica non valido. Parametri mancanti.');
          return;
        }

        if (type !== 'signup') {
          console.error('Invalid verification type:', type);
          setStatus('error');
          setMessage('Tipo di verifica non supportato.');
          return;
        }

        console.log('Verifying email with Supabase...');
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: 'signup'
        });

        if (error) {
          console.error('Email verification failed:', error);
          if (error.message.includes('expired')) {
            setStatus('expired');
            setMessage('Il link di verifica è scaduto. Richiedi un nuovo link.');
          } else {
            setStatus('error');
            setMessage(`Errore durante la verifica: ${error.message}`);
          }
          return;
        }

        if (!data.session || !data.user) {
          console.error('No session or user after verification', { data });
          setStatus('error');
          setMessage('Sessione non valida dopo la verifica.');
          return;
        }

        console.log('Email verified successfully for user:', data.user?.id || 'unknown');
        setStatus('success');
        setMessage('Email verificata con successo! Reindirizzamento in corso...');
        
        // Redirect to login page after successful verification
        setTimeout(() => {
          navigate('/auth/login');
        }, 2000);

      } catch (error) {
        console.error('Unexpected error during email verification:', error);
        setStatus('error');
        setMessage('Si è verificato un errore imprevisto durante la verifica.');
      }
    };

    verifyEmail();
  }, [searchParams, navigate]);

  const renderIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-8 w-8 text-green-600" />;
      case 'expired':
        return <AlertCircle className="h-8 w-8 text-yellow-600" />;
      case 'error':
      default:
        return <XCircle className="h-8 w-8 text-red-600" />;
    }
  };

  const getTitle = () => {
    switch (status) {
      case 'loading':
        return 'Verifica in corso...';
      case 'success':
        return 'Email Verificata!';
      case 'expired':
        return 'Link Scaduto';
      case 'error':
      default:
        return 'Verifica Fallita';
    }
  };

  const getButtonColor = () => {
    switch (status) {
      case 'success':
        return 'bg-green-600 hover:bg-green-700';
      case 'expired':
        return 'bg-yellow-600 hover:bg-yellow-700';
      case 'error':
      default:
        return 'bg-red-600 hover:bg-red-700';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="bg-gray-100 rounded-full h-16 w-16 flex items-center justify-center mx-auto mb-6">
          {renderIcon()}
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          {getTitle()}
        </h2>
        
        <p className="text-gray-600 mb-8">
          {message || 'Verifica della tua email in corso...'}
        </p>
        
        {status !== 'loading' && status !== 'success' && (
          <div className="space-y-3">
            <button
              onClick={() => navigate('/auth/login')}
              className={`w-full text-white py-3 px-4 rounded-lg transition-colors font-medium ${getButtonColor()}`}
            >
              Vai al Login
            </button>
            <button
              onClick={() => navigate('/auth/register')}
              className="w-full bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Registrati di nuovo
            </button>
          </div>
        )}
        
        {status === 'success' && (
          <div className="animate-pulse text-blue-600 font-medium">
            Reindirizzamento in corso...
          </div>
        )}
      </div>
    </div>
  );
};

export default EmailVerification;