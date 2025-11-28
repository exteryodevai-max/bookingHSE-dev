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

async function checkUsers() {
  try {
    console.log('🔍 Verifica utenti nel database...');
    
    // Controlla gli utenti nella tabella auth.users (tramite admin)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('⚠️ Non posso accedere agli utenti auth (normale con anon key)');
    } else {
      console.log(`📊 Utenti in auth.users: ${authUsers.users.length}`);
    }
    
    // Controlla gli utenti nella tabella users
    const { data: publicUsers, error: publicError } = await supabase
      .from('users')
      .select('*');
    
    if (publicError) {
      console.log('❌ Errore lettura tabella users:', publicError.message);
    } else {
      console.log(`📊 Utenti in tabella users: ${publicUsers.length}`);
      publicUsers.forEach(user => {
        console.log(`  - ${user.email} (${user.user_type}) - ID: ${user.id}`);
      });
    }
    
    // Controlla i profili client
    const { data: clientProfiles, error: clientError } = await supabase
      .from('client_profiles')
      .select('*');
    
    if (clientError) {
      console.log('❌ Errore lettura profili client:', clientError.message);
    } else {
      console.log(`📊 Profili client: ${clientProfiles.length}`);
    }
    
    // Controlla i profili provider
    const { data: providerProfiles, error: providerError } = await supabase
      .from('provider_profiles')
      .select('*');
    
    if (providerError) {
      console.log('❌ Errore lettura profili provider:', providerError.message);
    } else {
      console.log(`📊 Profili provider: ${providerProfiles.length}`);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkUsers();