export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      availability_slots: {
        Row: {
          available: boolean | null
          created_at: string | null
          day_of_week: number
          end_time: string
          id: string
          provider_id: string
          start_time: string
          updated_at: string | null
        }
        Insert: {
          available?: boolean | null
          created_at?: string | null
          day_of_week: number
          end_time: string
          id?: string
          provider_id: string
          start_time: string
          updated_at?: string | null
        }
        Update: {
          available?: boolean | null
          created_at?: string | null
          day_of_week?: number
          end_time?: string
          id?: string
          provider_id?: string
          start_time?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      client_profiles: {
        Row: {
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_province: string | null
          billing_street: string | null
          company_name: string
          company_size: Database["public"]["Enums"]["company_size"] | null
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          contact_person_role: string | null
          created_at: string | null
          employees_count: number | null
          fiscal_code: string | null
          id: string
          industry_sector: string | null
          legal_city: string | null
          legal_country: string | null
          legal_postal_code: string | null
          legal_province: string | null
          legal_street: string | null
          phone: string | null
          updated_at: string | null
          user_id: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_province?: string | null
          billing_street?: string | null
          company_name: string
          company_size?: Database["public"]["Enums"]["company_size"] | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contact_person_role?: string | null
          created_at?: string | null
          employees_count?: number | null
          fiscal_code?: string | null
          id?: string
          industry_sector?: string | null
          legal_city?: string | null
          legal_country?: string | null
          legal_postal_code?: string | null
          legal_province?: string | null
          legal_street?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_province?: string | null
          billing_street?: string | null
          company_name?: string
          company_size?: Database["public"]["Enums"]["company_size"] | null
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contact_person_role?: string | null
          created_at?: string | null
          employees_count?: number | null
          fiscal_code?: string | null
          id?: string
          industry_sector?: string | null
          legal_city?: string | null
          legal_country?: string | null
          legal_postal_code?: string | null
          legal_province?: string | null
          legal_street?: string | null
          phone?: string | null
          updated_at?: string | null
          user_id?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_profiles: {
        Row: {
          active: boolean
          advance_notice_hours: number | null
          auto_accept_bookings: boolean | null
          business_name: string
          cancellation_policy: string | null
          city: string | null
          completed_bookings: number
          contact_person_email: string | null
          contact_person_name: string | null
          contact_person_phone: string | null
          contact_person_role: string | null
          country: string | null
          created_at: string | null
          description: string | null
          experience_years: number | null
          featured: boolean
          fiscal_code: string | null
          id: string
          languages: string[] | null
          latitude: number | null
          longitude: number | null
          phone: string | null
          postal_code: string | null
          professional_order: string | null
          province: string | null
          rating_average: number | null
          registration_number: string | null
          reviews_count: number | null
          service_areas: string[] | null
          specializations: string[] | null
          street: string | null
          team_size: number | null
          updated_at: string | null
          user_id: string
          vat_number: string | null
          verification_date: string | null
          verified: boolean | null
          website: string | null
        }
        Insert: {
          active?: boolean
          advance_notice_hours?: number | null
          auto_accept_bookings?: boolean | null
          business_name: string
          cancellation_policy?: string | null
          city?: string | null
          completed_bookings?: number
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contact_person_role?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          experience_years?: number | null
          featured?: boolean
          fiscal_code?: string | null
          id?: string
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          professional_order?: string | null
          province?: string | null
          rating_average?: number | null
          registration_number?: string | null
          reviews_count?: number | null
          service_areas?: string[] | null
          specializations?: string[] | null
          street?: string | null
          team_size?: number | null
          updated_at?: string | null
          user_id: string
          vat_number?: string | null
          verification_date?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Update: {
          active?: boolean
          advance_notice_hours?: number | null
          auto_accept_bookings?: boolean | null
          business_name?: string
          cancellation_policy?: string | null
          city?: string | null
          completed_bookings?: number
          contact_person_email?: string | null
          contact_person_name?: string | null
          contact_person_phone?: string | null
          contact_person_role?: string | null
          country?: string | null
          created_at?: string | null
          description?: string | null
          experience_years?: number | null
          featured?: boolean
          fiscal_code?: string | null
          id?: string
          languages?: string[] | null
          latitude?: number | null
          longitude?: number | null
          phone?: string | null
          postal_code?: string | null
          professional_order?: string | null
          province?: string | null
          rating_average?: number | null
          registration_number?: string | null
          reviews_count?: number | null
          service_areas?: string[] | null
          specializations?: string[] | null
          street?: string | null
          team_size?: number | null
          updated_at?: string | null
          user_id?: string
          vat_number?: string | null
          verification_date?: string | null
          verified?: boolean | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "provider_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          company_name: string | null
          created_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          updated_at: string | null
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          company_name?: string | null
          created_at?: string | null
          email: string
          first_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          company_name?: string | null
          created_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          updated_at?: string | null
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          id: string
          provider_id: string
          title: string
          description: string | null
          category: Database["public"]["Enums"]["service_category"]
          subcategory: string | null
          service_type: Database["public"]["Enums"]["service_type"]
          location_type: Database["public"]["Enums"]["location_type"]
          base_price: number
          pricing_unit: Database["public"]["Enums"]["pricing_unit"]
          currency: string | null
          duration_hours: number | null
          max_participants: number | null
          min_participants: number | null
          service_areas: string[] | null
          requirements: string[] | null
          deliverables: string[] | null
          tags: string[] | null
          images: string[] | null
          documents: string[] | null
          active: boolean | null
          featured: boolean | null
          slug: string | null
          meta_description: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          provider_id: string
          title: string
          description?: string | null
          category: Database["public"]["Enums"]["service_category"]
          subcategory?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          location_type?: Database["public"]["Enums"]["location_type"]
          base_price: number
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"]
          currency?: string | null
          duration_hours?: number | null
          max_participants?: number | null
          min_participants?: number | null
          service_areas?: string[] | null
          requirements?: string[] | null
          deliverables?: string[] | null
          tags?: string[] | null
          images?: string[] | null
          documents?: string[] | null
          active?: boolean | null
          featured?: boolean | null
          slug?: string | null
          meta_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          provider_id?: string
          title?: string
          description?: string | null
          category?: Database["public"]["Enums"]["service_category"]
          subcategory?: string | null
          service_type?: Database["public"]["Enums"]["service_type"]
          location_type?: Database["public"]["Enums"]["location_type"]
          base_price?: number
          pricing_unit?: Database["public"]["Enums"]["pricing_unit"]
          currency?: string | null
          duration_hours?: number | null
          max_participants?: number | null
          min_participants?: number | null
          service_areas?: string[] | null
          requirements?: string[] | null
          deliverables?: string[] | null
          tags?: string[] | null
          images?: string[] | null
          documents?: string[] | null
          active?: boolean | null
          featured?: boolean | null
          slug?: string | null
          meta_description?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      bookings: {
        Row: {
          id: string
          service_id: string
          client_id: string
          provider_id: string
          status: Database["public"]["Enums"]["booking_status"]
          booking_date: string
          start_time: string | null
          end_time: string | null
          duration_hours: number | null
          location_type: Database["public"]["Enums"]["location_type"]
          location_street: string | null
          location_city: string | null
          location_province: string | null
          location_postal_code: string | null
          location_country: string | null
          meeting_details: string | null
          access_instructions: string | null
          participants_count: number
          base_amount: number
          additional_costs: Json | null
          discount_amount: number | null
          tax_amount: number | null
          total_amount: number
          currency: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          payment_method: string | null
          payment_due_date: string | null
          advance_payment_amount: number | null
          advance_payment_status: Database["public"]["Enums"]["payment_status"] | null
          client_notes: string | null
          provider_notes: string | null
          internal_notes: string | null
          special_requirements: string[] | null
          check_in_time: string | null
          check_out_time: string | null
          completion_notes: string | null
          created_at: string | null
          updated_at: string | null
          confirmed_at: string | null
          completed_at: string | null
          cancelled_at: string | null
        }
        Insert: {
          id?: string
          service_id: string
          client_id: string
          provider_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          booking_date: string
          start_time?: string | null
          end_time?: string | null
          duration_hours?: number | null
          location_type: Database["public"]["Enums"]["location_type"]
          location_street?: string | null
          location_city?: string | null
          location_province?: string | null
          location_postal_code?: string | null
          location_country?: string | null
          meeting_details?: string | null
          access_instructions?: string | null
          participants_count?: number
          base_amount: number
          additional_costs?: Json | null
          discount_amount?: number | null
          tax_amount?: number | null
          total_amount: number
          currency?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_method?: string | null
          payment_due_date?: string | null
          advance_payment_amount?: number | null
          advance_payment_status?: Database["public"]["Enums"]["payment_status"] | null
          client_notes?: string | null
          provider_notes?: string | null
          internal_notes?: string | null
          special_requirements?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          completion_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
        Update: {
          id?: string
          service_id?: string
          client_id?: string
          provider_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          booking_date?: string
          start_time?: string | null
          end_time?: string | null
          duration_hours?: number | null
          location_type?: Database["public"]["Enums"]["location_type"]
          location_street?: string | null
          location_city?: string | null
          location_province?: string | null
          location_postal_code?: string | null
          location_country?: string | null
          meeting_details?: string | null
          access_instructions?: string | null
          participants_count?: number
          base_amount?: number
          additional_costs?: Json | null
          discount_amount?: number | null
          tax_amount?: number | null
          total_amount?: number
          currency?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          payment_method?: string | null
          payment_due_date?: string | null
          advance_payment_amount?: number | null
          advance_payment_status?: Database["public"]["Enums"]["payment_status"] | null
          client_notes?: string | null
          provider_notes?: string | null
          internal_notes?: string | null
          special_requirements?: string[] | null
          check_in_time?: string | null
          check_out_time?: string | null
          completion_notes?: string | null
          created_at?: string | null
          updated_at?: string | null
          confirmed_at?: string | null
          completed_at?: string | null
          cancelled_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookings_provider_id_fkey"
            columns: ["provider_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          reviewer_id: string
          reviewed_id: string
          service_id: string
          rating: number
          title: string | null
          comment: string | null
          communication_rating: number | null
          quality_rating: number | null
          timeliness_rating: number | null
          professionalism_rating: number | null
          helpful_count: number | null
          verified: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          booking_id: string
          reviewer_id: string
          reviewed_id: string
          service_id: string
          rating: number
          title?: string | null
          comment?: string | null
          communication_rating?: number | null
          quality_rating?: number | null
          timeliness_rating?: number | null
          professionalism_rating?: number | null
          helpful_count?: number | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          booking_id?: string
          reviewer_id?: string
          reviewed_id?: string
          service_id?: string
          rating?: number
          title?: string | null
          comment?: string | null
          communication_rating?: number | null
          quality_rating?: number | null
          timeliness_rating?: number | null
          professionalism_rating?: number | null
          helpful_count?: number | null
          verified?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewed_id_fkey"
            columns: ["reviewed_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: Database["public"]["Enums"]["notification_type"]
          title: string
          message: string
          booking_id: string | null
          service_id: string | null
          data: Json | null
          read: boolean | null
          read_at: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: Database["public"]["Enums"]["notification_type"]
          title: string
          message: string
          booking_id?: string | null
          service_id?: string | null
          data?: Json | null
          read?: boolean | null
          read_at?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: Database["public"]["Enums"]["notification_type"]
          title?: string
          message?: string
          booking_id?: string | null
          service_id?: string | null
          data?: Json | null
          read?: boolean | null
          read_at?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Enums: {
      booking_status:
        | "draft"
        | "pending"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      company_size: "micro" | "small" | "medium" | "large"
      location_type: "on_site" | "remote" | "flexible"
      notification_type:
        | "booking_request"
        | "booking_confirmed"
        | "booking_cancelled"
        | "booking_reminder"
        | "payment_reminder"
        | "review_request"
        | "system_update"
      payment_status: "pending" | "paid" | "failed" | "refunded"
      pricing_unit: "fixed" | "hourly" | "daily" | "per_participant" | "per_sqm"
      service_category:
        | "consultation_management"
        | "workplace_safety"
        | "training_education"
        | "environment"
        | "occupational_health"
        | "emergency_crisis"
        | "innovation_digital"
        | "specialized_services"
      service_type: "instant" | "on_request" | "scheduled"
      user_type: "client" | "provider" | "admin"
    }
  }
}

// Utility types for better type inference
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]

// Specific types for common use cases
export type User = Tables<'users'>
export type ClientProfile = Tables<'client_profiles'>
export type ProviderProfile = Tables<'provider_profiles'>
export type Service = Tables<'services'>
export type Booking = Tables<'bookings'>
export type Review = Tables<'reviews'>
export type Notification = Tables<'notifications'>

// Extended types with relationships
export type UserWithProfile = User & {
  client_profiles?: ClientProfile
  provider_profiles?: ProviderProfile
}

export type ServiceWithProvider = Service & {
  provider: User & {
    provider_profiles?: ProviderProfile
  }
}

export type BookingWithDetails = Booking & {
  service: Service
  client: User & {
    client_profiles?: ClientProfile
  }
  provider: User & {
    provider_profiles?: ProviderProfile
  }
}

export type ReviewWithDetails = Review & {
  booking: Booking
  reviewer: User & {
    client_profiles?: ClientProfile
  }
  reviewed: User
  service: Service
}