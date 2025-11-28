import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Mail, Clock, RefreshCw, ArrowLeft } from '../../lib/icons';
import { supabase } from '../../lib/supabase';
import toast from 'react-hot-toast';

const EmailWaiting: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isResending, setIsResending] = useState(false);
  
  const { email, userType } = location.state || {};

  // Se non abbiamo i dati necessari, reindirizza alla registrazione
  if (!email) {
    navigate('/auth/register');
    return null;
  }

  const handleResendEmail = async () => {
    setIsResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email
      });

      if (error) {
        toast.error('Errore durante l\'invio dell\'email: ' + error.message);
      } else {
        toast.success('Email di verifica inviata nuovamente!');
      }
    } catch {
      toast.error('Errore durante l\'invio dell\'email');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Controlla la tua email
          </h1>
          <p className="text-gray-600">
            Abbiamo inviato un link di verifica a:
          </p>
          <p className="font-semibold text-blue-600 mt-1">
            {email}
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Clock className="w-5 h-5 text-blue-600 mr-2" />
            <span className="font-semibold text-blue-900">In attesa di verifica</span>
          </div>
          <p className="text-sm text-blue-800">
            Clicca sul link nell'email per completare la registrazione del tuo account {userType === 'provider' ? 'fornitore' : 'cliente'}.
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleResendEmail}
            disabled={isResending}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
          >
            {isResending ? (
              <>
                <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                Invio in corso...
              </>
            ) : (
              <>
                <RefreshCw className="w-5 h-5 mr-2" />
                Invia di nuovo
              </>
            )}
          </button>

          <div className="text-sm text-gray-500 space-y-2">
            <p>Non hai ricevuto l'email?</p>
            <ul className="text-left space-y-1">
              <li>• Controlla la cartella spam/posta indesiderata</li>
              <li>• Verifica che l'indirizzo email sia corretto</li>
              <li>• L'email potrebbe impiegare alcuni minuti ad arrivare</li>
            </ul>
          </div>

          <div className="pt-4 border-t border-gray-200">
            <Link
              to="/auth/register"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Torna alla registrazione
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailWaiting;