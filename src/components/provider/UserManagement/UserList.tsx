/**
 * UserList Component
 * Visualizza la lista degli utenti del provider con azioni disponibili
 */

import React, { useState } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';
import type { ProviderUser, ProviderUserRole, ProviderUsersFilter } from '../../../types/providerUser';
import { ROLE_LABELS } from '../../../types/providerUser';

interface UserListProps {
  users: ProviderUser[];
  loading: boolean;
  error: string | null;
  onCreateUser: () => void;
  onEditUser?: (user: ProviderUser) => void;
  onDeactivateUser?: (userId: string) => void;
  onReactivateUser?: (userId: string) => void;
}

export default function UserList({
  users,
  loading,
  error,
  onCreateUser,
  onEditUser,
  onDeactivateUser,
  onReactivateUser
}: UserListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<ProviderUserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showFilters, setShowFilters] = useState(false);

  // Filter users based on search and filters
  const filteredUsers = users.filter(user => {
    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
      const matchesSearch =
        fullName.includes(searchLower) ||
        user.email.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    // Role filter
    if (roleFilter && user.role !== roleFilter) {
      return false;
    }

    // Status filter
    if (statusFilter === 'active' && !user.is_active) return false;
    if (statusFilter === 'inactive' && user.is_active) return false;

    return true;
  });

  // Get role badge color
  const getRoleBadgeColor = (role: ProviderUserRole): string => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800';
      case 'manager':
        return 'bg-blue-100 text-blue-800';
      case 'operator':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="animate-pulse flex items-center justify-between">
            <div className="h-6 bg-gray-200 rounded w-1/4"></div>
            <div className="h-10 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse flex items-center space-x-4">
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
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Errore nel caricamento
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowPathIcon className="h-4 w-4 mr-2" />
            Riprova
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Gestione Utenti</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestisci gli utenti della tua azienda
            </p>
          </div>
          <button
            onClick={onCreateUser}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Nuovo Utente
          </button>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Cerca per nome o email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-4 py-2 border rounded-lg transition-colors ${
                showFilters
                  ? 'border-blue-500 text-blue-600 bg-blue-50'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <FunnelIcon className="h-5 w-5 mr-2" />
              Filtri
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="flex flex-wrap gap-3 p-4 bg-gray-50 rounded-lg">
              {/* Role Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ruolo
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value as ProviderUserRole | '')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Tutti</option>
                  <option value="admin">Amministratore</option>
                  <option value="manager">Manager</option>
                  <option value="operator">Operatore</option>
                </select>
              </div>

              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stato
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tutti</option>
                  <option value="active">Attivi</option>
                  <option value="inactive">Disattivati</option>
                </select>
              </div>

              {/* Clear Filters */}
              {(roleFilter || statusFilter !== 'all' || searchTerm) && (
                <div className="flex items-end">
                  <button
                    onClick={() => {
                      setRoleFilter('');
                      setStatusFilter('all');
                      setSearchTerm('');
                    }}
                    className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 underline"
                  >
                    Cancella filtri
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Users List */}
      <div className="divide-y divide-gray-200">
        {filteredUsers.length > 0 ? (
          filteredUsers.map((user) => (
            <div
              key={user.id}
              className={`p-4 sm:p-6 hover:bg-gray-50 transition-colors ${
                !user.is_active ? 'bg-gray-50 opacity-75' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center min-w-0">
                  {/* Avatar */}
                  <div className="flex-shrink-0">
                    <UserCircleIcon className={`h-10 w-10 ${
                      user.is_active ? 'text-gray-400' : 'text-gray-300'
                    }`} />
                  </div>

                  {/* User Info */}
                  <div className="ml-4 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm font-medium truncate ${
                        user.is_active ? 'text-gray-900' : 'text-gray-500'
                      }`}>
                        {user.first_name} {user.last_name}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                        getRoleBadgeColor(user.role)
                      }`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                      {!user.is_active && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          Disattivato
                        </span>
                      )}
                    </div>
                    <p className={`text-sm truncate ${
                      user.is_active ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      {user.email}
                    </p>
                    {user.last_login && (
                      <p className="text-xs text-gray-400 mt-1">
                        Ultimo accesso: {new Date(user.last_login).toLocaleDateString('it-IT', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 ml-4">
                  {onEditUser && (
                    <button
                      onClick={() => onEditUser(user)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Modifica utente"
                    >
                      <PencilSquareIcon className="h-5 w-5" />
                    </button>
                  )}

                  {user.is_active ? (
                    onDeactivateUser && (
                      <button
                        onClick={() => {
                          if (window.confirm(`Sei sicuro di voler disattivare ${user.first_name} ${user.last_name}?`)) {
                            onDeactivateUser(user.user_id);
                          }
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        title="Disattiva utente"
                      >
                        <XCircleIcon className="h-5 w-5" />
                      </button>
                    )
                  ) : (
                    onReactivateUser && (
                      <button
                        onClick={() => onReactivateUser(user.user_id)}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                        title="Riattiva utente"
                      >
                        <CheckCircleIcon className="h-5 w-5" />
                      </button>
                    )
                  )}
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-12 text-center">
            <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || roleFilter || statusFilter !== 'all'
                ? 'Nessun utente trovato'
                : 'Nessun utente'
              }
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || roleFilter || statusFilter !== 'all'
                ? 'Prova a modificare i filtri di ricerca'
                : 'Aggiungi il primo utente alla tua azienda'
              }
            </p>
            {!searchTerm && !roleFilter && statusFilter === 'all' && (
              <button
                onClick={onCreateUser}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Aggiungi Utente
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer with count */}
      {users.length > 0 && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 rounded-b-xl">
          <p className="text-sm text-gray-600">
            {filteredUsers.length === users.length ? (
              <>
                <span className="font-medium">{users.length}</span> utent{users.length === 1 ? 'e' : 'i'} totale
              </>
            ) : (
              <>
                <span className="font-medium">{filteredUsers.length}</span> di{' '}
                <span className="font-medium">{users.length}</span> utenti
              </>
            )}
            {' - '}
            <span className="text-green-600">{users.filter(u => u.is_active).length} attivi</span>
            {users.filter(u => !u.is_active).length > 0 && (
              <>, <span className="text-red-600">{users.filter(u => !u.is_active).length} disattivati</span></>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
