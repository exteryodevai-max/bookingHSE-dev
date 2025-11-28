const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Legge il file .env manualmente
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

// Utenti specifici da creare
const specificUsers = [
  {
    email: 'patrickcioni95@gmail.com',
    password: 'admin123',
    user_type: 'provider',
    profile: {
      business_name: 'Patrick Cioni Consulting',
      vat_number: 'IT12345678901',
      street: 'Via Roma 123',
      city: 'Milano',
      postal_code: '20100',
      province: 'MI',
      country: 'Italia',
      phone: '+39 333 1234567',
      website: 'https://patrickcioni.com',
      description: 'Consulente HSE specializzato in sicurezza sul lavoro',
      experience_years: 10,
      contact_person_name: 'Patrick Cioni',
      contact_person_role: 'Titolare',
      contact_person_email: 'patrickcioni95@gmail.com',
      contact_person_phone: '+39 333 1234567',
      specializations: ['Sicurezza sul lavoro', 'Formazione HSE'],
      service_areas: ['Milano', 'Lombardia']
    }
  },
  {
    email: 'pierluigi.pisanti@gmail.com',
    password: 'admin123',
    user_type: 'client',
    profile: {
      company_name: 'Pisanti Industries',
      vat_number: 'IT98765432109',
      company_size: 'medium',
      industry_sector: 'manufacturing',
      legal_street: 'Via Torino 456',
      legal_city: 'Roma',
      legal_postal_code: '00100',
      legal_province: 'RM',
      legal_country: 'Italia',
      billing_street: 'Via Torino 456',
      billing_city: 'Roma',
      billing_postal_code: '00100',
      billing_province: 'RM',
      billing_country: 'Italia',
      phone: '+39 06 1234567',
      contact_person_name: 'Pierluigi Pisanti',
      contact_person_role: 'CEO',
      contact_person_email: 'pierluigi.pisanti@gmail.com',
      contact_person_phone: '+39 06 1234567'
    }
  }
];

async function createUser(userData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        user_type: userData.user_type
      }
    }
  });
  
  if (error) {
    throw new Error(`Errore creazione utente: ${error.message}`);
  }
  
  return authData.user;
}

async function insertClientProfile(userId, profile) {
  const { data, error } = await supabase
    .from('client_profiles')
    .insert({
      user_id: userId,
      ...profile
    })
    .select();
  
  if (error) {
    throw new Error(`Errore inserimento profilo cliente: ${error.message}`);
  }
  
  return data[0];
}

async function insertProviderProfile(userId, profile) {
  const { data, error } = await supabase
    .from('provider_profiles')
    .insert({
      user_id: userId,
      ...profile
    })
    .select();
  
  if (error) {
    throw new Error(`Errore inserimento profilo fornitore: ${error.message}`);
  }
  
  return data[0];
}

async function main() {
  console.log('🚀 Creazione utenti specifici...');
  console.log(`📡 Connessione a: ${envVars.VITE_SUPABASE_URL}`);
  
  let usersCreated = 0;
  let clientsCreated = 0;
  let providersCreated = 0;
  
  for (let i = 0; i < specificUsers.length; i++) {
    const userData = specificUsers[i];
    console.log(`\n👤 Creazione utente ${i + 1}/${specificUsers.length}: ${userData.email}`);
    
    try {
      // Crea l'utente
      const user = await createUser(userData);
      const userId = user.id;
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
      
      // I trigger automatici dovrebbero inserire l'utente nella tabella users
      console.log('Attendo che i trigger automatici inseriscano l\'utente...');
      
      // Verifica che l'utente sia stato inserito nella tabella users
      let userExists = false;
      for (let i = 0; i < 5; i++) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('id')
          .eq('id', userId)
          .single();
        
        if (existingUser) {
          userExists = true;
          console.log('Utente trovato nella tabella users');
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      if (!userExists) {
        console.log('Utente non trovato nella tabella users dopo 5 secondi, salto creazione profilo');
        continue;
      }
      
      // Attende un momento per permettere ai trigger del database di completarsi
      await new Promise(resolve => setTimeout(resolve, 2000));
      
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
      
      usersCreated++;
      
      // Disconnette l'utente
      await supabase.auth.signOut();
      
      // Delay tra utenti per evitare rate limiting
      if (i < specificUsers.length - 1) {
        console.log('⏳ Attesa 5 secondi...');
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
      
    } catch (userError) {
      console.error(`❌ Errore creazione utente ${userData.email}:`, userError.message);
    }
  }
  
  console.log('\n✅ Creazione completata!');
  console.log('\n📊 Riepilogo utenti creati:');
  console.log(`   • ${clientsCreated} Clienti`);
  console.log(`   • ${providersCreated} Fornitori`);
  console.log(`   • ${usersCreated} Totale`);
  
  console.log('\n📧 Credenziali di accesso:');
  specificUsers.forEach(user => {
    console.log(`   • ${user.email} - Password: ${user.password} (${user.user_type})`);
  });
}

main().catch(console.error);