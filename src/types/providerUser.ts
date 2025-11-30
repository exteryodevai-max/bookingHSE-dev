/**
 * Types for Provider User Management
 * Gestione utenti associati a un provider
 */

// Utente provider - rappresenta un utente associato a un'azienda fornitrice
export interface ProviderUser {
  id: string;
  user_id: string;
  provider_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: ProviderUserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  last_login?: string;
}

// Ruoli disponibili per gli utenti provider
export type ProviderUserRole = 'admin' | 'manager' | 'operator';

// Request per creare un nuovo utente provider
export interface CreateProviderUserRequest {
  p_provider_id: string;
  p_first_name: string;
  p_last_name: string;
  p_email: string;
  p_password: string;
  p_role?: ProviderUserRole;
  p_created_by: string;
}

// Response dalla creazione utente
export interface CreateProviderUserResponse {
  success: boolean;
  user_id?: string;
  message?: string;
  error?: string;
}

// Request per aggiornare un utente provider
export interface UpdateProviderUserRequest {
  p_user_id: string;
  p_first_name?: string;
  p_last_name?: string;
  p_email?: string;
  p_role?: ProviderUserRole;
  p_is_active?: boolean;
}

// Request per cambiare password utente
export interface ChangePasswordRequest {
  p_user_id: string;
  p_new_password: string;
  p_changed_by: string;
}

// Filtri per la lista utenti
export interface ProviderUsersFilter {
  search?: string;
  role?: ProviderUserRole;
  is_active?: boolean;
}

// Form data per creazione utente (frontend)
export interface CreateUserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: ProviderUserRole;
}

// Statistiche utenti provider
export interface ProviderUsersStats {
  total: number;
  active: number;
  inactive: number;
  byRole: {
    admin: number;
    manager: number;
    operator: number;
  };
}

// Labels per i ruoli (in italiano)
export const ROLE_LABELS: Record<ProviderUserRole, string> = {
  admin: 'Amministratore',
  manager: 'Manager',
  operator: 'Operatore'
};

// Descrizioni per i ruoli (in italiano)
export const ROLE_DESCRIPTIONS: Record<ProviderUserRole, string> = {
  admin: 'Accesso completo a tutte le funzionalita',
  manager: 'Gestione prenotazioni e servizi',
  operator: 'Visualizzazione e gestione prenotazioni assegnate'
};
