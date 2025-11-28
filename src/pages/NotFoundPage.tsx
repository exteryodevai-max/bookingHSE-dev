import React from 'react';
import { useNavigate } from 'react-router-dom';
import { HomeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

const NotFoundPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md mx-auto p-6">
        <div className="bg-red-100 rounded-full h-20 w-20 flex items-center justify-center mx-auto mb-6">
          <svg className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Pagina non trovata
        </h2>
        
        <p className="text-gray-600 mb-8">
          La pagina che stai cercando non esiste o è stata spostata. 
          Verifica l'URL o torna alla homepage.
        </p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <HomeIcon className="h-5 w-5" />
            Torna alla Homepage
          </button>
          
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-200 text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-300 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <ArrowLeftIcon className="h-5 w-5" />
            Torna Indietro
          </button>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-4">
            Hai bisogno di aiuto?
          </p>
          <div className="space-y-2">
            <button
              onClick={() => navigate('/help')}
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Centro Assistenza
            </button>
            <button
              onClick={() => navigate('/contact')}
              className="w-full text-gray-600 hover:text-gray-700 text-sm font-medium"
            >
              Contattaci
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;