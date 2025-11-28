import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import PlaceholderPage from './Common/PlaceholderPage';

export default function NotificationsPage() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accesso Richiesto</h1>
          <p className="text-gray-600 mb-8">Devi effettuare l'accesso per visualizzare le notifiche.</p>
        </div>
      </Layout>
    );
  }

  return (
    <PlaceholderPage
      title="Centro Notifiche"
      description="Il centro notifiche è in fase di sviluppo. Presto potrai gestire tutte le tue notifiche e preferenze di comunicazione da questa pagina."
    />
  );
}