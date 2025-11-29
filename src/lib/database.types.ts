// Tipizzazioni database Supabase per BookingHSE
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          user_type: 'client' | 'provider' | 'admin'
          first_name?: string
          last_name?: string
          phone?: string
          company_name?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          user_type: 'client' | 'provider' | 'admin'
          first_name?: string
          last_name?: string
          phone?: string
          company_name?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          user_type?: 'client' | 'provider' | 'admin'
          first_name?: string
          last_name?: string
          phone?: string
          company_name?: string
          created_at?: string
          updated_at?: string
        }
      }
      client_profiles: {
        Row: {
          id: string
          user_id: string
          company_name: string
          vat_number?: string
          fiscal_code?: string
          company_size?: 'micro' | 'small' | 'medium' | 'large'
          industry_sector?: string
          employees_count?: number
          phone?: string
          website?: string
          
          // Legal Address
          legal_street?: string
          legal_city?: string
          legal_province?: string
          legal_postal_code?: string
          legal_country?: string
          
          // Billing Address
          billing_street?: string
          billing_city?: string
          billing_province?: string
          billing_postal_code?: string
          billing_country?: string
          
          // Contact Person
          contact_person_name?: string
          contact_person_role?: string
          contact_person_email?: string
          contact_person_phone?: string
          
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_name: string
          vat_number?: string
          fiscal_code?: string
          company_size?: 'micro' | 'small' | 'medium' | 'large'
          industry_sector?: string
          employees_count?: number
          phone?: string
          website?: string
          
          // Legal Address
          legal_street?: string
          legal_city?: string
          legal_province?: string
          legal_postal_code?: string
          legal_country?: string
          
          // Billing Address
          billing_street?: string
          billing_city?: string
          billing_province?: string
          billing_postal_code?: string
          billing_country?: string
          
          // Contact Person
          contact_person_name?: string
          contact_person_role?: string
          contact_person_email?: string
          contact_person_phone?: string
          
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_name?: string
          vat_number?: string
          fiscal_code?: string
          company_size?: 'micro' | 'small' | 'medium' | 'large'
          industry_sector?: string
          employees_count?: number
          phone?: string
          website?: string
          
          // Legal Address
          legal_street?: string
          legal_city?: string
          legal_province?: string
          legal_postal_code?: string
          legal_country?: string
          
          // Billing Address
          billing_street?: string
          billing_city?: string
          billing_province?: string
          billing_postal_code?: string
          billing_country?: string
          
          // Contact Person
          contact_person_name?: string
          contact_person_role?: string
          contact_person_email?: string
          contact_person_phone?: string
          
          created_at?: string
          updated_at?: string
        }
      }
      provider_profiles: {
        Row: {
          id: string
          user_id: string
          business_name: string
          vat_number?: string
          fiscal_code?: string
          professional_order?: string
          registration_number?: string
          phone?: string
          description?: string
          experience_years?: number
          team_size?: number
          
          // Address
          street?: string
          city?: string
          province?: string
          postal_code?: string
          country?: string
          latitude?: number
          longitude?: number
          
          // Contact Person
          contact_person_name?: string
          contact_person_role?: string
          contact_person_email?: string
          contact_person_phone?: string
          
          // Business Info
          specializations?: string[]
          service_areas?: string[]
          languages?: string[]
          
          // Ratings & Verification
          rating_average?: number
          reviews_count?: number
          verified?: boolean
          verification_date?: string
          
          // Business Settings
          auto_accept_bookings?: boolean
          advance_notice_hours?: number
          cancellation_policy?: string
          
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_name: string
          vat_number?: string
          fiscal_code?: string
          professional_order?: string
          registration_number?: string
          phone?: string
          description?: string
          experience_years?: number
          team_size?: number
          
          // Address
          street?: string
          city?: string
          province?: string
          postal_code?: string
          country?: string
          latitude?: number
          longitude?: number
          
          // Contact Person
          contact_person_name?: string
          contact_person_role?: string
          contact_person_email?: string
          contact_person_phone?: string
          
          // Business Info
          specializations?: string[]
          service_areas?: string[]
          languages?: string[]
          
          // Ratings & Verification
          rating_average?: number
          reviews_count?: number
          verified?: boolean
          verification_date?: string
          
          // Business Settings
          auto_accept_bookings?: boolean
          advance_notice_hours?: number
          cancellation_policy?: string
          
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_name?: string
          vat_number?: string
          fiscal_code?: string
          professional_order?: string
          registration_number?: string
          phone?: string
          description?: string
          experience_years?: number
          team_size?: number
          
          // Address
          street?: string
          city?: string
          province?: string
          postal_code?: string
          country?: string
          latitude?: number
          longitude?: number
          
          // Contact Person
          contact_person_name?: string
          contact_person_role?: string
          contact_person_email?: string
          contact_person_phone?: string
          
          // Business Info
          specializations?: string[]
          service_areas?: string[]
          languages?: string[]
          
          // Ratings & Verification
          rating_average?: number
          reviews_count?: number
          verified?: boolean
          verification_date?: string
          
          // Business Settings
          auto_accept_bookings?: boolean
          advance_notice_hours?: number
          cancellation_policy?: string
          
          created_at?: string
          updated_at?: string
        }
      }
      services: {
        Row: {
          id: string
          provider_id: string
          title: string
          description: string
          category: string
          subcategory?: string
          service_type: 'instant' | 'on_request' | 'scheduled'
          location_type: 'on_site' | 'remote' | 'flexible'
          base_price: number
          pricing_unit: 'fixed' | 'hourly' | 'daily' | 'per_participant' | 'per_sqm'
          duration_hours?: number
          max_participants?: number
          min_participants?: number
          service_areas: string[]
          requirements?: string[]
          deliverables?: string[]
          tags: string[]
          images?: string[]
          documents?: Json
          active: boolean
          featured: boolean
          rating_average: number
          reviews_count: number
          bookings_count: number
          slug: string
          seo_title?: string
          seo_description?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          title: string
          description: string
          category: string
          subcategory?: string
          service_type: 'instant' | 'on_request' | 'scheduled'
          location_type: 'on_site' | 'remote' | 'flexible'
          base_price: number
          pricing_unit: 'fixed' | 'hourly' | 'daily' | 'per_participant' | 'per_sqm'
          duration_hours?: number
          max_participants?: number
          min_participants?: number
          service_areas: string[]
          requirements?: string[]
          deliverables?: string[]
          tags: string[]
          images?: string[]
          documents?: Json
          active?: boolean
          featured?: boolean
          rating_average?: number
          reviews_count?: number
          bookings_count?: number
          slug: string
          seo_title?: string
          seo_description?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          title?: string
          description?: string
          category?: string
          subcategory?: string
          service_type?: 'instant' | 'on_request' | 'scheduled'
          location_type?: 'on_site' | 'remote' | 'flexible'
          base_price?: number
          pricing_unit?: 'fixed' | 'hourly' | 'daily' | 'per_participant' | 'per_sqm'
          duration_hours?: number
          max_participants?: number
          min_participants?: number
          service_areas?: string[]
          requirements?: string[]
          deliverables?: string[]
          tags?: string[]
          images?: string[]
          documents?: Json
          active?: boolean
          featured?: boolean
          rating_average?: number
          reviews_count?: number
          bookings_count?: number
          slug?: string
          seo_title?: string
          seo_description?: string
          created_at?: string
          updated_at?: string
        }
      }
      bookings: {
        Row: {
          id: string
          service_id: string
          client_id: string
          provider_id: string
          status: 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          booking_date: string
          start_time?: string
          end_time?: string
          duration_hours?: number
          location_type: 'on_site' | 'remote' | 'flexible'
          location_street?: string
          location_city?: string
          location_province?: string
          location_postal_code?: string
          location_coordinates?: Json
          participants_count?: number
          base_amount: number
          tax_amount: number
          total_amount: number
          payment_status: 'pending' | 'paid' | 'failed'
          payment_method?: string
          payment_intent_id?: string
          client_notes?: string
          provider_notes?: string
          special_requirements?: string[]
          cancellation_reason?: string
          cancelled_by?: string
          cancelled_at?: string
          completed_at?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          service_id: string
          client_id: string
          provider_id: string
          status?: 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          booking_date: string
          start_time?: string
          end_time?: string
          duration_hours?: number
          location_type: 'on_site' | 'remote' | 'flexible'
          location_street?: string
          location_city?: string
          location_province?: string
          location_postal_code?: string
          location_coordinates?: Json
          participants_count?: number
          base_amount: number
          tax_amount: number
          total_amount: number
          payment_status?: 'pending' | 'paid' | 'failed'
          payment_method?: string
          payment_intent_id?: string
          client_notes?: string
          provider_notes?: string
          special_requirements?: string[]
          cancellation_reason?: string
          cancelled_by?: string
          cancelled_at?: string
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          service_id?: string
          client_id?: string
          provider_id?: string
          status?: 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
          booking_date?: string
          start_time?: string
          end_time?: string
          duration_hours?: number
          location_type?: 'on_site' | 'remote' | 'flexible'
          location_street?: string
          location_city?: string
          location_province?: string
          location_postal_code?: string
          location_coordinates?: Json
          participants_count?: number
          base_amount?: number
          tax_amount?: number
          total_amount?: number
          payment_status?: 'pending' | 'paid' | 'failed'
          payment_method?: string
          payment_intent_id?: string
          client_notes?: string
          provider_notes?: string
          special_requirements?: string[]
          cancellation_reason?: string
          cancelled_by?: string
          cancelled_at?: string
          completed_at?: string
          created_at?: string
          updated_at?: string
        }
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          reviewer_id: string
          reviewed_id: string
          service_id: string
          rating: number
          title?: string
          comment?: string
          communication_rating?: number
          quality_rating?: number
          timeliness_rating?: number
          professionalism_rating?: number
          helpful_count: number
          verified: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          reviewer_id: string
          reviewed_id: string
          service_id: string
          rating: number
          title?: string
          comment?: string
          communication_rating?: number
          quality_rating?: number
          timeliness_rating?: number
          professionalism_rating?: number
          helpful_count?: number
          verified?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          reviewer_id?: string
          reviewed_id?: string
          service_id?: string
          rating?: number
          title?: string
          comment?: string
          communication_rating?: number
          quality_rating?: number
          timeliness_rating?: number
          professionalism_rating?: number
          helpful_count?: number
          verified?: boolean
          created_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          message: string
          priority: 'low' | 'medium' | 'high' | 'urgent'
          data?: Json
          read: boolean
          created_at: string
          expires_at?: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          message: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          data?: Json
          read?: boolean
          created_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          type?: string
          title?: string
          message?: string
          priority?: 'low' | 'medium' | 'high' | 'urgent'
          data?: Json
          read?: boolean
          created_at?: string
          expires_at?: string
        }
      }
      certifications: {
        Row: {
          id: string
          provider_id: string
          title: string
          type: string
          issuing_authority: string
          certificate_number: string
          issue_date: string
          expiry_date?: string
          status: 'pending' | 'verified' | 'rejected' | 'expired' | 'suspended'
          verification_method: string
          document_url?: string
          document_type: string
          verification_data?: Json
          auto_renewal: boolean
          reminder_days: number
          tags: string[]
          metadata?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          title: string
          type: string
          issuing_authority: string
          certificate_number: string
          issue_date: string
          expiry_date?: string
          status?: 'pending' | 'verified' | 'rejected' | 'expired' | 'suspended'
          verification_method: string
          document_url?: string
          document_type: string
          verification_data?: Json
          auto_renewal?: boolean
          reminder_days?: number
          tags?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          title?: string
          type?: string
          issuing_authority?: string
          certificate_number?: string
          issue_date?: string
          expiry_date?: string
          status?: 'pending' | 'verified' | 'rejected' | 'expired' | 'suspended'
          verification_method?: string
          document_url?: string
          document_type?: string
          verification_data?: Json
          auto_renewal?: boolean
          reminder_days?: number
          tags?: string[]
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      availability_slots: {
        Row: {
          id: string
          provider_id: string
          service_id?: string
          date: string
          start_time: string
          end_time: string
          duration_minutes: number
          max_bookings: number
          current_bookings: number
          price_override?: number
          status: 'available' | 'booked' | 'blocked' | 'unavailable'
          booking_id?: string
          notes?: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          provider_id: string
          service_id?: string
          date: string
          start_time: string
          end_time: string
          duration_minutes: number
          max_bookings?: number
          current_bookings?: number
          price_override?: number
          status?: 'available' | 'booked' | 'blocked' | 'unavailable'
          booking_id?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          provider_id?: string
          service_id?: string
          date?: string
          start_time?: string
          end_time?: string
          duration_minutes?: number
          max_bookings?: number
          current_bookings?: number
          price_override?: number
          status?: 'available' | 'booked' | 'blocked' | 'unavailable'
          booking_id?: string
          notes?: string
          created_at?: string
          updated_at?: string
        }
      }
      payments: {
        Row: {
          id: string
          booking_id: string
          provider_id: string
          client_id: string
          amount: number
          currency: string
          status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'
          payment_method: string
          stripe_payment_intent_id?: string
          stripe_charge_id?: string
          refund_amount?: number
          refund_reason?: string
          error_message?: string
          error_code?: string
          metadata?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          provider_id: string
          client_id: string
          amount: number
          currency?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'
          payment_method: string
          stripe_payment_intent_id?: string
          stripe_charge_id?: string
          refund_amount?: number
          refund_reason?: string
          error_message?: string
          error_code?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          provider_id?: string
          client_id?: string
          amount?: number
          currency?: string
          status?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded'
          payment_method?: string
          stripe_payment_intent_id?: string
          stripe_charge_id?: string
          refund_amount?: number
          refund_reason?: string
          error_message?: string
          error_code?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      user_type: 'client' | 'provider' | 'admin'
      company_size: 'micro' | 'small' | 'medium' | 'large'
      service_category: 'safety_training' | 'risk_assessment' | 'compliance_audit' | 'emergency_planning' | 'equipment_inspection' | 'environmental_monitoring' | 'occupational_health' | 'fire_safety' | 'chemical_safety' | 'ergonomics'
      service_type: 'instant' | 'on_request' | 'scheduled'
      location_type: 'on_site' | 'remote' | 'flexible'
      pricing_unit: 'fixed' | 'hourly' | 'daily' | 'per_participant' | 'per_sqm'
      booking_status: 'draft' | 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
      payment_status: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded'
      notification_type: 'booking' | 'payment' | 'review' | 'system' | 'marketing'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (Database['public']['Tables'] & Database['public']['Views'])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions['schema']]['Tables'] &
        Database[PublicTableNameOrOptions['schema']]['Views'])
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions['schema']]['Tables'] &
      Database[PublicTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (Database['public']['Tables'] &
      Database['public']['Views'])
  ? (Database['public']['Tables'] &
      Database['public']['Views'])[PublicTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof Database['public']['Tables']
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions['schema']]['Tables']
    : never = never
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][PublicTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database['public']['Enums']
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions['schema']]['Enums']
    : never = never
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions['schema']]['Enums'][EnumName]
  : PublicEnumNameOrOptions extends keyof Database['public']['Enums']
  ? Database['public']['Enums'][PublicEnumNameOrOptions]
  : never
