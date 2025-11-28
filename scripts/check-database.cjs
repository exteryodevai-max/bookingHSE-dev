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

async function checkDatabase() {
  try {
    console.log('🔍 Controllo dati nel database...');
    
    const { data: users, error: usersError } = await supabase.from('users').select('*');
    if (usersError) {
      console.log('❌ Errore lettura utenti:', usersError.message);
    } else {
      console.log(`👥 Utenti nel database: ${users?.length || 0}`);
      if (users && users.length > 0) {
        users.forEach(user => {
          console.log(`   - ${user.email} (${user.user_type})`);
        });
      }
    }
    
    const { data: clients, error: clientsError } = await supabase.from('client_profiles').select('*');
    if (clientsError) {
      console.log('❌ Errore lettura profili clienti:', clientsError.message);
    } else {
      console.log(`🏢 Profili clienti: ${clients?.length || 0}`);
    }
    
    const { data: providers, error: providersError } = await supabase.from('provider_profiles').select('*');
    if (providersError) {
      console.log('❌ Errore lettura profili fornitori:', providersError.message);
    } else {
      console.log(`🔧 Profili fornitori: ${providers?.length || 0}`);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkDatabase();