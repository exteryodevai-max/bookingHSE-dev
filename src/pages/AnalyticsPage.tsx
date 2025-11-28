import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout/Layout';
import PlaceholderPage from './Common/PlaceholderPage';

export default function AnalyticsPage() {
  const { user } = useAuth();

  if (!user || user.user_type !== 'provider') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accesso Riservato ai Fornitori</h1>
          <p className="text-gray-600 mb-8">Solo i fornitori registrati possono accedere agli analytics.</p>
        </div>
      </Layout>
    );
  }

  return (
    <PlaceholderPage
      title="Analytics e Statistiche"
      description="La dashboard analytics è in fase di sviluppo. Presto potrai visualizzare statistiche dettagliate sulle tue prenotazioni, ricavi e performance."
    />
  );
}