/**
 * UserManagementPage
 * Pagina container per la gestione utenti del provider
 */

import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeftIcon,
  UsersIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Layout from '../../components/Layout/Layout';
import { UserList, CreateUserModal } from '../../components/provider/UserManagement';
import { useAuth } from '../../contexts/AuthContext';
import { useProviderUsers } from '../../hooks/useProviderUsers';
import { supabase } from '../../lib/postgrest';
import type { ProviderUser, CreateUserFormData } from '../../types/providerUser';
import { isProviderProfile } from '../../types';

export default function UserManagementPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [providerId, setProviderId] = useState<string | undefined>(undefined);

  // Fetch provider_profile_id based on user_id
  useEffect(() => {
    async function fetchProviderId() {
      if (user?.id && user?.user_type === 'provider') {
        try {
          const { data, error } = await supabase
            .from('provider_profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (data && !error) {
            setProviderId(data.id);
          }
        } catch (err) {
          console.error('Error fetching provider_id:', err);
        }
      }
    }
    fetchProviderId();
  }, [user?.id, user?.user_type]);

  const currentUserId = user?.id;

  // Check if user is a provider
  const isProvider = user?.user_type === 'provider';

  // Use the custom hook
  const {
    users,
    loading,
    error,
    createUser,
    deactivateUser,
    reactivateUser,
    refetch
  } = useProviderUsers(providerId, currentUserId);

  // Redirect if not a provider
  useEffect(() => {
    if (!authLoading && user && !isProvider) {
      toast.error('Accesso riservato ai fornitori');
      navigate('/dashboard');
    }
  }, [authLoading, user, isProvider, navigate]);

  // Handle create user
  const handleCreateUser = useCallback(async (data: CreateUserFormData) => {
    const result = await createUser(data);

    if (result.success) {
      toast.success(`Utente ${data.firstName} ${data.lastName} creato con successo`);
      setIsModalOpen(false);
    } else {
      toast.error(result.error || 'Errore durante la creazione dell\'utente');
    }

    return result;
  }, [createUser]);

  // Handle deactivate user
  const handleDeactivateUser = useCallback(async (userId: string) => {
    const result = await deactivateUser(userId);

    if (result.success) {
      toast.success('Utente disattivato con successo');
    } else {
      toast.error(result.error || 'Errore durante la disattivazione');
    }
  }, [deactivateUser]);

  // Handle reactivate user
  const handleReactivateUser = useCallback(async (userId: string) => {
    const result = await reactivateUser(userId);

    if (result.success) {
      toast.success('Utente riattivato con successo');
    } else {
      toast.error(result.error || 'Errore durante la riattivazione');
    }
  }, [reactivateUser]);

  // Handle edit user (placeholder for future implementation)
  const handleEditUser = useCallback((editUser: ProviderUser) => {
    // TODO: Implement edit user modal
    toast('Funzionalita di modifica in arrivo', { icon: 'info' });
    console.log('Edit user:', editUser);
  }, []);

  // Loading state
  if (authLoading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-4">
                    <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Access denied
  if (!isProvider) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Accesso Riservato
            </h2>
            <p className="text-gray-600 mb-4">
              Questa pagina e accessibile solo agli account fornitore.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Torna alla Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <Link
            to="/dashboard"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Torna alla Dashboard
          </Link>
        </nav>

        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <UsersIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestione Utenti
              </h1>
              <p className="text-gray-600 mt-1">
                Gestisci gli utenti che possono accedere al tuo account aziendale
              </p>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-1">
            Informazioni sui ruoli
          </h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>
              <strong>Amministratore:</strong> Accesso completo a tutte le funzionalita
            </li>
            <li>
              <strong>Manager:</strong> Gestione prenotazioni e servizi
            </li>
            <li>
              <strong>Operatore:</strong> Visualizzazione e gestione prenotazioni assegnate
            </li>
          </ul>
        </div>

        {/* User List */}
        <UserList
          users={users}
          loading={loading}
          error={error}
          onCreateUser={() => setIsModalOpen(true)}
          onEditUser={handleEditUser}
          onDeactivateUser={handleDeactivateUser}
          onReactivateUser={handleReactivateUser}
        />

        {/* Create User Modal */}
        <CreateUserModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleCreateUser}
        />
      </div>
    </Layout>
  );
}
