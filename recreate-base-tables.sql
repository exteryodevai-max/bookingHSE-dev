-- RICREA TABELLE BASE PER EMERGENZA
-- BookingHSE Database Schema - Tabelle Essenziali

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  user_type VARCHAR(20) NOT NULL DEFAULT 'client',
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  company_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL,
  subcategory VARCHAR(100),
  service_type VARCHAR(20) NOT NULL DEFAULT 'on_request',
  location_type VARCHAR(20) NOT NULL DEFAULT 'on_site',
  
  -- Pricing
  base_price DECIMAL(10,2) NOT NULL,
  pricing_unit VARCHAR(20) NOT NULL DEFAULT 'fixed',
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
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  provider_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  -- Booking Details
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  booking_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  duration_hours DECIMAL(4,2),
  
  -- Location
  location_type VARCHAR(20) NOT NULL,
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
  total_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles base
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  avatar_url TEXT,
  bio TEXT,
  location VARCHAR(255),
  website VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies
CREATE POLICY "Users can view all users" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public can view active services" ON services FOR SELECT USING (active = true);
CREATE POLICY "Providers can manage own services" ON services FOR ALL USING (auth.uid() = provider_id);
CREATE POLICY "Users can view own bookings" ON bookings FOR SELECT USING (auth.uid() = client_id OR auth.uid() = provider_id);
CREATE POLICY "Users can create bookings" ON bookings FOR INSERT WITH CHECK (auth.uid() = client_id);
CREATE POLICY "Users can update own profile" ON profiles FOR ALL USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services(provider_id);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(active);
CREATE INDEX IF NOT EXISTS idx_bookings_client_id ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_provider_id ON bookings(provider_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);