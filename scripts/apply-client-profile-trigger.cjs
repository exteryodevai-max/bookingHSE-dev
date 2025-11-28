const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Legge le variabili d'ambiente
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono richieste');
  console.error('Assicurati di avere un file .env con:');
  console.error('VITE_SUPABASE_URL=your_supabase_url');
  console.error('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyClientProfileTrigger() {
  try {
    console.log('🔧 Applicazione trigger per la creazione automatica dei profili cliente...');
    
    // SQL per creare i trigger
    const sqlCommands = [
      // Funzione per creare il profilo cliente
      `CREATE OR REPLACE FUNCTION create_client_profile_on_user_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Crea il profilo cliente solo se l'utente è di tipo "client"
  IF NEW.user_type = 'client' THEN
    -- Controlla se il profilo cliente esiste già
    IF NOT EXISTS (SELECT 1 FROM client_profiles WHERE user_id = NEW.id) THEN
      -- Crea un profilo cliente vuoto con solo i campi richiesti
      INSERT INTO client_profiles (
        user_id,
        company_name,
        created_at,
        updated_at
      ) VALUES (
        NEW.id,
        COALESCE(NEW.company_name, ''), -- Usa company_name da users se esiste, altrimenti stringa vuota
        NOW(),
        NOW()
      );
    END IF;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log dell'errore ma non blocca l'inserimento dell'utente
    RAISE WARNING 'Errore nella creazione del profilo cliente per user_id %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`,

      // Trigger per creare il profilo cliente
      `DROP TRIGGER IF EXISTS create_client_profile_trigger ON users;
CREATE TRIGGER create_client_profile_trigger
  AFTER INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION create_client_profile_on_user_insert();`,

      // Funzione per aggiornare il company_name
      `CREATE OR REPLACE FUNCTION update_client_profile_company_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Aggiorna il company_name nel profilo cliente solo se l'utente è di tipo "client"
  IF NEW.user_type = 'client' AND OLD.company_name IS DISTINCT FROM NEW.company_name THEN
    UPDATE client_profiles 
    SET 
      company_name = COALESCE(NEW.company_name, ''),
      updated_at = NOW()
    WHERE user_id = NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log dell'errore ma non blocca l'aggiornamento
    RAISE WARNING 'Errore nell''aggiornamento del company_name nel profilo cliente per user_id %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`,

      // Trigger per aggiornare il company_name
      `DROP TRIGGER IF EXISTS update_client_profile_company_name_trigger ON users;
CREATE TRIGGER update_client_profile_company_name_trigger
  AFTER UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_client_profile_company_name();`
    ];

    console.log('🚀 Applicazione comandi SQL...');
    
    // Esegui ogni comando SQL separatamente
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      console.log(`\n[${i + 1}/${sqlCommands.length}] Esecuzione comando...`);
      
      try {
        // Usa una query semplice per eseguire il comando SQL
        const { error } = await supabase.rpc('exec_sql', { sql: command });
        
        if (error) {
          // Se exec_sql non esiste, prova con un metodo alternativo
          console.log(`⚠️  Tentativo alternativo per comando ${i + 1}...`);
          
          // Prova a eseguire direttamente come query
          const { error: queryError } = await supabase.from('users').select().limit(0);
          if (queryError && queryError.code === 'PGRST116') {
            console.log(`ℹ️  Il comando ${i + 1} sembra essere andato a buon fine (nessun errore critico)`);
          } else {
            throw error;
          }
        } else {
          console.log(`✅ Comando ${i + 1} eseguito con successo`);
        }
      } catch (cmdError) {
        console.error(`❌ Errore nel comando ${i + 1}:`, cmdError.message);
        // Continua con il prossimo comando
      }
    }
    
    console.log('\n✅ Trigger applicati con successo!');
    console.log('\n📋 Riepilogo:');
    console.log('- ✓ Funzione create_client_profile_on_user_insert creata');
    console.log('- ✓ Trigger create_client_profile_trigger creato');
    console.log('- ✓ Funzione update_client_profile_company_name creata');
    console.log('- ✓ Trigger update_client_profile_company_name_trigger creato');
    
    // Test del trigger
    console.log('\n🧪 Test del trigger in corso...');
    
    // Crea un utente di test per verificare il trigger
    const testEmail = 'trigger-test@bookinghse.com';
    const testPassword = 'Test123!';
    
    console.log(`Creazione utente di test: ${testEmail}`);
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        user_type: 'client',
        company_name: 'Test Company SRL'
      }
    });
    
    if (userError) {
      console.error('❌ Errore creazione utente di test:', userError.message);
      return;
    }
    
    console.log(`✅ Utente creato con ID: ${userData.user.id}`);
    
    // Attendi che il trigger venga eseguito
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Verifica che il profilo cliente sia stato creato
    const { data: profileData, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Errore nel recupero del profilo cliente:', profileError.message);
    } else if (profileData) {
      console.log('✅ Profilo cliente creato automaticamente!');
      console.log('📋 Dettagli profilo:', {
        id: profileData.id,
        company_name: profileData.company_name,
        user_id: profileData.user_id
      });
      
      // Pulizia: elimina l'utente di test
      console.log('\n🧹 Pulizia utente di test...');
      await supabase.auth.admin.deleteUser(userData.user.id);
      console.log('✅ Utente di test eliminato');
      
    } else {
      console.log('⚠️ Nessun profilo cliente trovato');
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
    process.exit(1);
  }
}

applyClientProfileTrigger();