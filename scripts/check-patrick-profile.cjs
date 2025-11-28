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

async function checkPatrickProfile() {
  try {
    console.log('🔍 Controllo profilo di Patrick Cioni...');
    
    // Controlla nella tabella users
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'patrickcioni95@gmail.com');
    
    if (usersError) {
      console.log('❌ Errore lettura utenti:', usersError.message);
      return;
    }
    
    if (users && users.length > 0) {
      const user = users[0];
      console.log('✅ Utente trovato nella tabella users:');
      console.log(`   - ID: ${user.id}`);
      console.log(`   - Email: ${user.email}`);
      console.log(`   - Tipo: ${user.user_type}`);
      console.log(`   - Creato: ${user.created_at}`);
      
      // Controlla il profilo fornitore
      const { data: providerProfile, error: providerError } = await supabase
        .from('provider_profiles')
        .select('*')
        .eq('user_id', user.id);
      
      console.log('🔍 Debug query profilo - Error:', providerError, 'Data:', providerProfile);
      
      if (providerError) {
        console.log('❌ Errore lettura profilo fornitore:', providerError.message);
      } else if (providerProfile && providerProfile.length > 0) {
        const profile = providerProfile[0];
        console.log('\n✅ Profilo fornitore trovato:');
        console.log(`   - Business Name: ${profile.business_name}`);
        console.log(`   - VAT: ${profile.vat_number}`);
        console.log(`   - Città: ${profile.city}`);
        console.log(`   - Telefono: ${profile.phone}`);
        console.log(`   - Specializzazioni: ${profile.specializations?.join(', ') || 'Nessuna'}`);
      } else {
        console.log('\n⚠️ Profilo fornitore NON trovato');
      }
    } else {
      console.log('❌ Utente NON trovato nella tabella users');
    }
    
    // Controlla anche nella tabella auth.users di Supabase
    console.log('\n🔍 Controllo nella tabella auth...');
    const { data: authUser, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ Non autenticato per controllare auth.users');
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkPatrickProfile();