import React from 'react';
import { Link } from 'react-router-dom';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/Layout/Layout';

interface PlaceholderPageProps {
  title?: string;
  description?: string;
  showBackButton?: boolean;
}

export default function PlaceholderPage({ 
  title = "Pagina in Costruzione", 
  description = "Questa pagina è attualmente in fase di sviluppo. Torneremo presto con contenuti aggiornati.",
  showBackButton = true 
}: PlaceholderPageProps) {
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center">
          <div className="mb-8">
            <ExclamationTriangleIcon className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{title}</h1>
            <p className="text-gray-600 mb-8">{description}</p>
          </div>
          
          {showBackButton && (
            <div className="space-y-4">
              <Link
                to="/"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors block"
              >
                Torna alla Home
              </Link>
              
              <Link
                to="/search"
                className="w-full bg-white hover:bg-gray-50 text-blue-600 font-medium py-3 px-4 rounded-lg border border-blue-600 transition-colors block"
              >
                Cerca Servizi
              </Link>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}