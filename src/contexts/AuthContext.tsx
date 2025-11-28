import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';
import type { User, ClientProfile, ProviderProfile } from '../types';
import toast from 'react-hot-toast';
import { APP_CONFIG } from '../config/urls';
import {
  parseSupabaseError,
  useSupabaseError,
  SupabaseErrorClass,
  isNotFoundError
} from '../lib/errors';
import { globalCache } from '../lib/cache/cacheManager';

// Database user type
type DatabaseClientProfile = Database['public']['Tables']['client_profiles']['Row'];
type DatabaseProviderProfile = Database['public']['Tables']['provider_profiles']['Row'];

// Helper functions for ContactPerson name handling
function parseContactPersonName(name: string): { first_name: string; last_name: string } {
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: '' };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(' ')
  };
}

function formatContactPersonName(first_name: string, last_name: string): string {
  return `${first_name} ${last_name}`.trim();
}

// Helper functions to convert database types to User types
function convertDatabaseProfileToUserProfile(
  profile: DatabaseClientProfile | DatabaseProviderProfile, 
  userType: 'client' | 'provider'
): ClientProfile | ProviderProfile {
  if (userType === 'client' && 'company_name' in profile) {
    const clientProfile = profile as DatabaseClientProfile;
    return {
      company_name: clientProfile.company_name || '',
      vat_number: clientProfile.vat_number || '',
      fiscal_code: clientProfile.fiscal_code || '',
      legal_address: {
        street: clientProfile.legal_street || '',
        city: clientProfile.legal_city || '',
        province: clientProfile.legal_province || '',
        postal_code: clientProfile.legal_postal_code || '',
        region: '',
        country: clientProfile.legal_country || 'Italy'
      },
      contact_person: {
        ...parseContactPersonName(clientProfile.contact_person_name || ''),
        role: clientProfile.contact_person_role || '',
        email: clientProfile.contact_person_email || '',
        phone: clientProfile.contact_person_phone || ''
      },
      company_size: (clientProfile.company_size as 'micro' | 'small' | 'medium' | 'large') || 'micro',
      industry_sector: clientProfile.industry_sector || '',
      employees_count: clientProfile.employees_count || 1,
      phone: clientProfile.phone || '',
      website: '',
      certifications: []
    } as ClientProfile;
  } else if (userType === 'provider' && 'business_name' in profile) {
    const providerProfile = profile as DatabaseProviderProfile;
    return {
      business_name: providerProfile.business_name || '',
      vat_number: providerProfile.vat_number || '',
      fiscal_code: providerProfile.fiscal_code || '',
      address: {
        street: providerProfile.street || '',
        city: providerProfile.city || '',
        province: providerProfile.province || '',
        postal_code: providerProfile.postal_code || '',
        region: '',
        country: providerProfile.country || 'Italy'
      },
      contact_person: {
        ...parseContactPersonName(providerProfile.contact_person_name || ''),
        role: providerProfile.contact_person_role || '',
        email: providerProfile.contact_person_email || '',
        phone: providerProfile.contact_person_phone || ''
      },
      phone: providerProfile.phone || '',
      website: providerProfile.website || '',
      description: providerProfile.description || '',
      specializations: providerProfile.specializations || [],
      certifications: [],
      service_areas: providerProfile.service_areas || [],
      languages: providerProfile.languages || ['Italian'],
      experience_years: providerProfile.experience_years || 0,
      team_size: providerProfile.team_size || 1,
      availability_calendar: [],
      pricing_model: {
        default_pricing: {
          base_price: 0,
          currency: 'EUR',
          pricing_unit: 'per_hour',
          additional_costs: [],
          discounts: [],
          payment_terms: 'completion'
        },
        custom_packages: [],
        volume_discounts: []
      },
      cancellation_policy: {
        type: 'flexible',
        hours_before: 24,
        refund_percentage: 100
      },
      rating_average: providerProfile.rating_average || 0,
      reviews_count: providerProfile.reviews_count || 0,
      verified: providerProfile.verified || false,
      verification_documents: [],
      profile_image_url: providerProfile.profile_image_url || undefined
    } as ProviderProfile;
  }
  
  // Fallback
  return createEmptyProfile(userType);
}

function createEmptyProfile(userType: 'client' | 'provider'): ClientProfile | ProviderProfile {
  if (userType === 'client') {
    return {
      company_name: '',
      vat_number: '',
      fiscal_code: '',
      legal_address: {
        street: '',
        city: '',
        province: '',
        postal_code: '',
        region: '',
        country: 'Italy'
      },
      contact_person: {
        first_name: '',
        last_name: '',
        role: '',
        email: '',
        phone: ''
      },
      company_size: 'micro',
      industry_sector: '',
      employees_count: 1,
      phone: '',
      website: '',
      certifications: []
    } as ClientProfile;
  } else {
    return {
      business_name: '',
      vat_number: '',
      fiscal_code: '',
      address: {
        street: '',
        city: '',
        province: '',
        postal_code: '',
        region: '',
        country: 'Italy'
      },
      contact_person: {
        first_name: '',
        last_name: '',
        role: '',
        email: '',
        phone: ''
      },
      phone: '',
      website: '',
      description: '',
      specializations: [],
      certifications: [],
      service_areas: [],
      languages: ['Italian'],
      experience_years: 0,
      team_size: 1,
      availability_calendar: [],
      pricing_model: {
        default_pricing: {
          base_price: 0,
          currency: 'EUR',
          pricing_unit: 'per_hour',
          additional_costs: [],
          discounts: [],
          payment_terms: 'completion'
        },
        custom_packages: [],
        volume_discounts: []
      },
      cancellation_policy: {
        type: 'flexible',
        hours_before: 24,
        refund_percentage: 100
      },
      rating_average: 0,
      reviews_count: 0,
      verified: false,
      verification_documents: []
    } as ProviderProfile;
  }
}

interface SignUpData {
  email: string;
  password: string;
  userType: 'client' | 'provider';
  companyName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptTerms: boolean;
}

// CORREZIONE: Interfaccia corretta con tipi di ritorno consistenti
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (userData: SignUpData) => Promise<{ error?: { message: string } }>;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
  updateProfile: (data: ClientProfile | ProviderProfile) => Promise<{ error?: { message: string } }>;
  resetPassword: (email: string) => Promise<{ error?: { message: string } }>;
  updatePassword: (password: string) => Promise<{ error?: { message: string } }>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Storage key per sessione
const STORAGE_KEY = 'bookinghse_auth_session';

// Cache keys
const CACHE_KEYS = {
  USER_PROFILE: 'auth_user_profile',
  SESSION_DATA: 'auth_session_data',
  USER_TYPE: 'auth_user_type'
};

// Cache TTL (30 minuti)
const CACHE_TTL = 30 * 60 * 1000;

// CORREZIONE: Validazione input
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password: string): boolean {
  return password.length >= 6;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingProfileRef = useRef<string | null>(null);
  const hasInitializedRef = useRef(false);
  const mountedRef = useRef(true); // CORREZIONE: Aggiunto per prevenire memory leaks
  const sessionCheckedRef = useRef(false); // Per evitare ricontrolli non necessari
  
  // 🔍 DEBUG: Log AuthProvider state
  console.log('🔍 [AuthProvider] Current state:', {
    user: user ? { id: user.id, email: user.email, userType: user.userType } : null,
    loading,
    hasInitialized: hasInitializedRef.current,
    sessionChecked: sessionCheckedRef.current,
    timestamp: new Date().toISOString()
  });
  
  // Integrazione del sistema di gestione errori Supabase
  const { handleError, logError } = useSupabaseError();

  // CORREZIONE: Dipendenze ottimizzate per useCallback
  const loadUserProfile = useCallback(async (userId: string) => {
    // Controlla se i dati sono già in cache
    const cachedUser = globalCache.get<User>(`${CACHE_KEYS.USER_PROFILE}_${userId}`);
    if (cachedUser) {
      if (process.env.NODE_ENV === 'development') {
        console.log('📦 Using cached user profile for:', userId);
      }
      if (mountedRef.current) {
        setUser(cachedUser);
        setLoading(false);
      }
      return;
    }
    
    // CORREZIONE: Validazione input
    if (!userId || typeof userId !== 'string') {
      console.error('Invalid userId provided to loadUserProfile');
      return;
    }

    // Prevent multiple simultaneous loads for the same user
    if (loadingProfileRef.current === userId) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Already loading profile for:', userId, '- skipping');
      }
      return;
    }
    
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Loading user profile for:', userId);
      }
      loadingProfileRef.current = userId;
      
      // CORREZIONE: Check mounted state
      if (!mountedRef.current) return;
      
      // Solo se non siamo già in stato di caricamento
      if (!loading) {
        setLoading(true);
      }

      // Get the basic user data from our users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (userError && !isNotFoundError(userError)) {
        const parsedError = parseSupabaseError(userError, 'Caricamento profilo utente');
        logError(parsedError);
        throw new SupabaseErrorClass(parsedError);
      }

      // If user doesn't exist in users table, logout (should not happen with RPC signup)
      if (!userData) {
        if (process.env.NODE_ENV === 'development') {
          console.log('❌ User not found in users table, forcing logout...');
        }
        // Clear tokens and logout
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-user-id');
        localStorage.clear();
        sessionStorage.clear();
        if (mountedRef.current) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      let finalUserData = userData;
        
        // Load additional profile data based on user type
        let profileData: DatabaseClientProfile | DatabaseProviderProfile | null = null;
        if (finalUserData && finalUserData.user_type === 'client') {
          const { data: clientProfile, error: clientError } = await supabase
            .from('client_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (clientError && !isNotFoundError(clientError)) {
            const parsedError = parseSupabaseError(clientError, 'Caricamento profilo cliente');
            logError(parsedError);
            throw new SupabaseErrorClass(parsedError);
          }
          profileData = clientProfile;
        } else if (finalUserData && finalUserData.user_type === 'provider') {
          const { data: providerProfile, error: providerError } = await supabase
            .from('provider_profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
          
          if (providerError && !isNotFoundError(providerError)) {
            const parsedError = parseSupabaseError(providerError, 'Caricamento profilo fornitore');
            logError(parsedError);
            throw new SupabaseErrorClass(parsedError);
          }
          
          // If provider profile doesn't exist, create it
          if (!providerProfile && finalUserData) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Provider profile not found, creating...');
            }
            const { data: newProviderProfile, error: createProfileError } = await supabase
              .from('provider_profiles')
              .insert({
                user_id: userId,
                business_name: finalUserData.company_name || 'Azienda',
                vat_number: '',
                fiscal_code: '',
                website: '',
                description: '',
                experience_years: 0,
                team_size: 1,
                specializations: [],
                service_areas: [],
                languages: ['Italian'],
                rating_average: 0.0,
                reviews_count: 0,
                verified: false
              } satisfies Database['public']['Tables']['provider_profiles']['Insert'])
              .select()
              .single();

            if (createProfileError) {
              const parsedError = parseSupabaseError(createProfileError, 'Creazione profilo fornitore');
              logError(parsedError);
              throw new SupabaseErrorClass(parsedError);
            } else {
              if (process.env.NODE_ENV === 'development') {
                console.log('✅ Provider profile created successfully');
              }
              profileData = newProviderProfile;
            }
          } else {
            profileData = providerProfile;
          }
        }

        // Convert database user to User type
        const fullUser: User = {
          id: finalUserData.id,
          email: finalUserData.email,
          user_type: finalUserData.user_type as 'client' | 'provider',
          profile: profileData ? convertDatabaseProfileToUserProfile(profileData, finalUserData.user_type as 'client' | 'provider') : createEmptyProfile(finalUserData.user_type as 'client' | 'provider'),
          created_at: finalUserData.created_at,
          updated_at: finalUserData.updated_at
        };

        if (mountedRef.current) {
          setUser(fullUser);
          // Salva l'utente in cache
          globalCache.set(`${CACHE_KEYS.USER_PROFILE}_${userId}`, fullUser, CACHE_TTL);
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ User set successfully and cached:', fullUser.id);
          }
        }
    } catch (error) {
      handleError(error, 'Caricamento profilo utente');
      if (mountedRef.current) {
        setUser(null);
      }
    } finally {
      loadingProfileRef.current = null; // Clear loading state
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [handleError, logError]); // CORREZIONE: Dipendenze corrette

  useEffect(() => {
    let mounted = true;
    mountedRef.current = true; // CORREZIONE: Assicuriamoci che mountedRef sia true
    
    const initializeAuth = async () => {
      // Prevent multiple initializations
      if (hasInitializedRef.current) {
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Auth already initialized, skipping');
        }
        if (mounted) {
          setLoading(false); // Assicurati che loading sia false se già inizializzato
        }
        return;
      }
      
      hasInitializedRef.current = true;
      
      // Check for saved session first
      const savedSession = localStorage.getItem(STORAGE_KEY);
      let initialSessionHandled = false;
      
      if (savedSession) {
        try {
          const session = JSON.parse(savedSession);
          if (session?.user?.id && mounted) {
            if (process.env.NODE_ENV === 'development') {
              console.log('📱 Found saved session, loading profile...');
            }
            try {
              await loadUserProfile(session.user.id);
              initialSessionHandled = true;
            } catch (error) {
              console.error('❌ Error loading saved session:', error);
              localStorage.removeItem(STORAGE_KEY);
            }
          }
        } catch (error) {
          console.error('❌ Error parsing saved session:', error);
          localStorage.removeItem(STORAGE_KEY);
        }
      }
      
      // Get current session from localStorage (JWT token)
      try {
        const token = localStorage.getItem('sb-access-token');
        const userId = localStorage.getItem('sb-user-id');

        if (token && userId && mounted) {
          if (process.env.NODE_ENV === 'development') {
            console.log('🔐 Found JWT token for user:', userId);
          }

          // Only load profile if we haven't already handled the initial session
          if (!initialSessionHandled) {
            try {
              await loadUserProfile(userId);
            } catch (error) {
              console.error('❌ Error loading profile from JWT:', error);
              // Token might be invalid, clear it
              localStorage.removeItem('sb-access-token');
              localStorage.removeItem('sb-user-id');
              if (mounted) {
                setUser(null);
                setLoading(false);
              }
            }
          }
        } else if (mounted) {
          if (process.env.NODE_ENV === 'development') {
            console.log('❌ No active JWT token found');
          }
          setUser(null);
          setLoading(false);
          localStorage.removeItem(STORAGE_KEY);
        }
      } catch (error) {
        console.error('❌ Error during auth initialization:', error);
        if (mounted) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // COMMENTED OUT: onAuthStateChange listener not needed with RPC auth
    // We manage auth state manually through localStorage JWT tokens
    /*
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Not used with RPC authentication
    });
    */

    // CORREZIONE: Cleanup migliorato
    return () => {
      mounted = false;
      mountedRef.current = false;
      // No subscription to unsubscribe from with RPC auth
    };
  }, [loadUserProfile]);

  const signUp = useCallback(async (userData: SignUpData): Promise<{ error?: { message: string } }> => {
    try {
      setLoading(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🚀 Starting signup process for:', userData.email);
      }
      
      // CORREZIONE: Validazione input migliorata
      if (!userData.email || !validateEmail(userData.email)) {
        return { error: { message: 'Email non valida' } };
      }
      
      if (!userData.password || !validatePassword(userData.password)) {
        return { error: { message: 'La password deve essere di almeno 6 caratteri' } };
      }
      
      if (!userData.companyName?.trim()) {
        return { error: { message: 'Il nome dell\'azienda è obbligatorio' } };
      }
      
      // Sign up with custom RPC instead of Supabase Auth
      const { data, error: signUpError } = await supabase.rpc('signup', {
        p_email: userData.email,
        p_password: userData.password,
        p_user_type: userData.userType,
        p_first_name: userData.firstName || '',
        p_last_name: userData.lastName || '',
        p_phone: userData.phone || '',
        p_company_name: userData.companyName
      }) as { data: any; error: any };

      // Save JWT token for authenticated requests
      if (data?.access_token && !signUpError) {
        localStorage.setItem('sb-access-token', data.access_token);
        localStorage.setItem('sb-user-id', data.user.id);
      }

      if (signUpError) {
        const parsedError = parseSupabaseError(signUpError, 'Registrazione email');
        logError(parsedError);
        return { error: { message: parsedError.userMessage } };
      }

      if (!data || !data.user) {
        return { error: { message: 'Errore durante la registrazione' } };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User registered successfully:', data.user.id);
      }

      // With RPC signup, user is automatically signed in
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User automatically signed in with RPC');
      }
      await loadUserProfile(data.user.id);

      return {};
    } catch (error) {
      const parsedError = parseSupabaseError(error, 'Registrazione email');
      handleError(error, 'Registrazione email');
      return { error: { message: parsedError.userMessage } };
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile, handleError, logError]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: { message: string } }> => {
    try {
      setLoading(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 Starting signin process for:', email);
      }
      
      // CORREZIONE: Validazione input
      if (!email || !validateEmail(email)) {
        return { error: { message: 'Email non valida' } };
      }
      
      if (!password) {
        return { error: { message: 'Password obbligatoria' } };
      }
      
      // Use custom RPC login instead of Supabase Auth
      const { data, error: signInError } = await supabase.rpc('login', {
        p_email: email,
        p_password: password
      }) as { data: any; error: any };

      // Save JWT token for authenticated requests
      if (data?.access_token && !signInError) {
        localStorage.setItem('sb-access-token', data.access_token);
        localStorage.setItem('sb-user-id', data.user.id);
      }

      if (signInError) {
        const parsedError = parseSupabaseError(signInError, 'Accesso');
        logError(parsedError);
        return { error: { message: parsedError.userMessage } };
      }

      if (!data || !data.user) {
        return { error: { message: 'Errore durante l\'accesso' } };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User signed in successfully:', data.user.id);
      }

      // Load user profile manually (no auth state listener with RPC)
      await loadUserProfile(data.user.id);

      return {};
    } catch (error) {
      const parsedError = parseSupabaseError(error, 'Accesso');
      handleError(error, 'Accesso');
      return { error: { message: parsedError.userMessage } };
    } finally {
      setLoading(false);
    }
  }, [handleError, logError]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('👋 Starting signout process');
      }

      // Remove JWT token from localStorage (no API call needed for RPC auth)
      localStorage.removeItem('sb-access-token');
      localStorage.removeItem('sb-user-id');
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.clear();

      // Clear all local state
      setUser(null);

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ User signed out successfully (JWT removed)');
      }
    } catch (error) {
      handleError(error, 'Disconnessione');
      throw error;
    }
  }, [handleError]);

  // CORREZIONE: Tipo di ritorno corretto per updateProfile
  const updateProfile = useCallback(async (profileData: ClientProfile | ProviderProfile): Promise<{ error?: { message: string } }> => {
    if (!user) {
      return { error: { message: 'Utente non autenticato' } };
    }

    try {
      setLoading(true);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Updating profile for user:', user.id);
      }
      
      if (user.user_type === 'client') {
        const clientData = profileData as ClientProfile;
        
        // CORREZIONE: Validazione input
        if (!clientData.company_name?.trim()) {
          return { error: { message: 'Il nome dell\'azienda è obbligatorio' } };
        }
        
        // Update client_profiles table
        const { error: updateError } = await supabase
          .from('client_profiles')
          .upsert({
            user_id: user.id,
            company_name: clientData.company_name,
            vat_number: clientData.vat_number,
            fiscal_code: clientData.fiscal_code,
            legal_street: clientData.legal_address.street,
            legal_city: clientData.legal_address.city,
            legal_province: clientData.legal_address.province,
            legal_postal_code: clientData.legal_address.postal_code,
            legal_country: clientData.legal_address.country,
            contact_person_name: formatContactPersonName(clientData.contact_person.first_name, clientData.contact_person.last_name),
            contact_person_role: clientData.contact_person.role,
            contact_person_email: clientData.contact_person.email,
            contact_person_phone: clientData.contact_person.phone,
            company_size: clientData.company_size,
            industry_sector: clientData.industry_sector,
            employees_count: clientData.employees_count,
            phone: clientData.phone,
            updated_at: new Date().toISOString()
          });

        if (updateError) {
          const parsedError = parseSupabaseError(updateError, 'Aggiornamento profilo cliente');
          logError(parsedError);
          return { error: { message: parsedError.userMessage } };
        }
      } else if (user.user_type === 'provider') {
        const providerData = profileData as ProviderProfile;
        
        // CORREZIONE: Validazione input
        if (!providerData.business_name?.trim()) {
          return { error: { message: 'Il nome dell\'attività è obbligatorio' } };
        }
        
        // Update provider_profiles table
        const { error: updateError } = await supabase
          .from('provider_profiles')
          .upsert({
            user_id: user.id,
            business_name: providerData.business_name,
            vat_number: providerData.vat_number,
            fiscal_code: providerData.fiscal_code,
            street: providerData.address.street,
            city: providerData.address.city,
            province: providerData.address.province,
            postal_code: providerData.address.postal_code,
            country: providerData.address.country,
            contact_person_name: formatContactPersonName(providerData.contact_person.first_name, providerData.contact_person.last_name),
            contact_person_role: providerData.contact_person.role,
            contact_person_email: providerData.contact_person.email,
            contact_person_phone: providerData.contact_person.phone,
            phone: providerData.phone,
            website: providerData.website,
            description: providerData.description,
            specializations: providerData.specializations,
            service_areas: providerData.service_areas,
            languages: providerData.languages,
            experience_years: providerData.experience_years,
            team_size: providerData.team_size,
            profile_image_url: providerData.profile_image_url,
            updated_at: new Date().toISOString()
          });

        if (updateError) {
          const parsedError = parseSupabaseError(updateError, 'Aggiornamento profilo fornitore');
          logError(parsedError);
          return { error: { message: parsedError.userMessage } };
        }
      }

      // Reload user profile to get updated data
      await loadUserProfile(user.id);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Profile updated successfully');
      }
      toast.success('Profilo aggiornato con successo!');
      
      return {};
    } catch (error) {
      const parsedError = parseSupabaseError(error, 'Aggiornamento profilo');
      handleError(error, 'Aggiornamento profilo');
      return { error: { message: parsedError.userMessage } };
    } finally {
      setLoading(false);
    }
  }, [user, loadUserProfile, handleError, logError]);

  // CORREZIONE: Tipo di ritorno corretto per resetPassword
  const resetPassword = useCallback(async (email: string): Promise<{ error?: { message: string } }> => {
    try {
      // CORREZIONE: Validazione input
      if (!email || !validateEmail(email)) {
        return { error: { message: 'Email non valida' } };
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Resetting password for:', email);
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_CONFIG.APP_URL}/auth/reset-password`
      });

      if (error) {
        const parsedError = parseSupabaseError(error, 'Reset password');
        logError(parsedError);
        return { error: { message: parsedError.userMessage } };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Password reset email sent');
      }
      toast.success('Email di reset password inviata!');
      
      return {};
    } catch (error) {
      const parsedError = parseSupabaseError(error, 'Reset password');
      handleError(error, 'Reset password');
      return { error: { message: parsedError.userMessage } };
    }
  }, [handleError, logError]);

  // CORREZIONE: Tipo di ritorno corretto per updatePassword
  const updatePassword = useCallback(async (password: string): Promise<{ error?: { message: string } }> => {
    try {
      // CORREZIONE: Validazione input
      if (!password || !validatePassword(password)) {
        return { error: { message: 'La password deve essere di almeno 6 caratteri' } };
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 Updating password');
      }
      
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        const parsedError = parseSupabaseError(error, 'Aggiornamento password');
        logError(parsedError);
        return { error: { message: parsedError.userMessage } };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('✅ Password updated successfully');
      }
      toast.success('Password aggiornata con successo!');
      
      return {};
    } catch (error) {
      const parsedError = parseSupabaseError(error, 'Aggiornamento password');
      handleError(error, 'Aggiornamento password');
      return { error: { message: parsedError.userMessage } };
    }
  }, [handleError, logError]);

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}