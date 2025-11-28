-- BookingHSE Real Seed Data
-- Dati realistici per popolamento database di produzione/sviluppo

-- =====================================================
-- NOTA IMPORTANTE
-- =====================================================
-- Questo file contiene dati di esempio realistici per BookingHSE.
-- Prima di eseguire questo script:
-- 1. Assicurati che lo schema (database/schema.sql) sia già stato applicato
-- 2. Sostituisci gli UUID con quelli reali degli utenti creati tramite Supabase Auth
-- 3. Modifica i dati secondo le tue esigenze specifiche

-- =====================================================
-- PROFILI CLIENT REALISTICI
-- =====================================================

-- Client 1: Azienda manifatturiera media
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
  legal_country,
  contact_person_name,
  contact_person_role,
  contact_person_email,
  contact_person_phone
) VALUES 
-- SOSTITUIRE CON UUID REALE DOPO REGISTRAZIONE UTENTE
(
  '11111111-1111-1111-1111-111111111111',
  'Meccanica Precision S.r.l.',
  'IT01234567890',
  'MCCPRC80A01H501A',
  'medium',
  'Meccanica di precisione',
  85,
  '+39 02 9876543',
  'https://www.meccanicaprecision.it',
  'Via delle Industrie 45',
  'Rho',
  'MI',
  '20017',
  'Italy',
  'Ing. Marco Alberti',
  'Responsabile HSE',
  'marco.alberti@meccanicaprecision.it',
  '+39 335 9876543'
),
-- Client 2: Azienda edile
(
  '22222222-2222-2222-2222-222222222222',
  'Costruzioni Moderne S.p.A.',
  'IT09876543210',
  'CSTMDN85B15F205B',
  'large',
  'Costruzioni e infrastrutture',
  220,
  '+39 011 5554321',
  'https://www.costruzionimoderne.it',
  'Corso Francia 234',
  'Torino',
  'TO',
  '10138',
  'Italy',
  'Dott.ssa Laura Bianchi',
  'Direttore HSE',
  'laura.bianchi@costruzionimoderne.it',
  '+39 347 5554321'
),
-- Client 3: Azienda alimentare
(
  '33333333-3333-3333-3333-333333333333',
  'FoodItaly S.r.l.',
  'IT11223344556',
  'FDTITL75C10F205C',
  'small',
  'Industria alimentare',
  35,
  '+39 051 7778899',
  'https://www.fooditaly.it',
  'Via Bologna 567',
  'Bologna',
  'BO',
  '40121',
  'Italy',
  'Dott. Giuseppe Verdi',
  'Quality Manager',
  'giuseppe.verdi@fooditaly.it',
  '+39 339 7778899'
);

-- =====================================================
-- PROFILI PROVIDER REALISTICI
-- =====================================================

-- Provider 1: Studio consulenza HSE completo
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
  country,
  latitude,
  longitude,
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
-- SOSTITUIRE CON UUID REALE DOPO REGISTRAZIONE UTENTE
(
  '44444444-4444-4444-4444-444444444444',
  'HSE Solutions Milano',
  'IT12345678901',
  'HSESOL80A01H501E',
  'Ordine Ingegneri Milano',
  'ING-MI-12345',
  '+39 02 5551234',
  'https://www.hsesolutions.it',
  'Studio di consulenza HSE con oltre 20 anni di esperienza. Specializzati in sicurezza sul lavoro, ambiente e qualità. Team multidisciplinare di ingegneri, medici del lavoro e consulenti ambientali.',
  20,
  12,
  'Via Brera 15',
  'Milano',
  'MI',
  '20121',
  'Italy',
  45.4642,
  9.1900,
  'Ing. Alessandro Rossi',
  'Titolare e Responsabile Tecnico',
  'alessandro.rossi@hsesolutions.it',
  '+39 335 5551234',
  ARRAY['Valutazione Rischi', 'DVR/DUVRI', 'ISO 45001', 'ISO 14001', 'Formazione Sicurezza', 'Audit HSE', 'Consulenza Ambientale'],
  ARRAY['Milano', 'Rho', 'Monza', 'Bergamo', 'Lombardia', 'Piemonte'],
  ARRAY['Italian', 'English'],
  4.8,
  67,
  true,
  NOW() - INTERVAL '8 months',
  false,
  48,
  'Cancellazione gratuita fino a 48 ore prima. Cancellazioni tardive comportano il 50% del costo per copertura spese organizzative.'
),
-- Provider 2: Centro formazione specializzato
(
  '55555555-5555-5555-5555-555555555555',
  'Academy Sicurezza Lombardia',
  'IT98765432109',
  'ACDSCR85B15F205F',
  'Ente Accreditato Regione Lombardia',
  'ACC-LO-67890',
  '+39 02 7778899',
  'https://www.academysicurezza.it',
  'Centro di formazione accreditato specializzato in corsi di sicurezza sul lavoro. Oltre 15 anni di esperienza nella formazione aziendale con docenti qualificati e aule attrezzate.',
  15,
  18,
  'Via Garibaldi 88',
  'Rho',
  'MI',
  '20017',
  'Italy',
  45.5264,
  9.0420,
  'Dott.ssa Maria Neri',
  'Direttore Didattico',
  'maria.neri@academysicurezza.it',
  '+39 348 7778899',
  ARRAY['Formazione Sicurezza', 'Corsi Antincendio', 'Primo Soccorso', 'Spazi Confinati', 'Lavori in Quota', 'Formazione Dirigenti e Preposti'],
  ARRAY['Rho', 'Milano', 'Lombardia', 'Piemonte', 'Veneto'],
  ARRAY['Italian', 'English', 'Spanish'],
  4.9,
  134,
  true,
  NOW() - INTERVAL '6 months',
  true,
  24,
  'Cancellazione gratuita fino a 24 ore prima. Cancellazioni tardive comportano il 30% del costo per copertura spese organizzative.'
),
-- Provider 3: Medico competente
(
  '66666666-6666-6666-6666-666666666666',
  'Studio Medico del Lavoro Dr. Colombo',
  'IT33445566778',
  'CLMMDC70D15F205G',
  'Ordine Medici Milano',
  'MED-MI-54321',
  '+39 02 3334455',
  'https://www.studiomedicolavoro.it',
  'Studio medico specializzato in medicina del lavoro e sorveglianza sanitaria. Medico competente qualificato per tutti i settori produttivi con esperienza ventennale.',
  25,
  6,
  'Viale Monza 234',
  'Milano',
  'MI',
  '20125',
  'Italy',
  45.4953,
  9.2187,
  'Dott. Roberto Colombo',
  'Medico Competente',
  'roberto.colombo@studiomedicolavoro.it',
  '+39 339 3334455',
  ARRAY['Medicina del Lavoro', 'Sorveglianza Sanitaria', 'Visite Mediche Periodiche', 'Stress Lavoro-Correlato', 'Ergonomia'],
  ARRAY['Milano', 'Rho', 'Lombardia'],
  ARRAY['Italian', 'English'],
  4.9,
  89,
  true,
  NOW() - INTERVAL '12 months',
  true,
  48,
  'Cancellazione gratuita fino a 48 ore prima per visite mediche. Cancellazioni tardive comportano il 80% del costo.'
),
-- Provider 4: Consulente ambientale
(
  '77777777-7777-7777-7777-777777777777',
  'EcoConsult Ambiente',
  'IT77889900112',
  'ECOCNS85E15F205H',
  'Ordine Chimici Lombardia',
  'CHI-LO-98765',
  '+39 02 1112233',
  'https://www.ecoconsultambiente.it',
  'Consulenza ambientale specializzata in autorizzazioni, gestione rifiuti e certificazioni ambientali. Partner certificato per ISO 14001 e consulenze VIA/VAS.',
  18,
  8,
  'Via Dante 456',
  'Milano',
  'MI',
  '20123',
  'Italy',
  45.4654,
  9.1859,
  'Dott. Marco Blu',
  'Consulente Ambientale Senior',
  'marco.blu@ecoconsultambiente.it',
  '+39 348 1112233',
  ARRAY['Gestione Rifiuti', 'Autorizzazioni Ambientali', 'ISO 14001', 'VIA/VAS', 'Bonifiche', 'Monitoraggi Ambientali'],
  ARRAY['Milano', 'Lombardia', 'Piemonte', 'Veneto'],
  ARRAY['Italian', 'English', 'French'],
  4.7,
  52,
  true,
  NOW() - INTERVAL '10 months',
  false,
  72,
  'Cancellazione gratuita fino a 72 ore prima per sopralluoghi. Cancellazioni tardive comportano il 100% del costo per copertura spese tecniche.'
);

-- =====================================================
-- SERVIZI REALISTICI
-- =====================================================

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
-- Servizi HSE Solutions Milano
(
  '44444444-4444-4444-4444-444444444444',
  'Documento di Valutazione dei Rischi (DVR) Completo',
  'Redazione completa del Documento di Valutazione dei Rischi secondo D.Lgs. 81/08. Include sopralluogo approfondito, analisi di tutti i rischi presenti, misure di prevenzione e protezione, programma di miglioramento con scadenze.',
  'workplace_safety',
  'Valutazione Rischi',
  'on_request',
  'on_site',
  1200.00,
  'fixed',
  12.0,
  NULL,
  1,
  ARRAY['Milano', 'Rho', 'Monza', 'Bergamo', 'Lombardia'],
  ARRAY['Accesso completo ai luoghi di lavoro', 'Documentazione aziendale esistente', 'Disponibilità del datore di lavoro e RSPP', 'Organigramma aziendale aggiornato'],
  ARRAY['DVR completo conforme D.Lgs. 81/08', 'Relazione tecnica dettagliata', 'Programma di miglioramento con scadenze', 'Supporto telefonico per 12 mesi', 'Aggiornamento gratuito per modifiche minori'],
  ARRAY['DVR', 'Sicurezza', 'D.Lgs 81/08', 'Valutazione Rischi', 'Consulenza'],
  true,
  true,
  'dvr-completo-dlgs-81-08'
),
(
  '44444444-4444-4444-4444-444444444444',
  'Audit Sistema di Gestione ISO 45001',
  'Audit completo del Sistema di Gestione per la Salute e Sicurezza sul Lavoro secondo ISO 45001:2018. Include gap analysis, audit documentale, audit sul campo e piano di miglioramento.',
  'consultation_management',
  'Audit e Certificazioni',
  'on_request',
  'on_site',
  1800.00,
  'daily',
  16.0,
  NULL,
  1,
  ARRAY['Milano', 'Lombardia', 'Piemonte'],
  ARRAY['Sistema di gestione SGSSL esistente', 'Documentazione del sistema', 'Disponibilità del management', 'Accesso a tutti i processi aziendali'],
  ARRAY['Rapporto di audit dettagliato', 'Gap analysis con priorità', 'Piano di miglioramento', 'Supporto per implementazione azioni correttive'],
  ARRAY['ISO 45001', 'Audit', 'Sistema Gestione', 'Certificazione', 'SGSSL'],
  true,
  true,
  'audit-iso-45001-sistema-gestione'
),

-- Servizi Academy Sicurezza Lombardia
(
  '55555555-5555-5555-5555-555555555555',
  'Formazione Sicurezza Lavoratori - Generale e Specifica',
  'Corso di formazione per lavoratori secondo Accordo Stato-Regioni del 21/12/2011. Include formazione generale (4 ore) e specifica in base al livello di rischio aziendale (4-8-12 ore). Rilascio attestato valido su tutto il territorio nazionale.',
  'training_education',
  'Formazione Obbligatoria',
  'instant',
  'flexible',
  85.00,
  'per_participant',
  8.0,
  30,
  8,
  ARRAY['Rho', 'Milano', 'Lombardia', 'Piemonte'],
  ARRAY['Aula attrezzata con proiettore', 'Elenco partecipanti con dati anagrafici', 'Registro presenze', 'Connessione internet per piattaforma e-learning'],
  ARRAY['Attestato di formazione nominativo', 'Materiale didattico digitale', 'Registro formazione aggiornato', 'Test di verifica apprendimento', 'Supporto post-corso'],
  ARRAY['Formazione', 'Sicurezza', 'Accordo Stato-Regioni', 'Lavoratori', 'Attestato'],
  true,
  false,
  'formazione-sicurezza-lavoratori-generale-specifica'
),
(
  '55555555-5555-5555-5555-555555555555',
  'Corso Antincendio Rischio Medio con Prova Pratica',
  'Corso di formazione antincendio per addetti alle emergenze in attività a rischio medio secondo D.M. 02/09/2021. Include teoria (5 ore) e prova pratica con estintori (3 ore). Validità 5 anni.',
  'training_education',
  'Formazione Specialistica',
  'scheduled',
  'on_site',
  150.00,
  'per_participant',
  8.0,
  20,
  6,
  ARRAY['Rho', 'Milano', 'Lombardia'],
  ARRAY['Area esterna per esercitazioni pratiche', 'Estintori per prove pratiche', 'Aula per parte teorica', 'Autorizzazioni per uso estintori'],
  ARRAY['Attestato antincendio valido 5 anni', 'Manuale antincendio personalizzato', 'Esercitazioni pratiche certificate', 'Registro formazione', 'Promemoria scadenza'],
  ARRAY['Antincendio', 'Emergenze', 'Addetti Antincendio', 'D.M. 02/09/2021', 'Prova Pratica'],
  true,
  true,
  'corso-antincendio-rischio-medio-prova-pratica'
),

-- Servizi Studio Medico del Lavoro
(
  '66666666-6666-6666-6666-666666666666',
  'Sorveglianza Sanitaria Completa',
  'Servizio completo di sorveglianza sanitaria secondo D.Lgs. 81/08. Include visite mediche preventive, periodiche e a richiesta, gestione cartelle sanitarie e di rischio, giudizi di idoneità.',
  'occupational_health',
  'Medicina del Lavoro',
  'on_request',
  'flexible',
  120.00,
  'per_participant',
  1.0,
  50,
  1,
  ARRAY['Milano', 'Rho', 'Lombardia'],
  ARRAY['Elenco mansioni e rischi', 'Protocollo sanitario definito', 'Spazi idonei per visite mediche', 'Documentazione sanitaria precedente'],
  ARRAY['Visite mediche complete', 'Cartelle sanitarie e di rischio', 'Giudizi di idoneità', 'Relazione sanitaria annuale', 'Consulenza medica continuativa'],
  ARRAY['Medico Competente', 'Sorveglianza Sanitaria', 'Visite Mediche', 'Idoneità Lavorativa'],
  true,
  false,
  'sorveglianza-sanitaria-completa'
),
(
  '66666666-6666-6666-6666-666666666666',
  'Valutazione Stress Lavoro-Correlato',
  'Valutazione completa del rischio stress lavoro-correlato secondo D.Lgs. 81/08 e indicazioni INAIL. Include analisi preliminare, eventuale approfondimento e piano di miglioramento.',
  'occupational_health',
  'Valutazioni Specialistiche',
  'on_request',
  'on_site',
  800.00,
  'fixed',
  8.0,
  NULL,
  1,
  ARRAY['Milano', 'Lombardia'],
  ARRAY['Collaborazione RSPP e RLS', 'Dati organizzativi aziendali', 'Disponibilità per interviste ai lavoratori', 'Documentazione gestione del personale'],
  ARRAY['Relazione valutazione stress', 'Questionari di valutazione', 'Piano di miglioramento', 'Formazione specifica per management'],
  ARRAY['Stress Lavoro-Correlato', 'Benessere Organizzativo', 'Valutazione Psicosociale'],
  true,
  false,
  'valutazione-stress-lavoro-correlato'
),

-- Servizi EcoConsult Ambiente
(
  '77777777-7777-7777-7777-777777777777',
  'Gestione Completa Rifiuti Aziendali',
  'Servizio completo per la gestione dei rifiuti aziendali: classificazione, codici CER, registri di carico/scarico, MUD, contratti con trasportatori autorizzati e consulenza normativa continuativa.',
  'environment',
  'Gestione Rifiuti',
  'on_request',
  'on_site',
  600.00,
  'fixed',
  4.0,
  NULL,
  1,
  ARRAY['Milano', 'Lombardia', 'Piemonte'],
  ARRAY['Elenco tipologie rifiuti prodotti', 'Planimetrie aziendali', 'Contratti attuali gestione rifiuti', 'Accesso alle aree di stoccaggio'],
  ARRAY['Piano gestione rifiuti personalizzato', 'Registri carico/scarico aggiornati', 'Contratti trasportatori qualificati', 'Formazione personale', 'Assistenza MUD annuale'],
  ARRAY['Gestione Rifiuti', 'Codici CER', 'MUD', 'Ambiente', 'Normativa Rifiuti'],
  true,
  false,
  'gestione-completa-rifiuti-aziendali'
),
(
  '77777777-7777-7777-7777-777777777777',
  'Certificazione ISO 14001 - Sistema Gestione Ambientale',
  'Consulenza completa per ottenere la certificazione ISO 14001:2015. Include gap analysis, implementazione sistema, formazione personale e supporto durante audit di certificazione.',
  'environment',
  'Certificazioni Ambientali',
  'on_request',
  'on_site',
  2500.00,
  'fixed',
  40.0,
  NULL,
  1,
  ARRAY['Milano', 'Lombardia', 'Veneto'],
  ARRAY['Impegno del management', 'Team di lavoro dedicato', 'Accesso a tutti i processi aziendali', 'Documentazione ambientale esistente'],
  ARRAY['Sistema di Gestione Ambientale completo', 'Manuale e procedure operative', 'Formazione team interno', 'Supporto durante audit di certificazione', 'Mantenimento certificazione primo anno'],
  ARRAY['ISO 14001', 'Sistema Gestione Ambientale', 'Certificazione', 'Ambiente', 'SGA'],
  true,
  true,
  'certificazione-iso-14001-sistema-gestione-ambientale'
);

-- =====================================================
-- CERTIFICAZIONI PROVIDER
-- =====================================================

INSERT INTO certifications (
  provider_id,
  name,
  issuing_organization,
  issue_date,
  expiry_date,
  certificate_number,
  verified
) VALUES 
-- Certificazioni HSE Solutions Milano
(
  '44444444-4444-4444-4444-444444444444',
  'Laurea in Ingegneria della Sicurezza',
  'Politecnico di Milano',
  '2003-07-15',
  NULL,
  'ING-SICUR-2003-1234',
  true
),
(
  '44444444-4444-4444-4444-444444444444',
  'Abilitazione Coordinatore Sicurezza nei Cantieri',
  'Ordine Ingegneri Milano',
  '2005-03-20',
  '2025-03-20',
  'COORD-SIC-2005-5678',
  true
),
(
  '44444444-4444-4444-4444-444444444444',
  'Lead Auditor ISO 45001:2018',
  'IRCA International',
  '2019-09-10',
  '2025-09-10',
  'IRCA-45001-2019-9012',
  true
),

-- Certificazioni Academy Sicurezza Lombardia
(
  '55555555-5555-5555-5555-555555555555',
  'Accreditamento Regionale per Formazione',
  'Regione Lombardia',
  '2018-01-15',
  '2025-01-15',
  'ACC-FORM-2018-3456',
  true
),
(
  '55555555-5555-5555-5555-555555555555',
  'Qualifica Formatore per la Sicurezza',
  'Regione Lombardia',
  '2017-05-20',
  '2025-05-20',
  'FORM-SIC-2017-7890',
  true
),

-- Certificazioni Studio Medico
(
  '66666666-6666-6666-6666-666666666666',
  'Specializzazione in Medicina del Lavoro',
  'Università Statale Milano',
  '2000-11-30',
  NULL,
  'SPEC-MEDLAV-2000-1111',
  true
),
(
  '66666666-6666-6666-6666-666666666666',
  'Iscrizione Albo Medici Competenti',
  'Ministero della Salute',
  '2001-06-15',
  '2026-06-15',
  'MEDCOMP-2001-2222',
  true
),

-- Certificazioni EcoConsult
(
  '77777777-7777-7777-7777-777777777777',
  'Esperto Ambientale Qualificato',
  'Ordine Chimici Lombardia',
  '2010-03-12',
  NULL,
  'AMB-QUAL-2010-3333',
  true
),
(
  '77777777-7777-7777-7777-777777777777',
  'Lead Auditor ISO 14001:2015',
  'IRCA International',
  '2020-11-25',
  '2026-11-25',
  'IRCA-14001-2020-4444',
  true
);

-- =====================================================
-- SLOT DI DISPONIBILITÀ
-- =====================================================

-- Disponibilità HSE Solutions Milano (Lunedì-Venerdì 9-18)
INSERT INTO availability_slots (
  provider_id,
  day_of_week,
  start_time,
  end_time,
  available
) VALUES 
('44444444-4444-4444-4444-444444444444', 1, '09:00', '18:00', true),
('44444444-4444-4444-4444-444444444444', 2, '09:00', '18:00', true),
('44444444-4444-4444-4444-444444444444', 3, '09:00', '18:00', true),
('44444444-4444-4444-4444-444444444444', 4, '09:00', '18:00', true),
('44444444-4444-4444-4444-444444444444', 5, '09:00', '18:00', true),

-- Disponibilità Academy Sicurezza (Lunedì-Sabato 8-19)
('55555555-5555-5555-5555-555555555555', 1, '08:00', '19:00', true),
('55555555-5555-5555-5555-555555555555', 2, '08:00', '19:00', true),
('55555555-5555-5555-5555-555555555555', 3, '08:00', '19:00', true),
('55555555-5555-5555-5555-555555555555', 4, '08:00', '19:00', true),
('55555555-5555-5555-5555-555555555555', 5, '08:00', '19:00', true),
('55555555-5555-5555-5555-555555555555', 6, '08:00', '17:00', true),

-- Disponibilità Studio Medico (Lunedì-Venerdì 9-17)
('66666666-6666-6666-6666-666666666666', 1, '09:00', '17:00', true),
('66666666-6666-6666-6666-666666666666', 2, '09:00', '17:00', true),
('66666666-6666-6666-6666-666666666666', 3, '09:00', '17:00', true),
('66666666-6666-6666-6666-666666666666', 4, '09:00', '17:00', true),
('66666666-6666-6666-6666-666666666666', 5, '09:00', '17:00', true),

-- Disponibilità EcoConsult (Lunedì-Venerdì 9-18)
('77777777-7777-7777-7777-777777777777', 1, '09:00', '18:00', true),
('77777777-7777-7777-7777-777777777777', 2, '09:00', '18:00', true),
('77777777-7777-7777-7777-777777777777', 3, '09:00', '18:00', true),
('77777777-7777-7777-7777-777777777777', 4, '09:00', '18:00', true),
('77777777-7777-7777-7777-777777777777', 5, '09:00', '18:00', true);

-- =====================================================
-- PRENOTAZIONI DI ESEMPIO
-- =====================================================

-- Prenotazione 1: DVR per azienda meccanica
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
  (SELECT id FROM services WHERE slug = 'dvr-completo-dlgs-81-08'),
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'confirmed',
  CURRENT_DATE + INTERVAL '10 days',
  '09:00',
  '17:00',
  8.0,
  'on_site',
  'Via delle Industrie 45',
  'Rho',
  'MI',
  '20017',
  1,
  1200.00,
  264.00, -- 22% IVA
  1464.00,
  'pending',
  'Azienda meccanica con 85 dipendenti. Necessaria valutazione rischi per nuovi macchinari installati. Richiesta urgenza per scadenza normativa.',
  ARRAY['Accesso anticipato alle 8:30', 'Presenza RSPP durante sopralluogo', 'Documentazione tecnica macchinari disponibile']
),

-- Prenotazione 2: Formazione per azienda edile
(
  (SELECT id FROM services WHERE slug = 'formazione-sicurezza-lavoratori-generale-specifica'),
  '22222222-2222-2222-2222-222222222222',
  '55555555-5555-5555-5555-555555555555',
  'pending',
  CURRENT_DATE + INTERVAL '14 days',
  '08:30',
  '17:30',
  8.0,
  'on_site',
  'Corso Francia 234',
  'Torino',
  'TO',
  '10138',
  25,
  2125.00, -- 85 * 25 partecipanti
  467.50,  -- 22% IVA
  2592.50,
  'pending',
  'Formazione per nuovi assunti nel settore edile. Necessario rilascio attestati entro fine mese per conformità cantieri.',
  ARRAY['Aula con 30 posti', 'Proiettore e sistema audio', 'Pausa caffè inclusa', 'Parcheggio per formatore']
);

-- =====================================================
-- RECENSIONI REALISTICHE
-- =====================================================

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
-- Recensione per HSE Solutions Milano
(
  (SELECT id FROM bookings WHERE status = 'confirmed' AND provider_id = '44444444-4444-4444-4444-444444444444' LIMIT 1),
  '11111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  (SELECT id FROM services WHERE slug = 'dvr-completo-dlgs-81-08'),
  5,
  'Servizio eccellente e molto professionale',
  'HSE Solutions Milano ha svolto un lavoro impeccabile per la redazione del nostro DVR. Il sopralluogo è stato molto approfondito, hanno analizzato ogni aspetto della nostra produzione e fornito soluzioni pratiche e realizzabili. Documentazione completa e conforme, consegna nei tempi previsti. Altamente raccomandati per professionalità e competenza tecnica.',
  5,
  5,
  5,
  5,
  true
),

-- Recensione per Academy Sicurezza Lombardia
(
  (SELECT id FROM bookings WHERE status = 'pending' AND provider_id = '55555555-5555-5555-5555-555555555555' LIMIT 1),
  '22222222-2222-2222-2222-222222222222',
  '55555555-5555-5555-5555-555555555555',
  (SELECT id FROM services WHERE slug = 'formazione-sicurezza-lavoratori-generale-specifica'),
  5,
  'Formazione di alta qualità',
  'Corso molto ben strutturato e coinvolgente. I formatori sono estremamente competenti e hanno saputo rendere interessanti anche gli argomenti più tecnici. Materiale didattico di qualità e attestati rilasciati puntualmente. I nostri operai hanno apprezzato molto l\'approccio pratico con esempi concreti del nostro settore.',
  5,
  5,
  4,
  5,
  true
);

-- =====================================================
-- NOTIFICHE DI ESEMPIO
-- =====================================================

INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  booking_id,
  data
) VALUES 
-- Notifica per provider
(
  '44444444-4444-4444-4444-444444444444',
  'booking',
  'Nuova prenotazione ricevuta',
  'Hai ricevuto una nuova prenotazione per "DVR Completo" da Meccanica Precision S.r.l.',
  (SELECT id FROM bookings WHERE provider_id = '44444444-4444-4444-4444-444444444444' LIMIT 1),
  '{"booking_date": "' || (CURRENT_DATE + INTERVAL '10 days') || '", "client_company": "Meccanica Precision S.r.l.", "service_value": "€1.464"}'
),

-- Notifica per client
(
  '11111111-1111-1111-1111-111111111111',
  'booking',
  'Prenotazione confermata',
  'La tua prenotazione per "DVR Completo" è stata confermata da HSE Solutions Milano',
  (SELECT id FROM bookings WHERE client_id = '11111111-1111-1111-1111-111111111111' LIMIT 1),
  '{"booking_date": "' || (CURRENT_DATE + INTERVAL '10 days') || '", "provider_name": "HSE Solutions Milano", "next_step": "Preparare documentazione richiesta"}'
);

-- =====================================================
-- AGGIORNAMENTO RATING PROVIDER
-- =====================================================

-- Aggiorna i rating dei provider basandosi sulle recensioni inserite
UPDATE provider_profiles 
SET 
  rating_average = (
    SELECT COALESCE(AVG(rating::DECIMAL), 0) 
    FROM reviews 
    WHERE reviewed_id = provider_profiles.user_id
  ),
  reviews_count = (
    SELECT COUNT(*) 
    FROM reviews 
    WHERE reviewed_id = provider_profiles.user_id
  )
WHERE user_id IN (
  SELECT DISTINCT reviewed_id FROM reviews WHERE reviewed_id IS NOT NULL
);

-- =====================================================
-- ISTRUZIONI PER L'USO
-- =====================================================

/*
ISTRUZIONI PER UTILIZZARE QUESTI DATI:

1. PREREQUISITI:
   - Schema database già applicato (database/schema.sql)
   - Progetto Supabase configurato e funzionante

2. SOSTITUZIONE UUID:
   - Gli UUID in questo file sono fittizi
   - Prima di eseguire, sostituisci con UUID reali di utenti creati tramite Supabase Auth
   - Puoi creare gli utenti manualmente o tramite gli script forniti

3. ESECUZIONE:
   - Copia e incolla questo script nel SQL Editor di Supabase
   - Esegui sezione per sezione per verificare eventuali errori
   - Controlla che tutti i dati siano stati inseriti correttamente

4. VERIFICA:
   - Controlla le tabelle nel Table Editor di Supabase
   - Verifica che i conteggi corrispondano:
     * 3 client_profiles
     * 4 provider_profiles  
     * 6 services
     * 8 certifications
     * 2 bookings
     * 2 reviews
     * 2 notifications

5. PERSONALIZZAZIONE:
   - Modifica i dati secondo le tue esigenze
   - Aggiungi più fornitori, servizi o prenotazioni
   - Aggiorna prezzi e descrizioni secondo il mercato locale

6. TESTING:
   - Usa questi dati per testare ricerche, prenotazioni e dashboard
   - Verifica che tutti i filtri funzionino correttamente
   - Testa il flusso completo di prenotazione

Per maggiori dettagli consulta DATABASE_SETUP.md
*/