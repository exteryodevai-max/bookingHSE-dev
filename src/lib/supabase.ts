// PostgREST client - replaces Supabase
import { postgrest, supabase as postgrestClient, setAuthToken, getAuthToken, rpc } from './postgrest';
import type { Database } from './database.types';
import {
  parseSupabaseError,
  withErrorHandling,
  withRetry,
  SupabaseErrorClass,
  RETRY_CONFIGS
} from './errors';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing API environment variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)');
}

// Export postgrest client as supabase for backwards compatibility
export const supabase = postgrestClient;
export { setAuthToken, getAuthToken, rpc };

// Database helper functions
export const db = {
  // Users and Profiles
  async createUser(userData: Database['public']['Tables']['users']['Insert']) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        const parsedError = parseSupabaseError(error, 'Creazione utente');
        throw new SupabaseErrorClass(parsedError);
      }

      return data;
    }, RETRY_CONFIGS.STANDARD);
  },

  async getUserById(id: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        const parsedError = parseSupabaseError(error, 'Recupero dati utente');
        throw new SupabaseErrorClass(parsedError);
      }

      return data;
    }, RETRY_CONFIGS.FAST);
  },

  async updateUserProfile(id: string, profileData: Database['public']['Tables']['users']['Update']) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('users')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) {
        const parsedError = parseSupabaseError(error, 'Aggiornamento profilo utente');
        throw new SupabaseErrorClass(parsedError);
      }
      return data;
    }, RETRY_CONFIGS.STANDARD);
  },

  // Services
  async createService(serviceData: Database['public']['Tables']['services']['Insert']) {
    return withRetry(async () => {
      console.log('Creating service with data:', serviceData);
      
      // Check current user authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('Current authenticated user:', user);
      console.log('Auth error:', authError);

      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from('services')
        .insert(serviceData)
        .select()
        .single();
      
      if (error) {
        console.error('Database error:', error);
        const parsedError = parseSupabaseError(error, 'Creazione servizio');
        throw new SupabaseErrorClass(parsedError);
      }

      return data;
    }, RETRY_CONFIGS.STANDARD);
  },

  async getServices(filters: {
    category?: string;
    location?: { city?: string };
    price_range?: { min?: number; max?: number };
    rating_min?: number;
    sort_by?: 'price_asc' | 'price_desc' | 'rating' | 'featured' | 'relevance';
    page?: number;
    limit?: number;
    provider_id?: string;
    search_query?: string;
    location_tokens?: string[];
    // New filter parameters for F-1
    service_type?: 'instant' | 'on_request';
    languages?: string[];
    certifications?: string[];
    availability?: 'immediate' | 'this_week' | 'this_month';
  } = {}) {
    return withRetry(async () => {
      console.log('🔍 getServices chiamata con filtri:', filters);
      
      let query = supabase
        .from('services')
        .select(`
          *,
          provider:users!services_provider_id_fkey(
            id,
            first_name,
            last_name,
            email,
            provider_profile:provider_profiles!provider_profiles_user_id_fkey(
              business_name,
              rating_average,
              reviews_count,
              verified,
              city,
              province,
              street,
              postal_code,
              country,
              languages,
              certifications
            )
          )
        `)
        .eq('active', true);

      console.log('📊 Query iniziale creata per servizi attivi');

      // Apply filters
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const orConditions: string[] = [];
      if (filters.search_query) {
        const searchTerm = filters.search_query.toLowerCase().trim();
        orConditions.push(
          `title.ilike.%${searchTerm}%`,
          `description.ilike.%${searchTerm}%`,
          `subcategory.ilike.%${searchTerm}%`
        );
      }

      if (filters.location_tokens && filters.location_tokens.length > 0) {
        filters.location_tokens.forEach(tok => {
          orConditions.push(`service_areas_lower.cs.{${tok}}`);
        });
      } else if (filters.location?.city) {
        const cityRaw = (filters.location.city || '').trim();
        const tokens = cityRaw.split(',').map(t => t.trim()).filter(Boolean);
        const variants = (s: string) => [s, s.toLowerCase(), s.toUpperCase(), s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()];
        tokens.forEach(tok => {
          variants(tok).forEach(v => {
            orConditions.push(`service_areas.cs.{${v}}`);
          });
        });
      }

      if (orConditions.length > 0) {
        query = query.or(orConditions.join(','));
      }

      if (filters.price_range) {
        query = query
          .gte('base_price', filters.price_range.min || 0)
          .lte('base_price', filters.price_range.max || 999999);
      }

      if (filters.rating_min) {
        query = query.gte('provider.provider_profiles.rating_average', filters.rating_min);
      }

      if (filters.provider_id) {
        query = query.eq('provider_id', filters.provider_id);
      }

      // Service type filter (instant vs on_request)
      if (filters.service_type) {
        query = query.eq('service_type', filters.service_type);
      }

      // Sorting
      switch (filters.sort_by) {
        case 'price_asc':
          query = query.order('base_price', { ascending: true });
          break;
        case 'price_desc':
          query = query.order('base_price', { ascending: false });
          break;
        case 'rating':
          query = query.order('provider.provider_profiles.rating_average', { ascending: false });
          break;
        case 'relevance':
          query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
          break;
        default:
          query = query.order('featured', { ascending: false }).order('created_at', { ascending: false });
      }

      // Pagination
      const page = filters.page || 1;
      const limit = filters.limit || 20;
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      // Esegui la query per i dati con paginazione
      const { data, error } = await query.range(from, to);
      
      console.log('📋 Risultati query Supabase:', { 
        data: data?.length || 0, 
        error: error?.message || 'nessun errore'
      });
      console.log('📝 Servizi trovati:', data);
      
      if (error) {
        const parsedError = parseSupabaseError(error, 'Ricerca servizi');
        throw new SupabaseErrorClass(parsedError);
      }

      
      // Transform data to match expected frontend structure
      let transformedServices = (data || []).map(service => {
        console.log('🔍 DEBUG - Service raw data:', {
          service_id: service.id,
          service_title: service.title,
          provider_data: service.provider,
          provider_profile: service.provider?.provider_profile
        });
        
        const businessName = service.provider?.provider_profile?.business_name;
        console.log('🏢 DEBUG - Business name extracted:', businessName);
        
        return {
          ...service,
          pricing: {
            base_price: service.base_price,
            pricing_unit: service.pricing_unit,
            currency: service.currency,
            additional_costs: service.additional_costs
          },
          provider: {
            id: service.provider?.id || service.provider_id,
            business_name: businessName || 'Fornitore non disponibile',
            rating_average: service.provider?.provider_profile?.rating_average || 0,
            reviews_count: service.provider?.provider_profile?.reviews_count || 0,
            verified: service.provider?.provider_profile?.verified || false,
            languages: service.provider?.provider_profile?.languages || [],
            certifications: service.provider?.provider_profile?.certifications || [],
            location: {
              city: service.provider?.provider_profile?.city || '',
              province: service.provider?.provider_profile?.province || '',
              street: service.provider?.provider_profile?.street || '',
              postal_code: service.provider?.provider_profile?.postal_code || '',
              country: service.provider?.provider_profile?.country || '',
            },
          }
        };
      });

      // Client-side filtering for languages
      if (filters.languages && filters.languages.length > 0) {
        transformedServices = transformedServices.filter(service => {
          const providerLanguages = service.provider?.languages || [];
          return filters.languages.some(lang => providerLanguages.includes(lang));
        });
      }

      // Client-side filtering for certifications
      if (filters.certifications && filters.certifications.length > 0) {
        transformedServices = transformedServices.filter(service => {
          const providerCerts = service.provider?.certifications || [];
          return filters.certifications.some(cert => providerCerts.includes(cert));
        });
      }

      // Client-side filtering for availability
      if (filters.availability) {
        transformedServices = transformedServices.filter(service => {
          if (filters.availability === 'immediate') {
            return service.service_type === 'instant';
          }
          if (filters.availability === 'this_week' || filters.availability === 'this_month') {
            return service.service_type !== 'on_request' || service.active;
          }
          return true;
        });
      }

      console.log('✅ Servizi trasformati:', transformedServices.length);
      console.log('🎯 Risultato finale:', {
        services_count: transformedServices.length,
        total_count: transformedServices.length,
        page,
        limit
      });
      
      return {
        services: transformedServices,
        total_count: transformedServices.length,
        page,
        limit
      };
    }, RETRY_CONFIGS.FAST);
  },

  async getServiceById(id: string) {
    return withRetry(async () => {
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          provider:users!services_provider_id_fkey(
            id,
            first_name,
            last_name,
            email,
            provider_profile:provider_profiles!provider_profiles_user_id_fkey(
              *
            )
          ),
          reviews:reviews(
            id,
            rating,
            title,
            comment,
            communication_rating,
            quality_rating,
            timeliness_rating,
            professionalism_rating,
            created_at,
            reviewer:users!reviews_reviewer_id_fkey(
              first_name,
              last_name,
              email
            )
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        const parsedError = parseSupabaseError(error, 'Recupero dettagli servizio');
        throw new SupabaseErrorClass(parsedError);
      }
      
      // Transform data to match expected frontend structure
      if (data) {
        return {
          ...data,
          pricing: {
            base_price: data.base_price,
            pricing_unit: data.pricing_unit,
            currency: data.currency,
            additional_costs: data.additional_costs
          },
          provider: {
            ...data.provider,
            profile: data.provider?.provider_profile || null
          }
        };
      }
      
      return data;
    }, RETRY_CONFIGS.FAST);
  },

  async updateService(id: string, serviceData: Database['public']['Tables']['services']['Update']) {
    return withRetry(async () => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from('services')
        .update({ ...serviceData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .maybeSingle();
      
      if (error) {
        const parsedError = parseSupabaseError(error, 'Aggiornamento servizio');
        throw new SupabaseErrorClass(parsedError);
      }
      return data;
    }, RETRY_CONFIGS.STANDARD);
  },

  async deleteService(id: string) {
    return withRetry(async () => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', id);
      
      if (error) {
        const parsedError = parseSupabaseError(error, 'Eliminazione servizio');
        throw new SupabaseErrorClass(parsedError);
      }
      return true;
    }, RETRY_CONFIGS.STANDARD);
  },

  // Provider operations
  async getProviders(filters: {
    verified_only?: boolean;
    location?: string;
    specializations?: string[];
    rating_min?: number;
    limit?: number;
  } = {}) {
    if (!supabase) {
      // Return mock providers
      return [
        {
          id: 'provider-1',
          user_type: 'provider',
          profile: {
            business_name: 'Studio Sicurezza Milano',
            description: 'Studio specializzato in consulenza HSE',
            experience_years: 15,
            team_size: 8,
            verified: true,
            rating_average: 4.8,
            reviews_count: 45,
            specializations: ['Valutazione Rischi', 'Formazione Sicurezza'],
            service_areas: ['Milano', 'Lombardia'],
            address: {
              city: 'Milano',
              province: 'MI',
              coordinates: { lat: 45.4642, lng: 9.1900 }
            }
          }
        }
      ];
    }

    let query = supabase
      .from('provider_profiles')
      .select(`
        *,
        user:users!provider_profiles_user_id_fkey(
          id,
          first_name,
          last_name,
          email,
          user_type
        )
      `);

    if (filters.verified_only) {
      query = query.eq('verified', true);
    }

    if (filters.location) {
      query = query.contains('service_areas', [filters.location]);
    }

    if (filters.specializations && filters.specializations.length > 0) {
      query = query.overlaps('specializations', filters.specializations);
    }

    if (filters.rating_min) {
      query = query.gte('rating_average', filters.rating_min);
    }

    if (filters.limit) {
      query = query.limit(filters.limit);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    return data || [];
  },

  // Bookings
  async createBooking(bookingData: Database['public']['Tables']['bookings']['Insert']) {
    if (!supabase) {
      // Return mock booking
      return {
        id: 'booking-' + Date.now(),
        service_id: bookingData.service_id,
        client_id: bookingData.client_id,
        provider_id: bookingData.provider_id,
        status: 'pending',
        booking_date: bookingData.booking_date,
        start_time: bookingData.start_time,
        end_time: bookingData.end_time,
        duration_hours: bookingData.duration_hours,
        location_type: bookingData.location_type,
        participants_count: bookingData.participants_count || 1,
        base_amount: bookingData.base_amount,
        total_amount: bookingData.total_amount,
        currency: bookingData.currency || 'EUR',
        payment_status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert(bookingData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getBookings(userId: string, userType: 'client' | 'provider') {
    if (!supabase) {
      // Return mock bookings
      return [
        {
          id: 'booking-1',
          service_title: 'Documento di Valutazione dei Rischi (DVR)',
          booking_number: 'BH' + Date.now(),
          status: 'confirmed',
          requested_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          requested_time: '09:00',
          participants_count: 1,
          total_amount: 800,
          payment_status: 'pending',
          service: {
            id: 'mock-1',
            title: 'Documento di Valutazione dei Rischi (DVR)',
            category: 'workplace_safety'
          },
          client: {
            id: 'client-1',
            client_profiles: {
              company_name: 'Azienda Test S.r.l.',
              first_name: 'Mario',
              last_name: 'Rossi'
            }
          },
          provider: {
            id: 'provider-1',
            provider_profiles: {
              business_name: 'Studio Sicurezza Milano',
              first_name: 'Giuseppe',
              last_name: 'Verdi'
            }
          }
        }
      ];
    }

    const column = userType === 'client' ? 'client_id' : 'provider_id';
    
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(
          id,
          title,
          category
        ),
        client:users!bookings_client_id_fkey(
          id,
          first_name,
          last_name,
          client_profiles(
            company_name
          )
        ),
        provider:users!bookings_provider_id_fkey(
          id,
          first_name,
          last_name,
          provider_profiles(
            business_name
          )
        )
      `)
      .eq(column, userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getBookingById(id: string) {
    if (!supabase) {
      // Return mock booking detail
      return {
        id: 'booking-1',
        service_title: 'Documento di Valutazione dei Rischi (DVR)',
        booking_number: 'BH' + Date.now(),
        status: 'confirmed',
        requested_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        requested_time: '09:00',
        participants_count: 1,
        base_amount: 800,
        tax_amount: 176,
        total_amount: 976,
        payment_status: 'pending',
        client_notes: 'Richiesta urgente per conformità normativa',
        participants: [
          {
            first_name: 'Mario',
            last_name: 'Rossi',
            email: 'mario.rossi@azienda.it',
            role: 'Responsabile HSE'
          }
        ],
        documents: [],
        location: {
          type: 'client_site',
          address: {
            street: 'Via Roma 123',
            city: 'Rho',
            province: 'MI'
          }
        },
        service: {
          id: 'mock-1',
          title: 'Documento di Valutazione dei Rischi (DVR)',
          category: 'workplace_safety'
        },
        client: {
          id: 'client-1',
          email: 'mario.rossi@azienda.it',
          first_name: 'Mario',
          last_name: 'Rossi',
          client_profiles: {
            company_name: 'Azienda Test S.r.l.',
            vat_number: 'IT12345678901',
            fiscal_code: 'RSSMRA80A01H501Z'
          }
        },
        provider: {
          id: 'provider-1',
          email: 'info@studiosicurezzamilano.it',
          first_name: 'Giuseppe',
          last_name: 'Verdi',
          provider_profiles: {
            business_name: 'Studio Sicurezza Milano',
            vat_number: 'IT98765432109',
            fiscal_code: 'VRDGPP75B15F205X'
          }
        }
      };
    }

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        service:services(*),
        client:users!bookings_client_id_fkey(
          id, 
          email, 
          first_name, 
          last_name,
          client_profiles(
            company_name,
            vat_number,
            fiscal_code
          )
        ),
        provider:users!bookings_provider_id_fkey(
          id, 
          email, 
          first_name, 
          last_name,
          provider_profiles(
            business_name,
            vat_number,
            fiscal_code
          )
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateBookingStatus(id: string, status: string, additionalData: Database['public']['Tables']['bookings']['Update'] = {}) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const updateData = {
      status,
      updated_at: new Date().toISOString(),
      ...additionalData
    };

    if (status === 'confirmed') {
      updateData.confirmed_at = new Date().toISOString();
    } else if (status === 'completed') {
      updateData.completed_at = new Date().toISOString();
    } else if (status === 'cancelled') {
      updateData.cancelled_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Reviews
  async createReview(reviewData: Database['public']['Tables']['reviews']['Insert']) {
    if (!supabase) {
      // Return mock review
      return {
        id: 'review-' + Date.now(),
        ...reviewData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    }

    const { data, error } = await supabase
      .from('reviews')
      .insert(reviewData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getReviewsByService(serviceId: string) {
    if (!supabase) {
      // Return mock reviews
      return [
        {
          id: 'review-1',
          rating: 5,
          title: 'Servizio eccellente',
          comment: 'Professionali e competenti, DVR redatto in tempi rapidi e con grande precisione.',
          created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          reviewer: {
            first_name: 'Mario',
            last_name: 'Rossi',
            company_name: 'Azienda Cliente S.r.l.'
          }
        }
      ];
    }

    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        reviewer:users!reviews_reviewer_id_fkey(
          first_name,
          last_name,
          email,
          client_profiles!client_profiles_user_id_fkey(
            company_name
          )
        )
      `)
      .eq('service_id', serviceId)
      .eq('verified', true)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  // Notifications
  async createNotification(notificationData: Database['public']['Tables']['notifications']['Insert']) {
    if (!supabase) {
      console.warn('Cannot create notification - Supabase not configured');
      return null;
    }

    const { data, error } = await supabase
      .from('notifications')
      .insert(notificationData)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  async getUserNotifications(userId: string) {
    if (!supabase) {
      // Return mock notifications
      return [
        {
          id: 'notif-1',
          type: 'booking',
          title: 'Nuova prenotazione confermata',
          message: 'La tua prenotazione per DVR è stata confermata',
          read: false,
          created_at: new Date().toISOString()
        }
      ];
    }

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);
    
    if (error) throw error;
    return data || [];
  },

  async markNotificationAsRead(id: string) {
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .select()
      .maybeSingle();
    
    if (error) throw error;
    return data;
  },

  // Analytics
  async getBookingAnalytics(providerId?: string) {
    if (!supabase) {
      // Return mock analytics
      return {
        total_bookings: 25,
        confirmed_bookings: 20,
        completion_rate: 95,
        cancellation_rate: 5,
        average_booking_value: 650
      };
    }

    let query = supabase
      .from('bookings')
      .select('*');

    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    const { data, error } = await query;
    
    if (error) throw error;
    
    // Process analytics data
    const totalBookings = data?.length || 0;
    const confirmedBookings = data?.filter(b => b.status === 'confirmed').length || 0;
    const completedBookings = data?.filter(b => b.status === 'completed').length || 0;
    const cancelledBookings = data?.filter(b => b.status === 'cancelled').length || 0;
    
    return {
      total_bookings: totalBookings,
      confirmed_bookings: confirmedBookings,
      completion_rate: totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0,
      cancellation_rate: totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0,
      average_booking_value: data?.reduce((sum, b) => sum + (b.total_amount || 0), 0) / totalBookings || 0
    };
  },

  // User profile operations
  async updateClientProfile(userId: string, profileData: Partial<Database['public']['Tables']['client_profiles']['Update']>) {
    return withRetry(async () => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from('client_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .maybeSingle();
      
      if (error) {
        const parsedError = parseSupabaseError(error, 'Aggiornamento profilo cliente');
        throw new SupabaseErrorClass(parsedError);
      }
      return data;
    }, RETRY_CONFIGS.STANDARD);
  },

  async updateProviderProfile(userId: string, profileData: Partial<Database['public']['Tables']['provider_profiles']['Update']>) {
    return withRetry(async () => {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      const { data, error } = await supabase
        .from('provider_profiles')
        .update({
          ...profileData,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .select()
        .maybeSingle();
      
      if (error) {
        const parsedError = parseSupabaseError(error, 'Aggiornamento profilo fornitore');
        throw new SupabaseErrorClass(parsedError);
      }
      return data;
    }, RETRY_CONFIGS.STANDARD);
  }
};