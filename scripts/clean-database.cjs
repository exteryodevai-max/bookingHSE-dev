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

async function cleanDatabase() {
  try {
    console.log('🧹 Inizio pulizia database...');
    
    // Prima controllo cosa c'è nel database
    console.log('\n📊 Stato attuale del database:');
    
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

    // Ora procedo con la pulizia
    console.log('\n🗑️ Inizio eliminazione dati...');
    
    // Elimino prima i profili (che hanno foreign key verso users)
    console.log('🔄 Eliminazione profili clienti...');
    const { error: deleteClientsError } = await supabase
      .from('client_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Elimina tutti i record
    
    if (deleteClientsError) {
      console.log('❌ Errore eliminazione profili clienti:', deleteClientsError.message);
    } else {
      console.log('✅ Profili clienti eliminati');
    }

    console.log('🔄 Eliminazione profili fornitori...');
    const { error: deleteProvidersError } = await supabase
      .from('provider_profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Elimina tutti i record
    
    if (deleteProvidersError) {
      console.log('❌ Errore eliminazione profili fornitori:', deleteProvidersError.message);
    } else {
      console.log('✅ Profili fornitori eliminati');
    }

    // Elimino gli utenti dalla tabella public.users
    console.log('🔄 Eliminazione utenti dalla tabella public.users...');
    const { error: deleteUsersError } = await supabase
      .from('users')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Elimina tutti i record
    
    if (deleteUsersError) {
      console.log('❌ Errore eliminazione utenti:', deleteUsersError.message);
    } else {
      console.log('✅ Utenti eliminati dalla tabella public.users');
    }

    // Verifica finale
    console.log('\n📊 Stato finale del database:');
    
    const { data: finalUsers } = await supabase.from('users').select('*');
    const { data: finalClients } = await supabase.from('client_profiles').select('*');
    const { data: finalProviders } = await supabase.from('provider_profiles').select('*');
    
    console.log(`👥 Utenti rimanenti: ${finalUsers?.length || 0}`);
    console.log(`🏢 Profili clienti rimanenti: ${finalClients?.length || 0}`);
    console.log(`🔧 Profili fornitori rimanenti: ${finalProviders?.length || 0}`);
    
    if ((finalUsers?.length || 0) === 0 && 
        (finalClients?.length || 0) === 0 && 
        (finalProviders?.length || 0) === 0) {
      console.log('\n🎉 Database pulito con successo!');
      console.log('⚠️  NOTA: Gli utenti in auth.users potrebbero ancora esistere.');
      console.log('   Per eliminarli completamente, usa il dashboard di Supabase:');
      console.log('   Authentication > Users > Elimina manualmente');
    } else {
      console.log('\n⚠️  Pulizia parziale completata. Alcuni record potrebbero rimanere.');
    }
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error.message);
  }
}

// Esegui la pulizia
cleanDatabase();