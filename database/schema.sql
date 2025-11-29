-- BookingHSE Database Schema
-- Supabase PostgreSQL Database

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Custom Types
CREATE TYPE user_type AS ENUM ('client', 'provider', 'admin');
CREATE TYPE company_size AS ENUM ('micro', 'small', 'medium', 'large');
CREATE TYPE service_category AS ENUM (
  'consultation_management',
  'workplace_safety', 
  'training_education',
  'environment',
  'occupational_health',
  'emergency_crisis',
  'innovation_digital',
  'specialized_services'
);
CREATE TYPE service_type AS ENUM ('instant', 'on_request', 'scheduled');
CREATE TYPE location_type AS ENUM ('on_site', 'remote', 'flexible');
CREATE TYPE pricing_unit AS ENUM ('fixed', 'hourly', 'daily', 'per_participant', 'per_sqm');
CREATE TYPE booking_status AS ENUM ('draft', 'pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show');
CREATE TYPE payment_status AS ENUM ('pending', 'authorized', 'captured', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE notification_type AS ENUM ('booking', 'payment', 'review', 'system', 'marketing');

-- Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  user_type user_type NOT NULL DEFAULT 'client',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client Profiles
CREATE TABLE client_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  vat_number VARCHAR(50),
  fiscal_code VARCHAR(50),
  company_size company_size,
  industry_sector VARCHAR(100),
  employees_count INTEGER,
  phone VARCHAR(50),
  website VARCHAR(255),
  
  -- Legal Address
  legal_street VARCHAR(255),
  legal_city VARCHAR(100),
  legal_province VARCHAR(10),
  legal_postal_code VARCHAR(20),
  legal_country VARCHAR(100) DEFAULT 'Italy',
  
  -- Billing Address (optional)
  billing_street VARCHAR(255),
  billing_city VARCHAR(100),
  billing_province VARCHAR(10),
  billing_postal_code VARCHAR(20),
  billing_country VARCHAR(100),
  
  -- Contact Person
  contact_person_name VARCHAR(255),
  contact_person_role VARCHAR(100),
  contact_person_email VARCHAR(255),
  contact_person_phone VARCHAR(50),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Provider Profiles
CREATE TABLE provider_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  business_name VARCHAR(255) NOT NULL,
  vat_number VARCHAR(50),
  fiscal_code VARCHAR(50),
  professional_order VARCHAR(100),
  registration_number VARCHAR(100),
  phone VARCHAR(50),
  description TEXT,
  experience_years INTEGER DEFAULT 0,
  team_size INTEGER DEFAULT 1,
  
  -- Address
  street VARCHAR(255),
  city VARCHAR(100),
  province VARCHAR(10),
  postal_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'Italy',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Contact Person
  contact_person_name VARCHAR(255),
  contact_person_role VARCHAR(100),
  contact_person_email VARCHAR(255),
  contact_person_phone VARCHAR(50),
  
  -- Business Info
  specializations TEXT[], -- Array of specializations
  service_areas TEXT[], -- Array of cities/regions served
  languages TEXT[] DEFAULT ARRAY['Italian'],
  
  -- Ratings & Verification
  rating_average DECIMAL(3,2) DEFAULT 0.0,
  reviews_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  verification_date TIMESTAMP WITH TIME ZONE,
  
  -- Business Settings
  auto_accept_bookings BOOLEAN DEFAULT FALSE,
  advance_notice_hours INTEGER DEFAULT 24,
  cancellation_policy TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Services
CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category service_category NOT NULL,
  subcategory VARCHAR(100),
  service_type service_type NOT NULL DEFAULT 'on_request',
  location_type location_type NOT NULL DEFAULT 'on_site',
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  pricing_unit pricing_unit NOT NULL DEFAULT 'fixed',
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Service Details
  duration_hours DECIMAL(4,2),
  max_participants INTEGER,
  min_participants INTEGER DEFAULT 1,
  service_areas TEXT[], -- Cities/regions where service is available
  requirements TEXT[],
  deliverables TEXT[],
  tags TEXT[],
  
  -- Media
  images TEXT[], -- Array of image URLs
  documents TEXT[], -- Array of document URLs
  
  -- Status
  active BOOLEAN DEFAULT TRUE,
  featured BOOLEAN DEFAULT FALSE,
  
  -- SEO
  slug VARCHAR(255) UNIQUE,
  meta_description TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Booking Details
  status booking_status NOT NULL DEFAULT 'pending',
  booking_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration_hours DECIMAL(4,2),
  
  -- Location
  location_type location_type NOT NULL,
  location_street VARCHAR(255),
  location_city VARCHAR(100),
  location_province VARCHAR(10),
  location_postal_code VARCHAR(20),
  location_country VARCHAR(100),
  meeting_details TEXT,
  access_instructions TEXT,
  
  -- Participants
  participants_count INTEGER NOT NULL DEFAULT 1,
  
  -- Pricing
  base_amount DECIMAL(10,2) NOT NULL,
  additional_costs JSONB DEFAULT '[]',
  discount_amount DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Payment
  payment_status payment_status DEFAULT 'pending',
  payment_method VARCHAR(50),
  payment_due_date DATE,
  advance_payment_amount DECIMAL(10,2),
  advance_payment_status payment_status,
  
  -- Communication
  client_notes TEXT,
  provider_notes TEXT,
  internal_notes TEXT,
  special_requirements TEXT[],
  
  -- Tracking
  check_in_time TIMESTAMP WITH TIME ZONE,
  check_out_time TIMESTAMP WITH TIME ZONE,
  completion_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE
);

-- Reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reviewed_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
  
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255),
  comment TEXT,
  
  -- Review Categories (for detailed feedback)
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  timeliness_rating INTEGER CHECK (timeliness_rating >= 1 AND timeliness_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  
  helpful_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(booking_id, reviewer_id)
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type notification_type NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id) ON DELETE CASCADE,
  
  -- Metadata
  data JSONB DEFAULT '{}',
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Certifications (for providers)
CREATE TABLE certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  issuing_organization VARCHAR(255),
  issue_date DATE,
  expiry_date DATE,
  certificate_number VARCHAR(100),
  document_url VARCHAR(500),
  verified BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Availability Slots (for providers)
CREATE TABLE availability_slots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blocked Dates (for providers)
CREATE TABLE blocked_dates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  reason VARCHAR(255),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_user_type ON users(user_type);
CREATE INDEX idx_services_provider_id ON services(provider_id);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_active ON services(active);
CREATE INDEX idx_services_featured ON services(featured);
CREATE INDEX idx_bookings_client_id ON bookings(client_id);
CREATE INDEX idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_booking_date ON bookings(booking_date);
CREATE INDEX idx_reviews_service_id ON reviews(service_id);
CREATE INDEX idx_reviews_reviewed_id ON reviews(reviewed_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);

-- Performance indexes for search (partial indexes for active services)
CREATE INDEX idx_services_category_active ON services(category) WHERE active = true;
CREATE INDEX idx_services_base_price_active ON services(base_price) WHERE active = true;
CREATE INDEX idx_services_created_at_desc_active ON services(created_at DESC) WHERE active = true;
CREATE INDEX idx_services_category_active_featured ON services(category, active, featured) WHERE active = true;

-- Provider profiles indexes
CREATE INDEX idx_provider_profiles_verified ON provider_profiles(verified);
CREATE INDEX idx_provider_profiles_rating_average_desc ON provider_profiles(rating_average DESC);

-- Full-text search support (Italian language)
ALTER TABLE services ADD COLUMN IF NOT EXISTS search_vector tsvector;
CREATE INDEX idx_services_search_vector ON services USING GIN(search_vector);

-- Function to update search vector with weighted fields
CREATE OR REPLACE FUNCTION update_services_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('italian', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('italian', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('italian', COALESCE(NEW.subcategory, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update search_vector
CREATE TRIGGER services_search_vector_trigger
  BEFORE INSERT OR UPDATE OF title, description, subcategory ON services
  FOR EACH ROW
  EXECUTE FUNCTION update_services_search_vector();

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_profiles_updated_at BEFORE UPDATE ON client_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_provider_profiles_updated_at BEFORE UPDATE ON provider_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON certifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_slots_updated_at BEFORE UPDATE ON availability_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_dates ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Client profiles policies
CREATE POLICY "Users can view their own client profile" ON client_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own client profile" ON client_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own client profile" ON client_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Provider profiles policies
CREATE POLICY "Anyone can view verified provider profiles" ON provider_profiles FOR SELECT USING (verified = true);
CREATE POLICY "Users can view their own provider profile" ON provider_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own provider profile" ON provider_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own provider profile" ON provider_profiles FOR UPDATE USING (auth.uid() = user_id);

-- Services policies
CREATE POLICY "Anyone can view active services" ON services FOR SELECT USING (active = true);
CREATE POLICY "Providers can view their own services" ON services FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Providers can insert their own services" ON services FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update their own services" ON services FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Providers can delete their own services" ON services FOR DELETE USING (auth.uid() = provider_id);

-- Bookings policies
CREATE POLICY "Users can view their own bookings" ON bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);
CREATE POLICY "Clients can insert bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update their own bookings" ON bookings FOR UPDATE USING (auth.uid() = client_id OR auth.uid() = provider_id);

-- Reviews policies
CREATE POLICY "Anyone can view reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "Users can update their own reviews" ON reviews FOR UPDATE USING (auth.uid() = reviewer_id);

-- Notifications policies
CREATE POLICY "Users can view their own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Certifications policies
CREATE POLICY "Anyone can view verified certifications" ON certifications FOR SELECT USING (verified = true);
CREATE POLICY "Providers can view their own certifications" ON certifications FOR SELECT USING (auth.uid() = provider_id);
CREATE POLICY "Providers can insert their own certifications" ON certifications FOR INSERT WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "Providers can update their own certifications" ON certifications FOR UPDATE USING (auth.uid() = provider_id);
CREATE POLICY "Providers can delete their own certifications" ON certifications FOR DELETE USING (auth.uid() = provider_id);

-- Availability slots policies
CREATE POLICY "Anyone can view availability slots" ON availability_slots FOR SELECT USING (true);
CREATE POLICY "Providers can manage their own availability" ON availability_slots FOR ALL USING (auth.uid() = provider_id);

-- Blocked dates policies
CREATE POLICY "Anyone can view blocked dates" ON blocked_dates FOR SELECT USING (true);
CREATE POLICY "Providers can manage their own blocked dates" ON blocked_dates FOR ALL USING (auth.uid() = provider_id);
