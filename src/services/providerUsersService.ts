/**
 * Provider Users Service
 * Gestisce le chiamate API per la gestione utenti fornitore
 */

import { supabase, rpc } from '../lib/postgrest';
import type {
  ProviderUser,
  CreateProviderUserRequest,
  CreateProviderUserResponse,
  UpdateProviderUserRequest,
  ChangePasswordRequest,
  ProviderUsersStats
} from '../types/providerUser';

/**
 * Recupera tutti gli utenti di un provider
 */
export async function getProviderUsers(providerId: string): Promise<{
  data: ProviderUser[] | null;
  error: unknown;
}> {
  try {
    // Chiamata RPC per ottenere gli utenti del provider
    // La funzione ritorna {success: true, data: [...]} o {success: false, error: "..."}
    const { data: rpcResult, error } = await rpc<{ success: boolean; data?: ProviderUser[]; error?: string }>('get_provider_users', {
      p_provider_id: providerId
    });

    if (error) {
      console.error('Error fetching provider users:', error);
      return { data: null, error };
    }

    // Estrai data dalla risposta RPC
    if (rpcResult && rpcResult.success && rpcResult.data) {
      return { data: rpcResult.data, error: null };
    } else if (rpcResult && !rpcResult.success) {
      return { data: null, error: rpcResult.error || 'Errore sconosciuto' };
    }

    return { data: [], error: null };
  } catch (error) {
    console.error('Exception fetching provider users:', error);
    return { data: null, error };
  }
}

/**
 * Crea un nuovo utente per il provider
 */
export async function createProviderUser(
  data: CreateProviderUserRequest
): Promise<CreateProviderUserResponse> {
  try {
    const { data: result, error } = await rpc<CreateProviderUserResponse>(
      'create_provider_user',
      {
        p_provider_id: data.p_provider_id,
        p_first_name: data.p_first_name,
        p_last_name: data.p_last_name,
        p_email: data.p_email,
        p_password: data.p_password,
        p_role: data.p_role || 'operator',
        p_created_by: data.p_created_by
      }
    );

    if (error) {
      console.error('Error creating provider user:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : 'Errore durante la creazione dell\'utente';
      return {
        success: false,
        error: errorMessage
      };
    }

    return result || { success: true };
  } catch (error) {
    console.error('Exception creating provider user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Aggiorna un utente del provider
 */
export async function updateProviderUser(
  data: UpdateProviderUserRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await rpc<{ success: boolean }>(
      'update_provider_user',
      data
    );

    if (error) {
      console.error('Error updating provider user:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : 'Errore durante l\'aggiornamento dell\'utente';
      return { success: false, error: errorMessage };
    }

    return result || { success: true };
  } catch (error) {
    console.error('Exception updating provider user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Disattiva un utente del provider
 */
export async function deactivateProviderUser(
  userId: string,
  deactivatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await rpc<{ success: boolean }>(
      'deactivate_provider_user',
      {
        p_user_id: userId,
        p_deactivated_by: deactivatedBy
      }
    );

    if (error) {
      console.error('Error deactivating provider user:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : 'Errore durante la disattivazione dell\'utente';
      return { success: false, error: errorMessage };
    }

    return result || { success: true };
  } catch (error) {
    console.error('Exception deactivating provider user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Riattiva un utente del provider
 */
export async function reactivateProviderUser(
  userId: string,
  reactivatedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await rpc<{ success: boolean }>(
      'reactivate_provider_user',
      {
        p_user_id: userId,
        p_reactivated_by: reactivatedBy
      }
    );

    if (error) {
      console.error('Error reactivating provider user:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : 'Errore durante la riattivazione dell\'utente';
      return { success: false, error: errorMessage };
    }

    return result || { success: true };
  } catch (error) {
    console.error('Exception reactivating provider user:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Cambia la password di un utente
 */
export async function changeUserPassword(
  data: ChangePasswordRequest
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: result, error } = await rpc<{ success: boolean }>(
      'change_provider_user_password',
      data
    );

    if (error) {
      console.error('Error changing password:', error);
      const errorMessage = typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message: string }).message
        : 'Errore durante il cambio password';
      return { success: false, error: errorMessage };
    }

    return result || { success: true };
  } catch (error) {
    console.error('Exception changing password:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

/**
 * Ottiene le statistiche degli utenti del provider
 */
export async function getProviderUsersStats(
  providerId: string
): Promise<{ data: ProviderUsersStats | null; error: unknown }> {
  try {
    const { data, error } = await rpc<ProviderUsersStats>(
      'get_provider_users_stats',
      {
        p_provider_id: providerId
      }
    );

    if (error) {
      console.error('Error fetching provider users stats:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Exception fetching provider users stats:', error);
    return { data: null, error };
  }
}

/**
 * Verifica se un'email e' gia' in uso
 */
export async function checkEmailAvailability(
  email: string
): Promise<{ available: boolean; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (error) {
      console.error('Error checking email:', error);
      return { available: false, error: 'Errore durante la verifica dell\'email' };
    }

    return { available: !data };
  } catch (error) {
    console.error('Exception checking email:', error);
    return {
      available: false,
      error: error instanceof Error ? error.message : 'Errore sconosciuto'
    };
  }
}

// Export default object for convenience
export default {
  getProviderUsers,
  createProviderUser,
  updateProviderUser,
  deactivateProviderUser,
  reactivateProviderUser,
  changeUserPassword,
  getProviderUsersStats,
  checkEmailAvailability
};
