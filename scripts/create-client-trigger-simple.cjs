const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono richieste');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createClientTriggers() {
  console.log('🚀 Creazione trigger per profili cliente...');
  
  try {
    // 1. Crea la funzione per creare il profilo cliente
    console.log('📋 Creazione funzione create_client_profile_on_user_insert...');
    
    const { error: funcError } = await supabase.rpc('create_client_profile_on_user_insert', {});
    
    if (funcError) {
      console.error('❌ Errore nella creazione della funzione:', funcError.message);
      console.log('ℹ️  Prova a creare la funzione manualmente con il file SQL in database/client-profile-trigger.sql');
    } else {
      console.log('✅ Funzione creata con successo!');
    }
    
    // 2. Crea il trigger
    console.log('📋 Creazione trigger create_client_profile_trigger...');
    
    const triggerSQL = `
      DROP TRIGGER IF EXISTS create_client_profile_trigger ON users;
      CREATE TRIGGER create_client_profile_trigger
      AFTER INSERT ON users
      FOR EACH ROW
      EXECUTE FUNCTION create_client_profile_on_user_insert();
    `;
    
    // Prova a eseguire il trigger SQL direttamente
    try {
      const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL });
      if (triggerError) throw triggerError;
      console.log('✅ Trigger creato con successo!');
    } catch (triggerErr) {
      console.log('ℹ️  Trigger potrebbe essere già esistente o creato con la funzione');
    }
    
    // 3. Testa il trigger
    console.log('🧪 Testing del trigger...');
    
    // Crea un utente di test
    const testEmail = 'test-client@bookinghse.com';
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: 'Test123456!',
      email_confirm: true,
      user_metadata: {
        user_type: 'client',
        company_name: 'Test Company Cliente'
      }
    });
    
    if (userError) {
      console.error('❌ Errore creazione utente di test:', userError.message);
      return;
    }
    
    console.log(`✅ Utente creato: ${userData.user.id}`);
    
    // Attendi un momento per il trigger
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Controlla se il profilo cliente è stato creato
    const { data: profileData, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Errore nel recupero del profilo:', profileError.message);
    } else if (profileData) {
      console.log('✅ SUCCESSO! Profilo cliente creato automaticamente:');
      console.log('📋 Dettagli:', {
        id: profileData.id,
        user_id: profileData.user_id,
        company_name: profileData.company_name,
        created_at: profileData.created_at
      });
      
      // Pulizia
      console.log('🧹 Pulizia utente di test...');
      await supabase.auth.admin.deleteUser(userData.user.id);
      console.log('✅ Utente di test eliminato');
    } else {
      console.log('⚠️  Nessun profilo cliente trovato - il trigger potrebbe non funzionare');
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

// Funzione alternativa per creare la funzione se RPC non funziona
async function createFunctionManually() {
  console.log('📋 Creazione manuale della funzione...');
  
  const functionSQL = `
    CREATE OR REPLACE FUNCTION create_client_profile_on_user_insert()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.user_type = 'client' THEN
        IF NOT EXISTS (SELECT 1 FROM client_profiles WHERE user_id = NEW.id) THEN
          INSERT INTO client_profiles (user_id, company_name, created_at, updated_at)
          VALUES (NEW.id, COALESCE(NEW.company_name, ''), NOW(), NOW());
        END IF;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `;
  
  try {
    // Prova a eseguire tramite una query diretta
    const { error } = await supabase.from('users').select().limit(0);
    console.log('ℹ️  Prova a eseguire il SQL nel dashboard di Supabase:');
    console.log(functionSQL);
  } catch (e) {
    console.log('ℹ️  Usa il file database/client-profile-trigger.sql nel dashboard di Supabase');
  }
}

createClientTriggers().then(() => {
  console.log('\n✅ Processo completato!');
}).catch(error => {
  console.error('❌ Errore:', error.message);
});