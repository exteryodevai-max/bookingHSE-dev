-- BookingHSE Database Seed Data
-- Sample data for development and testing

-- Insert sample users (these will be created through Supabase Auth)
-- Note: In production, users are created through the auth system
-- This is just for reference of the user structure

-- Sample Client Profiles
INSERT INTO client_profiles (
  user_id,
  company_name,
  vat_number,
  fiscal_code,
  company_size,
  industry_sector,
  employees_count,
  phone,
  website,
  legal_street,
  legal_city,
  legal_province,
  legal_postal_code,
  contact_person_name,
  contact_person_role,
  contact_person_email,
  contact_person_phone
) VALUES 
-- Note: Replace these UUIDs with actual user IDs from auth.users after user registration
(
  '11111111-1111-1111-1111-111111111111',
  'Acme Manufacturing S.r.l.',
  'IT12345678901',
  'ACMMFG80A01H501Z',
  'medium',
  'Manufacturing',
  150,
  '+39 02 1234567',
  'https://www.acme-manufacturing.it',
  'Via Roma 123',
  'Milano',
  'MI',
  '20121',
  'Mario Rossi',
  'HSE Manager',
  'mario.rossi@acme-manufacturing.it',
  '+39 335 1234567'
),
(
  '22222222-2222-2222-2222-222222222222',
  'TechCorp S.p.A.',
  'IT98765432109',
  'TCHCRP85B15F205W',
  'large',
  'Technology',
  500,
  '+39 011 9876543',
  'https://www.techcorp.it',
  'Corso Torino 456',
  'Torino',
  'TO',
  '10128',
  'Laura Bianchi',
  'Safety Coordinator',
  'laura.bianchi@techcorp.it',
  '+39 347 9876543'
);

-- Sample Provider Profiles
INSERT INTO provider_profiles (
  user_id,
  business_name,
  vat_number,
  fiscal_code,
  professional_order,
  registration_number,
  phone,
  website,
  description,
  experience_years,
  team_size,
  street,
  city,
  province,
  postal_code,
  contact_person_name,
  contact_person_role,
  contact_person_email,
  contact_person_phone,
  specializations,
  service_areas,
  languages,
  rating_average,
  reviews_count,
  verified,
  verification_date,
  auto_accept_bookings,
  advance_notice_hours,
  cancellation_policy
) VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  'Studio Sicurezza Milano',
  'IT11223344556',
  'STDSIC75C10F205Y',
  'Ordine Ingegneri Milano',
  'ING-MI-12345',
  '+39 02 5551234',
  'https://www.studiosicurezzamilano.it',
  'Studio specializzato in consulenza HSE con oltre 15 anni di esperienza. Offriamo servizi completi di valutazione rischi, formazione e consulenza per la sicurezza sul lavoro.',
  15,
  8,
  'Via Brera 15',
  'Milano',
  'MI',
  '20121',
  'Ing. Giuseppe Verdi',
  'Titolare',
  'giuseppe.verdi@studiosicurezzamilano.it',
  '+39 335 5551234',
  ARRAY['Valutazione Rischi', 'Formazione Sicurezza', 'Consulenza D.Lgs 81/08', 'Audit ISO 45001'],
  ARRAY['Milano', 'Lombardia', 'Piemonte'],
  ARRAY['Italian', 'English'],
  4.8,
  45,
  true,
  NOW() - INTERVAL '6 months',
  false,
  48,
  'Cancellazione gratuita fino a 48 ore prima. Cancellazioni tardive comportano il 50% del costo.'
),
(
  '44444444-4444-4444-4444-444444444444',
  'Formazione HSE Pro',
  'IT66778899001',
  'FRMHSE80D20H501X',
  'Ordine Psicologi Lombardia',
  'PSI-LO-67890',
  '+39 02 7778899',
  'https://www.formazionehsepro.it',
  'Centro di formazione specializzato in corsi di sicurezza sul lavoro, ambiente e salute occupazionale. Ente accreditato presso la Regione Lombardia.',
  12,
  15,
  'Via Garibaldi 88',
  'Rho',
  'MI',
  '20017',
  'Dott.ssa Anna Neri',
  'Direttore Formazione',
  'anna.neri@formazionehsepro.it',
  '+39 348 7778899',
  ARRAY['Formazione Sicurezza', 'Corsi Antincendio', 'Primo Soccorso', 'Formazione Dirigenti'],
  ARRAY['Milano', 'Rho', 'Lombardia', 'Piemonte'],
  ARRAY['Italian', 'English', 'Spanish'],
  4.9,
  78,
  true,
  NOW() - INTERVAL '3 months',
  true,
  24,
  'Cancellazione gratuita fino a 24 ore prima. Cancellazioni tardive comportano il 30% del costo.'
),
(
  '55555555-5555-5555-5555-555555555555',
  'EcoConsult Ambiente',
  'IT33445566778',
  'ECOCNS85E15F205Z',
  'Ordine Chimici Milano',
  'CHI-MI-54321',
  '+39 02 3334455',
  'https://www.ecoconsultambiente.it',
  'Consulenza ambientale specializzata in valutazioni di impatto, gestione rifiuti e certificazioni ambientali. Partner certificato per ISO 14001.',
  10,
  6,
  'Viale Monza 234',
  'Milano',
  'MI',
  '20125',
  'Dott. Marco Blu',
  'Consulente Senior',
  'marco.blu@ecoconsultambiente.it',
  '+39 339 3334455',
  ARRAY['Valutazione Impatto Ambientale', 'Gestione Rifiuti', 'ISO 14001', 'Bonifiche'],
  ARRAY['Milano', 'Lombardia', 'Veneto'],
  ARRAY['Italian', 'English'],
  4.7,
  32,
  true,
  NOW() - INTERVAL '4 months',
  false,
  72,
  'Cancellazione gratuita fino a 72 ore prima per sopralluoghi. Cancellazioni tardive comportano il 100% del costo.'
);

-- Sample Services
INSERT INTO services (
  provider_id,
  title,
  description,
  category,
  subcategory,
  service_type,
  location_type,
  base_price,
  pricing_unit,
  duration_hours,
  max_participants,
  min_participants,
  service_areas,
  requirements,
  deliverables,
  tags,
  active,
  featured,
  slug
) VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  'Documento di Valutazione dei Rischi (DVR)',
  'Redazione completa del Documento di Valutazione dei Rischi secondo D.Lgs. 81/08. Include sopralluogo, analisi dei rischi, misure di prevenzione e protezione, programma di miglioramento.',
  'workplace_safety',
  'Valutazione Rischi',
  'on_request',
  'on_site',
  800.00,
  'fixed',
  8.0,
  NULL,
  1,
  ARRAY['Milano', 'Lombardia'],
  ARRAY['Accesso ai luoghi di lavoro', 'Documentazione aziendale esistente', 'Disponibilità del datore di lavoro'],
  ARRAY['Documento di Valutazione dei Rischi completo', 'Relazione tecnica', 'Programma di miglioramento', 'Supporto per 6 mesi'],
  ARRAY['DVR', 'Sicurezza', 'D.Lgs 81/08', 'Valutazione Rischi'],
  true,
  true,
  'documento-valutazione-rischi-dvr'
),
(
  '44444444-4444-4444-4444-444444444444',
  'Formazione Sicurezza Lavoratori - Generale e Specifica',
  'Corso di formazione per lavoratori secondo Accordo Stato-Regioni. Include formazione generale (4 ore) e specifica in base al rischio aziendale (4-8-12 ore).',
  'training_education',
  'Formazione Base',
  'instant',
  'flexible',
  120.00,
  'per_participant',
  8.0,
  25,
  5,
  ARRAY['Milano', 'Rho', 'Lombardia'],
  ARRAY['Aula attrezzata', 'Elenco partecipanti', 'Registro presenze'],
  ARRAY['Attestato di formazione', 'Materiale didattico', 'Registro formazione', 'Test di verifica'],
  ARRAY['Formazione', 'Sicurezza', 'Accordo Stato-Regioni', 'Lavoratori'],
  true,
  false,
  'formazione-sicurezza-lavoratori'
),
(
  '44444444-4444-4444-4444-444444444444',
  'Corso Antincendio - Rischio Medio',
  'Corso di formazione antincendio per addetti alle emergenze in attività a rischio medio secondo D.M. 02/09/2021. Teoria e pratica con esercitazioni.',
  'training_education',
  'Formazione Specialistica',
  'scheduled',
  'on_site',
  180.00,
  'per_participant',
  8.0,
  15,
  3,
  ARRAY['Milano', 'Lombardia', 'Piemonte'],
  ARRAY['Area esterna per esercitazioni', 'Estintori per prove pratiche', 'Aula per teoria'],
  ARRAY['Attestato antincendio', 'Manuale antincendio', 'Esercitazioni pratiche', 'Aggiornamento quinquennale incluso'],
  ARRAY['Antincendio', 'Emergenze', 'Addetti Antincendio', 'D.M. 02/09/2021'],
  true,
  true,
  'corso-antincendio-rischio-medio'
),
(
  '55555555-5555-5555-5555-555555555555',
  'Valutazione di Impatto Ambientale (VIA)',
  'Studio di Impatto Ambientale completo per progetti soggetti a VIA. Include analisi ambientali, valutazione degli impatti, misure di mitigazione e monitoraggio.',
  'environment',
  'Valutazioni Ambientali',
  'on_request',
  'on_site',
  2500.00,
  'fixed',
  40.0,
  NULL,
  1,
  ARRAY['Milano', 'Lombardia', 'Veneto'],
  ARRAY['Progetto definitivo', 'Accesso al sito', 'Documentazione tecnica', 'Autorizzazioni per rilievi'],
  ARRAY['Studio di Impatto Ambientale', 'Sintesi non tecnica', 'Piano di monitoraggio', 'Supporto iter autorizzativo'],
  ARRAY['VIA', 'Ambiente', 'Impatto Ambientale', 'Autorizzazioni'],
  true,
  false,
  'valutazione-impatto-ambientale-via'
),
(
  '33333333-3333-3333-3333-333333333333',
  'Audit ISO 45001 - Sistema di Gestione Sicurezza',
  'Audit completo del Sistema di Gestione per la Salute e Sicurezza sul Lavoro secondo ISO 45001. Include gap analysis, audit documentale e sul campo.',
  'consultation_management',
  'Audit e Certificazioni',
  'on_request',
  'on_site',
  1200.00,
  'daily',
  8.0,
  NULL,
  1,
  ARRAY['Milano', 'Lombardia', 'Piemonte'],
  ARRAY['Sistema di gestione esistente', 'Documentazione SGSSL', 'Disponibilità personale chiave'],
  ARRAY['Rapporto di audit', 'Piano di miglioramento', 'Gap analysis', 'Supporto implementazione'],
  ARRAY['ISO 45001', 'Audit', 'Sistema Gestione', 'Certificazione'],
  true,
  true,
  'audit-iso-45001-sistema-gestione-sicurezza'
);

-- Sample Certifications
INSERT INTO certifications (
  provider_id,
  name,
  issuing_organization,
  issue_date,
  expiry_date,
  certificate_number,
  verified
) VALUES 
(
  '33333333-3333-3333-3333-333333333333',
  'Laurea in Ingegneria della Sicurezza',
  'Politecnico di Milano',
  '2008-07-15',
  NULL,
  'ING-SICUR-2008-1234',
  true
),
(
  '33333333-3333-3333-3333-333333333333',
  'Abilitazione Coordinatore Sicurezza',
  'Ordine Ingegneri Milano',
  '2010-03-20',
  '2025-03-20',
  'COORD-SIC-2010-5678',
  true
),
(
  '44444444-4444-4444-4444-444444444444',
  'Formatore Qualificato Sicurezza',
  'Regione Lombardia',
  '2015-09-10',
  '2025-09-10',
  'FORM-SIC-2015-9012',
  true
),
(
  '55555555-5555-5555-5555-555555555555',
  'Esperto Ambientale Qualificato',
  'Ordine Chimici Milano',
  '2014-05-12',
  NULL,
  'AMB-QUAL-2014-3456',
  true
);

-- Sample Availability Slots
INSERT INTO availability_slots (
  provider_id,
  day_of_week,
  start_time,
  end_time,
  available
) VALUES 
-- Studio Sicurezza Milano (Monday to Friday, 9-18)
('33333333-3333-3333-3333-333333333333', 1, '09:00', '18:00', true),
('33333333-3333-3333-3333-333333333333', 2, '09:00', '18:00', true),
('33333333-3333-3333-3333-333333333333', 3, '09:00', '18:00', true),
('33333333-3333-3333-3333-333333333333', 4, '09:00', '18:00', true),
('33333333-3333-3333-3333-333333333333', 5, '09:00', '18:00', true),

-- Formazione HSE Pro (Monday to Saturday, 8-19)
('44444444-4444-4444-4444-444444444444', 1, '08:00', '19:00', true),
('44444444-4444-4444-4444-444444444444', 2, '08:00', '19:00', true),
('44444444-4444-4444-4444-444444444444', 3, '08:00', '19:00', true),
('44444444-4444-4444-4444-444444444444', 4, '08:00', '19:00', true),
('44444444-4444-4444-4444-444444444444', 5, '08:00', '19:00', true),
('44444444-4444-4444-4444-444444444444', 6, '08:00', '17:00', true),

-- EcoConsult Ambiente (Monday to Friday, 9-17)
('55555555-5555-5555-5555-555555555555', 1, '09:00', '17:00', true),
('55555555-5555-5555-5555-555555555555', 2, '09:00', '17:00', true),
('55555555-5555-5555-5555-555555555555', 3, '09:00', '17:00', true),
('55555555-5555-5555-5555-555555555555', 4, '09:00', '17:00', true),
('55555555-5555-5555-5555-555555555555', 5, '09:00', '17:00', true);

-- Sample Bookings (Note: These will reference actual user IDs in production)
INSERT INTO bookings (
  service_id,
  client_id,
  provider_id,
  status,
  booking_date,
  start_time,
  end_time,
  duration_hours,
  location_type,
  location_street,
  location_city,
  location_province,
  location_postal_code,
  participants_count,
  base_amount,
  tax_amount,
  total_amount,
  payment_status,
  client_notes,
  special_requirements
) VALUES 
(
  (SELECT id FROM services WHERE slug = 'formazione-sicurezza-lavoratori'),
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'confirmed',
  CURRENT_DATE + INTERVAL '7 days',
  '09:00',
  '17:00',
  8.0,
  'on_site',
  'Via Roma 123',
  'Milano',
  'MI',
  '20121',
  12,
  1440.00, -- 120 * 12 participants
  316.80,  -- 22% VAT
  1756.80,
  'pending',
  'Formazione per operatori di produzione. Necessario certificato per ogni partecipante.',
  ARRAY['Aula con proiettore', 'Parcheggio per formatore', 'Pausa caffè inclusa']
),
(
  (SELECT id FROM services WHERE slug = 'documento-valutazione-rischi-dvr'),
  '22222222-2222-2222-2222-222222222222',
  '33333333-3333-3333-3333-333333333333',
  'pending',
  CURRENT_DATE + INTERVAL '14 days',
  '09:00',
  '17:00',
  8.0,
  'on_site',
  'Corso Torino 456',
  'Torino',
  'TO',
  '10128',
  1,
  800.00,
  176.00, -- 22% VAT
  976.00,
  'pending',
  'Azienda tecnologica con uffici e laboratorio. Necessaria valutazione rischi specifici per attività di R&D.',
  ARRAY['Accesso a tutte le aree', 'Documentazione esistente disponibile', 'Presenza RSPP durante sopralluogo']
);

-- Sample Reviews
INSERT INTO reviews (
  booking_id,
  reviewer_id,
  reviewed_id,
  service_id,
  rating,
  title,
  comment,
  communication_rating,
  quality_rating,
  timeliness_rating,
  professionalism_rating,
  verified
) VALUES 
(
  (SELECT id FROM bookings WHERE status = 'confirmed' LIMIT 1),
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  (SELECT id FROM services WHERE slug = 'formazione-sicurezza-lavoratori'),
  5,
  'Formazione eccellente e molto professionale',
  'Il corso è stato molto ben strutturato e il formatore estremamente competente. I nostri dipendenti hanno apprezzato molto l\'approccio pratico e gli esempi concreti. Materiale didattico di qualità e attestati rilasciati puntualmente.',
  5,
  5,
  5,
  5,
  true
);

-- Sample Notifications
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  booking_id,
  data
) VALUES 
(
  '44444444-4444-4444-4444-444444444444',
  'booking',
  'Nuova prenotazione ricevuta',
  'Hai ricevuto una nuova prenotazione per il servizio "Formazione Sicurezza Lavoratori"',
  (SELECT id FROM bookings WHERE status = 'confirmed' LIMIT 1),
  '{"booking_date": "2024-02-15", "client_company": "Acme Manufacturing S.r.l."}'
),
(
  '11111111-1111-1111-1111-111111111111',
  'booking',
  'Prenotazione confermata',
  'La tua prenotazione per "Formazione Sicurezza Lavoratori" è stata confermata',
  (SELECT id FROM bookings WHERE status = 'confirmed' LIMIT 1),
  '{"booking_date": "2024-02-15", "provider_name": "Formazione HSE Pro"}'
);

-- Update provider ratings based on reviews
UPDATE provider_profiles 
SET 
  rating_average = (
    SELECT AVG(rating::DECIMAL) 
    FROM reviews 
    WHERE reviewed_id = provider_profiles.user_id
  ),
  reviews_count = (
    SELECT COUNT(*) 
    FROM reviews 
    WHERE reviewed_id = provider_profiles.user_id
  )
WHERE user_id IN (
  SELECT DISTINCT reviewed_id FROM reviews
);