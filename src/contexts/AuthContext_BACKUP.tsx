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

// Database user type
type DatabaseClientProfile = Database['public']['Tables']['client_profiles']['Row'];
type DatabaseProviderProfile = Database['public']['Tables']['provider_profiles']['Row'];

// Helper functions for ContactPerson name handling
// Funzione spostata in AuthContext.tsx principale

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
        first_name: clientProfile.contact_person_name?.split(' ')[0] || '',
        last_name: clientProfile.contact_person_name?.split(' ').slice(1).join(' ') || '',
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
        first_name: providerProfile.contact_person_name?.split(' ')[0] || '',
        last_name: providerProfile.contact_person_name?.split(' ').slice(1).join(' ') || '',
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
        type: 'hourly',
        base_rate: 0,
        currency: 'EUR'
      },
      cancellation_policy: {
        type: 'flexible',
        hours_before: 24,
        refund_percentage: 100
      },
      rating_average: providerProfile.rating_average || 0,
      reviews_count: providerProfile.reviews_count || 0,
      verified: providerProfile.verified || false,
      verification_documents: []
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
        type: 'hourly',
        base_rate: 0,
        currency: 'EUR'
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

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (userData: SignUpData) => Promise<{ error?: { message: string } }>;
  signIn: (email: string, password: string) => Promise<{ error?: { message: string } }>;
  signOut: () => Promise<void>;
  updateProfile: (data: ClientProfile | ProviderProfile) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const loadingProfileRef = useRef<string | null>(null); // Track which user profile is being loaded
  const hasInitializedRef = useRef(false); // Track if we've initialized
  
  // Integrazione del sistema di gestione errori Supabase
  const { handleError, logError } = useSupabaseError();

  const loadUserProfile = useCallback(async (userId: string) => {
    // Prevent multiple simultaneous loads for the same user
    if (loadingProfileRef.current === userId) {
      console.log('🔄 Already loading profile for:', userId, '- skipping');
      return;
    }
    
    try {
      console.log('🔍 Loading user profile for:', userId);
      loadingProfileRef.current = userId;
      setLoading(true);
      
      // First check if the auth user still exists
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser || authUser.id !== userId) {
        console.log('❌ Auth user not found or ID mismatch, forcing logout...');
        // Force logout if auth user doesn't exist or ID doesn't match
        await supabase.auth.signOut();
        setUser(null);
        setLoading(false);
        localStorage.clear();
        sessionStorage.clear();
        return;
      }
      
      // Now get the basic user data from our users table
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

      // If user doesn't exist in users table, create it from auth data
      if (!userData) {
        console.log('User not found in users table, creating from auth data...');

        // Extract user data from auth metadata
        const userType = authUser.user_metadata?.user_type || 'client';
        const companyName = authUser.user_metadata?.company_name || '';
        const firstName = authUser.user_metadata?.first_name || '';
        const lastName = authUser.user_metadata?.last_name || '';
        const phone = authUser.user_metadata?.phone || '';
        
        console.log('Creating missing user record with metadata:', {
          email: authUser.email,
          userType,
          companyName
        });
        
        // Try to insert the user record, but handle conflicts gracefully
        const { data: newUserData, error: createUserError } = await supabase
          .from('users')
          .insert({
            id: authUser.id,
            email: authUser.email!,
            user_type: userType as 'client' | 'provider',
            company_name: companyName,
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        let finalUserData;
        
        if (createUserError) {
          // If it's a duplicate key error (23505), try to fetch the existing user
          if (createUserError.code === '23505') {
            console.log('User already exists, fetching existing record...');
            const { data: existingUser, error: fetchError } = await supabase
              .from('users')
              .select('*')
              .eq('id', authUser.id)
              .single();
            
            if (fetchError) {
              const parsedError = parseSupabaseError(fetchError, 'Caricamento utente esistente');
              logError(parsedError);
              throw new SupabaseErrorClass(parsedError);
            }
            
            // Use the existing user data
            finalUserData = existingUser;
            console.log('✅ Using existing user record');
          } else {
            // For other errors, throw as before
            const parsedError = parseSupabaseError(createUserError, 'Creazione profilo utente');
            logError(parsedError);
            throw new SupabaseErrorClass(parsedError);
          }
        } else {
          // Use the newly created user data
          finalUserData = newUserData;
          console.log('✅ User record created successfully');
        }
        
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
            console.log('Provider profile not found, creating...');
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
                completed_bookings: 0,
                verified: false,
                featured: false,
                active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } satisfies Database['public']['Tables']['provider_profiles']['Insert'])
              .select()
              .single();

            if (createProfileError) {
              const parsedError = parseSupabaseError(createProfileError, 'Creazione profilo fornitore');
              logError(parsedError);
              throw new SupabaseErrorClass(parsedError);
            } else {
              console.log('✅ Provider profile created successfully');
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

        setUser(fullUser);
      } else {
        // Load additional profile data based on user type
        let profileData: DatabaseClientProfile | DatabaseProviderProfile | null = null;
        if (userData.user_type === 'client') {
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
        } else if (userData.user_type === 'provider') {
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
          if (!providerProfile) {
            console.log('Provider profile not found, creating...');
            const { data: newProviderProfile, error: createProfileError } = await supabase
              .from('provider_profiles')
              .insert({
                user_id: userId,
                business_name: userData.company_name || 'Azienda',
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
                completed_bookings: 0,
                verified: false,
                featured: false,
                active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
              } satisfies Database['public']['Tables']['provider_profiles']['Insert'])
               .select()
               .single();

            if (createProfileError) {
              const parsedError = parseSupabaseError(createProfileError, 'Creazione profilo fornitore');
              logError(parsedError);
              throw new SupabaseErrorClass(parsedError);
            } else {
              console.log('✅ Provider profile created successfully');
              profileData = newProviderProfile;
            }
          } else {
            profileData = providerProfile;
          }
        }

        // Convert database user to User type
         const fullUser: User = {
           id: userData.id,
           email: userData.email,
           user_type: userData.user_type as 'client' | 'provider',
           profile: profileData ? convertDatabaseProfileToUserProfile(profileData, userData.user_type as 'client' | 'provider') : createEmptyProfile(userData.user_type as 'client' | 'provider'),
           created_at: userData.created_at,
           updated_at: userData.updated_at
         };

         setUser(fullUser);
       }
    } catch (error) {
      handleError(error, 'Caricamento profilo utente');
      setUser(null);
    } finally {
      loadingProfileRef.current = null; // Clear loading state
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initializeAuth = async () => {
      // Prevent multiple initializations
      if (hasInitializedRef.current) {
        console.log('🔄 Auth already initialized, skipping');
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
            console.log('📱 Found saved session, loading profile...');
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
      
      // Get current session from Supabase
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error getting session:', error);
          if (mounted) {
            setLoading(false);
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('🔐 Found Supabase session for user:', session.user.id);
          
          // Only load profile if we haven't already handled the initial session
          if (!initialSessionHandled) {
            await loadUserProfile(session.user.id);
          }
          
          // Save session to localStorage
          localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
        } else if (mounted) {
          console.log('❌ No active session found');
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      
      console.log('🔄 Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('✅ User signed in:', session.user.id);
        await loadUserProfile(session.user.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      } else if (event === 'SIGNED_OUT') {
        console.log('👋 User signed out');
        setUser(null);
        setLoading(false);
        localStorage.removeItem(STORAGE_KEY);
        sessionStorage.clear();
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('🔄 Token refreshed for user:', session.user.id);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserProfile]);

  const signUp = useCallback(async (userData: SignUpData): Promise<{ error?: { message: string } }> => {
    try {
      setLoading(true);
      
      console.log('🚀 Starting signup process for:', userData.email);
      
      // Validate required fields
      if (!userData.email || !userData.password || !userData.companyName) {
        return { error: { message: 'Tutti i campi obbligatori devono essere compilati' } };
      }
      
      // Sign up with Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            user_type: userData.userType,
            company_name: userData.companyName,
            first_name: userData.firstName || '',
            last_name: userData.lastName || '',
            phone: userData.phone || ''
          },
          emailRedirectTo: `${APP_CONFIG.APP_URL}/auth/callback`
        }
      });

      if (signUpError) {
        const parsedError = parseSupabaseError(signUpError, 'Registrazione');
        logError(parsedError);
        return { error: { message: parsedError.userMessage } };
      }

      if (!data.user) {
        return { error: { message: 'Errore durante la registrazione' } };
      }

      console.log('✅ User registered successfully:', data.user.id);
      
      // If email confirmation is disabled, the user will be automatically signed in
      if (data.session) {
        console.log('✅ User automatically signed in');
        await loadUserProfile(data.user.id);
      } else {
        console.log('📧 Email confirmation required');
        toast.success('Registrazione completata! Controlla la tua email per confermare l\'account.');
      }

      return {};
    } catch (error) {
      const parsedError = parseSupabaseError(error, 'Registrazione');
      handleError(error, 'Registrazione');
      return { error: { message: parsedError.userMessage } };
    } finally {
      setLoading(false);
    }
  }, [loadUserProfile, handleError, logError]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error?: { message: string } }> => {
    try {
      setLoading(true);
      
      console.log('🔐 Starting signin process for:', email);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) {
        const parsedError = parseSupabaseError(signInError, 'Accesso');
        logError(parsedError);
        return { error: { message: parsedError.userMessage } };
      }

      if (!data.user) {
        return { error: { message: 'Errore durante l\'accesso' } };
      }

      console.log('✅ User signed in successfully:', data.user.id);
      
      // The auth state change listener will handle loading the profile
      // await loadUserProfile(data.user.id); // This will be handled by the listener
      
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
      console.log('👋 Starting signout process');
      
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        const parsedError = parseSupabaseError(error, 'Disconnessione');
        logError(parsedError);
        throw new SupabaseErrorClass(parsedError);
      }
      
      // Clear all local state
      setUser(null);
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.clear();
      
      console.log('✅ User signed out successfully');
    } catch (error) {
      handleError(error, 'Disconnessione');
      throw error;
    }
  }, [handleError, logError]);

  const updateProfile = useCallback(async (profileData: ClientProfile | ProviderProfile): Promise<void> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      setLoading(true);
      
      console.log('📝 Updating profile for user:', user.id);
      
      if (user.user_type === 'client') {
        const clientData = profileData as ClientProfile;
        
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
          throw new SupabaseErrorClass(parsedError);
        }
      } else if (user.user_type === 'provider') {
        const providerData = profileData as ProviderProfile;
        
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
            updated_at: new Date().toISOString()
          });

        if (updateError) {
          const parsedError = parseSupabaseError(updateError, 'Aggiornamento profilo fornitore');
          logError(parsedError);
          throw new SupabaseErrorClass(parsedError);
        }
      }

      // Reload user profile to get updated data
      await loadUserProfile(user.id);
      
      console.log('✅ Profile updated successfully');
      toast.success('Profilo aggiornato con successo!');
    } catch (error) {
      handleError(error, 'Aggiornamento profilo');
      throw error;
    } finally {
      setLoading(false);
    }
  }, [user, loadUserProfile, handleError, logError]);

  const resetPassword = useCallback(async (email: string): Promise<void> => {
    try {
      console.log('🔄 Resetting password for:', email);
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${APP_CONFIG.APP_URL}/auth/reset-password`
      });

      if (error) {
        const parsedError = parseSupabaseError(error, 'Reset password');
        logError(parsedError);
        throw new SupabaseErrorClass(parsedError);
      }

      console.log('✅ Password reset email sent');
      toast.success('Email di reset password inviata!');
    } catch (error) {
      handleError(error, 'Reset password');
      throw error;
    }
  }, [handleError, logError]);

  const updatePassword = useCallback(async (password: string): Promise<void> => {
    try {
      console.log('🔄 Updating password');
      
      const { error } = await supabase.auth.updateUser({
        password
      });

      if (error) {
        const parsedError = parseSupabaseError(error, 'Aggiornamento password');
        logError(parsedError);
        throw new SupabaseErrorClass(parsedError);
      }

      console.log('✅ Password updated successfully');
      toast.success('Password aggiornata con successo!');
    } catch (error) {
      handleError(error, 'Aggiornamento password');
      throw error;
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