const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read .env file manually
const envContent = fs.readFileSync('.env', 'utf8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=');
  if (key && value) {
    envVars[key.trim()] = value.trim();
  }
});

const supabase = createClient(envVars.VITE_SUPABASE_URL, envVars.VITE_SUPABASE_ANON_KEY);

async function checkAuthStatus() {
  console.log('🔍 Controllo stato autenticazione...');
  
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error) {
    console.error('❌ Errore nel controllo auth:', error);
    return;
  }
  
  if (user) {
    console.log('✅ Utente autenticato:');
    console.log(`- ID: ${user.id}`);
    console.log(`- Email: ${user.email}`);
    console.log(`- Metadati: ${JSON.stringify(user.user_metadata, null, 2)}`);
  } else {
    console.log('❌ Nessun utente autenticato');
  }
}

checkAuthStatus().catch(console.error);