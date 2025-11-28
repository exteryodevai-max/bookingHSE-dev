#!/usr/bin/env node

/**
 * Script per popolare automaticamente il database con dati realistici
 * Utilizza il client Supabase per inserire dati di esempio
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Carica le variabili d'ambiente dal file .env
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        envVars[key.trim()] = value.trim().replace(/["']/g, '');
      }
    });
    
    return envVars;
  } catch (error) {
    console.error('❌ Errore lettura file .env:', error.message);
    return {};
  }
}

const env = loadEnvFile();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_KEY;
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Errore: Variabili d\'ambiente Supabase mancanti!');
  console.log('Assicurati che .env contenga:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  console.log('- SUPABASE_SERVICE_KEY (necessaria per operazioni admin)');
  process.exit(1);
}

// Inizializza il client Supabase
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Client admin per operazioni che richiedono privilegi elevati
const supabaseAdmin = SUPABASE_SERVICE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

/**
 * Dati realistici per il popolamento
 */
const sampleData = {
  // Utenti di test con credenziali
  users: [
    {
      email: 'mario.alberti@meccanicaprecision.it',
      password: 'SecurePass123!',
      user_type: 'client',
      profile: {
        company_name: 'Meccanica Precision S.r.l.',
        vat_number: 'IT01234567890',
        fiscal_code: 'MCCPRC80A01H501A',
        company_size: 'medium',
        industry_sector: 'Meccanica di precisione',
        employees_count: 85,
        phone: '+39 02 9876543',
        website: 'https://www.meccanicaprecision.it',
        legal_street: 'Via delle Industrie 45',
        legal_city: 'Rho',
        legal_province: 'MI',
        legal_postal_code: '20017',
        legal_country: 'Italy',
        contact_person_name: 'Ing. Marco Alberti',
        contact_person_role: 'Responsabile HSE',
        contact_person_email: 'mario.alberti@meccanicaprecision.it',
        contact_person_phone: '+39 335 9876543'
      }
    },
    {
      email: 'alessandro.rossi@hsesolutions.it',
      password: 'SecurePass123!',
      user_type: 'provider',
      profile: {
        business_name: 'HSE Solutions Milano',
        vat_number: 'IT12345678901',
        fiscal_code: 'HSESOL80A01H501E',
        professional_order: 'Ordine Ingegneri Milano',
        registration_number: 'ING-MI-12345',
        phone: '+39 02 5551234',
        website: 'https://www.hsesolutions.it',
        description: 'Studio di consulenza HSE con oltre 20 anni di esperienza. Specializzati in sicurezza sul lavoro, ambiente e qualità.',
        experience_years: 20,
        team_size: 12,
        street: 'Via Brera 15',
        city: 'Milano',
        province: 'MI',
        postal_code: '20121',
        country: 'Italy',
        latitude: 45.4642,
        longitude: 9.1900,
        contact_person_name: 'Ing. Alessandro Rossi',
        contact_person_role: 'Titolare e Responsabile Tecnico',
        contact_person_email: 'alessandro.rossi@hsesolutions.it',
        contact_person_phone: '+39 335 5551234',
        specializations: ['Valutazione Rischi', 'DVR/DUVRI', 'ISO 45001', 'ISO 14001', 'Formazione Sicurezza'],
        service_areas: ['Milano', 'Rho', 'Monza', 'Bergamo', 'Lombardia'],
        languages: ['Italian', 'English'],
        rating_average: 4.8,
        reviews_count: 67,
        verified: true,
        auto_accept_bookings: false,
        advance_notice_hours: 48,
        cancellation_policy: 'Cancellazione gratuita fino a 48 ore prima.'
      }
    },
    {
      email: 'maria.neri@academysicurezza.it',
      password: 'SecurePass123!',
      user_type: 'provider',
      profile: {
        business_name: 'Academy Sicurezza Lombardia',
        vat_number: 'IT98765432109',
        fiscal_code: 'ACDSCR85B15F205F',
        professional_order: 'Ente Accreditato Regione Lombardia',
        registration_number: 'ACC-LO-67890',
        phone: '+39 02 7778899',
        website: 'https://www.academysicurezza.it',
        description: 'Centro di formazione accreditato specializzato in corsi di sicurezza sul lavoro.',
        experience_years: 15,
        team_size: 18,
        street: 'Via Garibaldi 88',
        city: 'Rho',
        province: 'MI',
        postal_code: '20017',
        country: 'Italy',
        latitude: 45.5264,
        longitude: 9.0420,
        contact_person_name: 'Dott.ssa Maria Neri',
        contact_person_role: 'Direttore Didattico',
        contact_person_email: 'maria.neri@academysicurezza.it',
        contact_person_phone: '+39 348 7778899',
        specializations: ['Formazione Sicurezza', 'Corsi Antincendio', 'Primo Soccorso'],
        service_areas: ['Rho', 'Milano', 'Lombardia'],
        languages: ['Italian', 'English'],
        rating_average: 4.9,
        reviews_count: 134,
        verified: true,
        auto_accept_bookings: true,
        advance_notice_hours: 24,
        cancellation_policy: 'Cancellazione gratuita fino a 24 ore prima.'
      }
    }
  ],

  // Servizi di esempio
  services: [
    {
      title: 'Documento di Valutazione dei Rischi (DVR) Completo',
      description: 'Redazione completa del DVR secondo D.Lgs. 81/08 con sopralluogo e analisi approfondita',
      category: 'workplace_safety',
      subcategory: 'Valutazione Rischi',
      service_type: 'on_request',
      location_type: 'on_site',
      base_price: 1200.00,
      pricing_unit: 'fixed',
      duration_hours: 12.0,
      service_areas: ['Milano', 'Rho', 'Lombardia'],
      requirements: ['Accesso luoghi di lavoro', 'Documentazione aziendale'],
      deliverables: ['DVR completo', 'Relazione tecnica', 'Programma miglioramento'],
      tags: ['DVR', 'Sicurezza', 'D.Lgs 81/08'],
      active: true,
      featured: true,
      slug: 'dvr-completo-dlgs-81-08'
    },
    {
      title: 'Formazione Sicurezza Lavoratori - Generale e Specifica',
      description: 'Corso completo secondo Accordo Stato-Regioni con rilascio attestato',
      category: 'training_education',
      subcategory: 'Formazione Obbligatoria',
      service_type: 'instant',
      location_type: 'flexible',
      base_price: 85.00,
      pricing_unit: 'per_participant',
      duration_hours: 8.0,
      max_participants: 30,
      min_participants: 8,
      service_areas: ['Rho', 'Milano', 'Lombardia'],
      requirements: ['Aula attrezzata', 'Elenco partecipanti'],
      deliverables: ['Attestato formazione', 'Materiale didattico'],
      tags: ['Formazione', 'Sicurezza', 'Lavoratori'],
      active: true,
      featured: false,
      slug: 'formazione-sicurezza-lavoratori'
    }
  ]
};

/**
 * Crea un utente usando l'autenticazione di Supabase
 */
async function createUser(userData) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          user_type: userData.user_type
        }
      }
    });
    
    if (authError) {
      throw new Error(`Errore creazione utente: ${authError.message}`);
    }
    
    return authData.user;
  } catch (error) {
    console.error(`Errore creazione utente ${userData.email}:`, error.message);
    return null;
  }
}

/**
 * Inserisce un profilo cliente
 */
async function insertClientProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('client_profiles')
      .insert({
        user_id: userId,
        ...profileData
      })
      .select();
      
    if (error) {
      throw new Error(`Errore inserimento profilo cliente: ${error.message}`);
    }
    
    return data[0];
  } catch (error) {
    console.error('Errore inserimento profilo cliente:', error.message);
    return null;
  }
}

/**
 * Inserisce un profilo fornitore
 */
async function insertProviderProfile(userId, profileData) {
  try {
    const { data, error } = await supabase
      .from('provider_profiles')
      .insert({
        user_id: userId,
        ...profileData
      })
      .select();
      
    if (error) {
      throw new Error(`Errore inserimento profilo fornitore: ${error.message}`);
    }
    
    return data[0];
  } catch (error) {
    console.error('Errore inserimento profilo fornitore:', error.message);
    return null;
  }
}

/**
 * Inserisce servizi per un provider
 */
async function insertServices(providerId, services) {
  const insertedServices = [];
  
  for (const serviceData of services) {
    try {
      const { data, error } = await supabase
        .from('services')
        .insert({
          provider_id: providerId,
          ...serviceData
        })
        .select();
        
      if (error) {
        console.error(`Errore inserimento servizio ${serviceData.title}:`, error.message);
      } else {
        insertedServices.push(data[0]);
        console.log(`✅ Servizio creato: ${serviceData.title}`);
      }
    } catch (error) {
      console.error(`Errore inserimento servizio ${serviceData.title}:`, error.message);
    }
  }
  
  return insertedServices;
}

/**
 * Funzione principale
 */
async function main() {
  console.log('🚀 Avvio popolamento database con dati realistici...');
  console.log(`📡 Connessione a: ${SUPABASE_URL}`);
  
  try {
    let clientsCreated = 0;
    let providersCreated = 0;
    let servicesCreated = 0;
    const userIds = {};
    
    console.log(`\n📝 Creazione di ${sampleData.users.length} utenti...`);
    
    // Crea utenti e profili
    for (let i = 0; i < sampleData.users.length; i++) {
      const userData = sampleData.users[i];
      console.log(`\n👤 Creazione utente ${i + 1}/${sampleData.users.length}: ${userData.email}`);
      
      // Delay per evitare rate limiting
      if (i > 0) {
        console.log('⏳ Attesa 5 secondi per evitare rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
      try {
        // Crea l'utente
        const user = await createUser(userData);
        if (!user) continue;
        
        const userId = user.id;
        userIds[userData.email] = userId;
        console.log(`✅ Utente creato con ID: ${userId}`);
        
        // Autentica l'utente per permettere l'inserimento del profilo
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: userData.password
        });
        
        if (signInError) {
          console.log(`⚠️ Impossibile autenticare ${userData.email}, salto creazione profilo`);
          continue;
        }
        
        // Attende per permettere ai trigger del database di completarsi
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Inserisce il profilo appropriato
        if (userData.user_type === 'client') {
          const profile = await insertClientProfile(userId, userData.profile);
          if (profile) {
            console.log(`✅ Profilo cliente creato per: ${userData.profile.company_name}`);
            clientsCreated++;
          }
        } else if (userData.user_type === 'provider') {
          const profile = await insertProviderProfile(userId, userData.profile);
          if (profile) {
            console.log(`✅ Profilo fornitore creato per: ${userData.profile.business_name}`);
            providersCreated++;
            
            // Crea servizi per questo provider
            const providerServices = sampleData.services.filter(s => 
              (userData.profile.business_name.includes('HSE Solutions') && s.slug === 'dvr-completo-dlgs-81-08') ||
              (userData.profile.business_name.includes('Academy') && s.slug === 'formazione-sicurezza-lavoratori')
            );
            
            if (providerServices.length > 0) {
              const services = await insertServices(userId, providerServices);
              servicesCreated += services.length;
            }
          }
        }
        
        // Disconnette l'utente
        await supabase.auth.signOut();
        
      } catch (userError) {
        console.error(`❌ Errore creazione utente ${userData.email}:`, userError.message);
      }
    }
    
    console.log('\n✅ Popolamento completato!');
    console.log('\n📊 Riepilogo dati creati:');
    console.log(`   • ${clientsCreated} Profili Cliente`);
    console.log(`   • ${providersCreated} Profili Fornitore`);
    console.log(`   • ${servicesCreated} Servizi`);
    console.log(`   • ${clientsCreated + providersCreated} Utenti Totali`);
    
    console.log('\n📧 Credenziali di accesso create:');
    sampleData.users.forEach(user => {
      console.log(`   • ${user.email} - Password: ${user.password} (${user.user_type})`);
    });
    
    console.log('\n🎯 Prossimi passi:');
    console.log('1. Testa il login con le credenziali sopra');
    console.log('2. Verifica che i profili siano completi');
    console.log('3. Testa la ricerca servizi (es. "DVR" a "Rho")');
    console.log('4. Prova a creare una prenotazione');
    console.log('5. Aggiungi più dati se necessario');
    
  } catch (error) {
    console.error('❌ Errore durante il popolamento:', error.message);
    process.exit(1);
  }
}

// Esegue lo script
if (require.main === module) {
  main();
}

module.exports = { main };