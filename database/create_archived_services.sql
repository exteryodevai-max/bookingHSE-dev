-- Creazione tabella archived_services con la stessa struttura di services
CREATE TABLE IF NOT EXISTS archived_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL,
  duration INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  location_type VARCHAR(50) DEFAULT 'online',
  location_address TEXT,
  requirements TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS Policies per archived_services
ALTER TABLE archived_services ENABLE ROW LEVEL SECURITY;

-- Policy per permettere ai provider di vedere i propri servizi archiviati
CREATE POLICY "Provider può vedere i propri servizi archiviati" ON archived_services
  FOR SELECT USING (auth.uid() = provider_id);

-- Policy per permettere ai provider di archiviare (inserire) i propri servizi
CREATE POLICY "Provider può archiviare i propri servizi" ON archived_services
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

-- Policy per permettere ai provider di ripristinare (eliminare) i propri servizi archiviati
CREATE POLICY "Provider può ripristinare i propri servizi archiviati" ON archived_services
  FOR DELETE USING (auth.uid() = provider_id);

-- Indici per performance
CREATE INDEX idx_archived_services_provider_id ON archived_services(provider_id);
CREATE INDEX idx_archived_services_category ON archived_services(category);
CREATE INDEX idx_archived_services_created_at ON archived_services(created_at DESC);

-- Trigger per aggiornare updated_at
CREATE OR REPLACE FUNCTION update_archived_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_archived_services_updated_at
  BEFORE UPDATE ON archived_services
  FOR EACH ROW
  EXECUTE FUNCTION update_archived_services_updated_at();