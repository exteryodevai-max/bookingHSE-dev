import React from 'react';
import { Mail, ArrowLeft } from '../../lib/icons';
import { Link } from 'react-router-dom';

const EmailVerificationWait: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Verifica la tua email
          </h1>
          <p className="text-gray-600">
            Ti abbiamo inviato un'email di verifica. Controlla la tua casella di posta e clicca sul link per verificare il tuo account.
          </p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-blue-900 mb-2">Cosa fare ora:</h3>
          <ol className="text-sm text-blue-800 text-left space-y-1">
            <li>1. Controlla la tua casella di posta</li>
            <li>2. Cerca l'email da BookingHSE</li>
            <li>3. Clicca sul link di verifica</li>
            <li>4. Completa la verifica</li>
          </ol>
        </div>

        <div className="text-sm text-gray-500 mb-6">
          Non hai ricevuto l'email? Controlla anche nella cartella spam.
        </div>

        <Link
          to="/auth/login"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Torna al login
        </Link>
      </div>
    </div>
  );
};

export default EmailVerificationWait;