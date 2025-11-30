/**
 * Custom Hook: useProviderUsers
 * Gestisce lo stato e le operazioni per gli utenti fornitore
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getProviderUsers,
  createProviderUser,
  updateProviderUser,
  deactivateProviderUser,
  reactivateProviderUser,
  changeUserPassword
} from '../services/providerUsersService';
import type {
  ProviderUser,
  CreateProviderUserRequest,
  UpdateProviderUserRequest,
  ChangePasswordRequest,
  ProviderUsersFilter,
  CreateUserFormData
} from '../types/providerUser';

interface UseProviderUsersResult {
  // State
  users: ProviderUser[];
  loading: boolean;
  error: string | null;

  // Actions
  createUser: (data: CreateUserFormData) => Promise<{ success: boolean; error?: string }>;
  updateUser: (data: UpdateProviderUserRequest) => Promise<{ success: boolean; error?: string }>;
  deactivateUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  reactivateUser: (userId: string) => Promise<{ success: boolean; error?: string }>;
  changePassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  refetch: () => Promise<void>;

  // Computed
  activeUsers: ProviderUser[];
  inactiveUsers: ProviderUser[];
  filteredUsers: (filter?: ProviderUsersFilter) => ProviderUser[];
}

export function useProviderUsers(
  providerId: string | undefined,
  currentUserId: string | undefined
): UseProviderUsersResult {
  const [users, setUsers] = useState<ProviderUser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch users
  const fetchUsers = useCallback(async () => {
    if (!providerId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await getProviderUsers(providerId);

      if (fetchError) {
        const errorMessage = typeof fetchError === 'object' && fetchError !== null && 'message' in fetchError
          ? (fetchError as { message: string }).message
          : 'Errore nel caricamento degli utenti';
        setError(errorMessage);
        setUsers([]);
      } else {
        setUsers(data || []);
      }
    } catch (err) {
      console.error('Error in fetchUsers:', err);
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [providerId]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Create user
  const createUser = useCallback(async (formData: CreateUserFormData): Promise<{ success: boolean; error?: string }> => {
    if (!providerId || !currentUserId) {
      return { success: false, error: 'Provider ID o User ID mancante' };
    }

    try {
      const request: CreateProviderUserRequest = {
        p_provider_id: providerId,
        p_first_name: formData.firstName.trim(),
        p_last_name: formData.lastName.trim(),
        p_email: formData.email.trim().toLowerCase(),
        p_password: formData.password,
        p_role: formData.role,
        p_created_by: currentUserId
      };

      const result = await createProviderUser(request);

      if (result.success) {
        // Refresh the users list
        await fetchUsers();
      }

      return result;
    } catch (err) {
      console.error('Error creating user:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Errore durante la creazione'
      };
    }
  }, [providerId, currentUserId, fetchUsers]);

  // Update user
  const updateUser = useCallback(async (data: UpdateProviderUserRequest): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await updateProviderUser(data);

      if (result.success) {
        await fetchUsers();
      }

      return result;
    } catch (err) {
      console.error('Error updating user:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Errore durante l\'aggiornamento'
      };
    }
  }, [fetchUsers]);

  // Deactivate user
  const deactivateUser = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUserId) {
      return { success: false, error: 'User ID mancante' };
    }

    try {
      const result = await deactivateProviderUser(userId, currentUserId);

      if (result.success) {
        await fetchUsers();
      }

      return result;
    } catch (err) {
      console.error('Error deactivating user:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Errore durante la disattivazione'
      };
    }
  }, [currentUserId, fetchUsers]);

  // Reactivate user
  const reactivateUser = useCallback(async (userId: string): Promise<{ success: boolean; error?: string }> => {
    if (!currentUserId) {
      return { success: false, error: 'User ID mancante' };
    }

    try {
      const result = await reactivateProviderUser(userId, currentUserId);

      if (result.success) {
        await fetchUsers();
      }

      return result;
    } catch (err) {
      console.error('Error reactivating user:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Errore durante la riattivazione'
      };
    }
  }, [currentUserId, fetchUsers]);

  // Change password
  const changePassword = useCallback(async (
    userId: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUserId) {
      return { success: false, error: 'User ID mancante' };
    }

    try {
      const request: ChangePasswordRequest = {
        p_user_id: userId,
        p_new_password: newPassword,
        p_changed_by: currentUserId
      };

      const result = await changeUserPassword(request);
      return result;
    } catch (err) {
      console.error('Error changing password:', err);
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Errore durante il cambio password'
      };
    }
  }, [currentUserId]);

  // Computed: active users (con controllo null-safe)
  const activeUsers = Array.isArray(users) ? users.filter(user => user.is_active) : [];

  // Computed: inactive users (con controllo null-safe)
  const inactiveUsers = Array.isArray(users) ? users.filter(user => !user.is_active) : [];

  // Computed: filtered users
  const filteredUsers = useCallback((filter?: ProviderUsersFilter): ProviderUser[] => {
    const safeUsers = Array.isArray(users) ? users : [];
    if (!filter) return safeUsers;

    return safeUsers.filter(user => {
      // Filter by search term
      if (filter.search) {
        const searchLower = filter.search.toLowerCase();
        const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
        const matchesSearch =
          fullName.includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower);

        if (!matchesSearch) return false;
      }

      // Filter by role
      if (filter.role && user.role !== filter.role) {
        return false;
      }

      // Filter by active status
      if (filter.is_active !== undefined && user.is_active !== filter.is_active) {
        return false;
      }

      return true;
    });
  }, [users]);

  return {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    changePassword,
    refetch: fetchUsers,
    activeUsers,
    inactiveUsers,
    filteredUsers
  };
}

export default useProviderUsers;
