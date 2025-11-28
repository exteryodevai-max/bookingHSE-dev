#!/usr/bin/env node

/**
 * Script per importare utenti di test nel database Supabase
 * Utilizza il client Supabase per inserire dati di test
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
 * Dati di test predefiniti
 */
const testUsers = [
  {
    id: null, // Sarà generato
    email: 'mario.rossi@gmail.com',
    user_type: 'client',
    profile: {
      company_name: 'ACME Corporation S.r.l.',
      vat_number: 'IT12345678901',
      fiscal_code: 'RSSMRA80A01H501Z',
      company_size: 'medium',
      industry_sector: 'Manifatturiero',
      employees_count: 50,
      phone: '+39 02 1234567',
      website: 'https://www.acmecorp.it',
      legal_street: 'Via Roma 123',
      legal_city: 'Milano',
      legal_province: 'MI',
      legal_postal_code: '20121',
      legal_country: 'Italy',
      contact_person_name: 'Mario Rossi',
      contact_person_role: 'Responsabile HSE',
      contact_person_email: 'mario.rossi@gmail.com',
      contact_person_phone: '+39 02 1234567'
    }
  },
  {
    id: null,
    email: 'giulia.bianchi@gmail.com',
    user_type: 'client',
    profile: {
      company_name: 'Tech Solutions S.p.A.',
      vat_number: 'IT98765432109',
      fiscal_code: 'BNCGLI85C15F205W',
      company_size: 'large',
      industry_sector: 'Tecnologia',
      employees_count: 120,
      phone: '+39 06 9876543',
      website: 'https://www.techsolutions.it',
      legal_street: 'Corso Italia 456',
      legal_city: 'Roma',
      legal_province: 'RM',
      legal_postal_code: '00187',
      legal_country: 'Italy',
      contact_person_name: 'Giulia Bianchi',
      contact_person_role: 'HR Manager',
      contact_person_email: 'giulia.bianchi@gmail.com',
      contact_person_phone: '+39 06 9876543'
    }
  },
  {
    id: null,
    email: 'marco.verdi@gmail.com',
    user_type: 'provider',
    profile: {
      business_name: 'Sicurezza Pro Consulting',
      vat_number: 'IT11223344556',
      fiscal_code: 'VRDMRC75D10A662F',
      professional_order: 'Ordine degli Ingegneri di Torino',
      registration_number: 'A12345',
      phone: '+39 011 5551234',
      website: 'https://www.sicurezzapro.it',
      description: 'Consulenza specializzata in sicurezza sul lavoro e antincendio',
      experience_years: 15,
      team_size: 3,
      street: 'Via Torino 789',
      city: 'Torino',
      province: 'TO',
      postal_code: '10121',
      country: 'Italy',
      contact_person_name: 'Marco Verdi',
      contact_person_role: 'Titolare',
      contact_person_email: 'marco.verdi@gmail.com',
      contact_person_phone: '+39 011 5551234',
      specializations: ['Sicurezza sul lavoro', 'Antincendio', 'HACCP'],
      service_areas: ['Piemonte', 'Lombardia'],
      languages: ['Italian', 'English'],
      rating_average: 4.8,
      reviews_count: 45,
      verified: true,
      auto_accept_bookings: false,
      advance_notice_hours: 48,
      cancellation_policy: 'Cancellazione gratuita fino a 48 ore prima'
    }
  },
  {
    id: null,
    email: 'anna.ferrari@gmail.com',
    user_type: 'provider',
    profile: {
      business_name: 'HSE Consulting Ferrari',
      vat_number: 'IT99887766554',
      fiscal_code: 'FRRNNA82M15L219X',
      professional_order: 'Ordine degli Ingegneri di Bologna',
      registration_number: 'B67890',
      phone: '+39 051 7778899',
      website: 'https://www.hseconsulting.it',
      description: 'Consulenza integrata HSE: Ambiente, Sicurezza e Qualità',
      experience_years: 12,
      team_size: 5,
      street: 'Via Bologna 321',
      city: 'Bologna',
      province: 'BO',
      postal_code: '40121',
      country: 'Italy',
      contact_person_name: 'Anna Ferrari',
      contact_person_role: 'Responsabile Tecnico',
      contact_person_email: 'anna.ferrari@gmail.com',
      contact_person_phone: '+39 051 7778899',
      specializations: ['Ambiente', 'Sicurezza', 'Qualità ISO'],
      service_areas: ['Emilia-Romagna', 'Toscana'],
      languages: ['Italian', 'English', 'French'],
      rating_average: 4.9,
      reviews_count: 67,
      verified: true,
      auto_accept_bookings: true,
      advance_notice_hours: 24,
      cancellation_policy: 'Cancellazione gratuita fino a 24 ore prima'
    }
  }
];

/**
 * Genera UUID casuali
 */
function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

/**
 * Crea un utente usando l'autenticazione di Supabase
 */
async function createUser(userData) {
  // Genera una password temporanea
  const tempPassword = 'TempPass123!';
  
  // Crea l'utente con l'autenticazione di Supabase
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: userData.email,
    password: tempPassword,
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
}

/**
 * Inserisce un profilo cliente
 */
async function insertClientProfile(userId, profileData) {
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
}

/**
 * Inserisce un profilo fornitore
 */
async function insertProviderProfile(userId, profileData) {
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
}

/**
 * Funzione principale
 */
async function main() {
  console.log('🚀 Avvio importazione utenti di test...');
  console.log(`📡 Connessione a: ${SUPABASE_URL}`);
  
  try {
    let clientsCreated = 0;
    let providersCreated = 0;
    
    console.log(`📝 Importazione di ${testUsers.length} utenti di test...`);
    
    for (let i = 0; i < testUsers.length; i++) {
        const userData = testUsers[i];
        console.log(`\n👤 Creazione utente ${i + 1}/${testUsers.length}: ${userData.email}`);
        
        // Aggiunge un delay per evitare rate limiting
        if (i > 0) {
          console.log('⏳ Attesa 30 secondi per evitare rate limiting...');
          await new Promise(resolve => setTimeout(resolve, 30000));
        }
        
        try {
        // Crea l'utente con l'autenticazione di Supabase
        const user = await createUser(userData);
        const userId = user.id;
        console.log(`✅ Utente creato con ID: ${userId}`);
        
        // Autentica l'utente per permettere l'inserimento del profilo
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userData.email,
          password: 'TempPass123!'
        });
        
        if (signInError) {
          console.log(`⚠️ Impossibile autenticare ${userData.email}, salto creazione profilo`);
          continue;
        }
        
        // Attende un momento per permettere ai trigger del database di completarsi
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Inserisce il profilo appropriato
        if (userData.user_type === 'client') {
          await insertClientProfile(userId, userData.profile);
          console.log(`✅ Profilo cliente creato per: ${userData.profile.company_name}`);
          clientsCreated++;
        } else if (userData.user_type === 'provider') {
          await insertProviderProfile(userId, userData.profile);
          console.log(`✅ Profilo fornitore creato per: ${userData.profile.business_name}`);
          providersCreated++;
        }
        
        // Disconnette l'utente
        await supabase.auth.signOut();
        
      } catch (userError) {
        console.error(`❌ Errore creazione utente ${userData.email}:`, userError.message);
        // Continua con il prossimo utente invece di fermarsi
      }
    }
    
    console.log('\n✅ Importazione completata!');
    console.log('\n📊 Riepilogo utenti creati:');
    console.log(`   • ${clientsCreated} Clienti`);
    console.log(`   • ${providersCreated} Fornitori`);
    console.log(`   • ${clientsCreated + providersCreated} Totale`);
    console.log('\n💡 Suggerimento: Usa questi dati per testare login, ricerche e prenotazioni.');
    console.log('\n📧 Email di test create:');
    testUsers.forEach(user => {
      console.log(`   • ${user.email} (${user.user_type})`);
    });
    
  } catch (error) {
    console.error('❌ Errore durante l\'importazione:', error.message);
    process.exit(1);
  }
}

// Esegue lo script
if (require.main === module) {
  main();
}

module.exports = { main };