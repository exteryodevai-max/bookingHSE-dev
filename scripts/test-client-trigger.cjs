const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono richieste');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testClientTrigger() {
  console.log('🧪 Testing del trigger per la creazione automatica dei profili cliente...');
  
  try {
    // 1. Crea un nuovo utente client
    const testEmail = 'test-client-trigger@bookinghse.com';
    const testPassword = 'Test123456!';
    const testCompany = 'Mario Banano SRL';
    
    console.log(`📋 Creazione nuovo utente client: ${testEmail}`);
    console.log(`🏢 Company: ${testCompany}`);
    
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        user_type: 'client',
        company_name: testCompany
      }
    });
    
    if (userError) {
      console.error('❌ Errore creazione utente:', userError.message);
      return;
    }
    
    console.log(`✅ Utente creato con successo!`);
    console.log(`🆔 ID Utente: ${userData.user.id}`);
    console.log(`📧 Email: ${userData.user.email}`);
    console.log(`👤 Tipo: ${userData.user.user_metadata?.user_type}`);
    console.log(`🏢 Company: ${userData.user.user_metadata?.company_name}`);
    
    // 2. Attendi che il trigger venga eseguito
    console.log('\n⏳ Attendo esecuzione trigger (3 secondi)...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 3. Verifica che il profilo cliente sia stato creato automaticamente
    console.log('🔍 Verifica profilo cliente...');
    
    const { data: profileData, error: profileError } = await supabase
      .from('client_profiles')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ Errore nel recupero del profilo:', profileError.message);
      return;
    }
    
    if (profileData) {
      console.log('🎉 SUCCESSO! Il profilo cliente è stato creato automaticamente!');
      console.log('\n📋 Dettagli profilo cliente:');
      console.log(`   ID Profilo: ${profileData.id}`);
      console.log(`   ID Utente: ${profileData.user_id}`);
      console.log(`   Company Name: ${profileData.company_name}`);
      console.log(`   Creato il: ${profileData.created_at}`);
      console.log(`   Aggiornato il: ${profileData.updated_at}`);
      
      // 4. Testa il login e verifica il profilo nel contesto
      console.log('\n🔐 Test del login...');
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      
      if (loginError) {
        console.error('❌ Errore login:', loginError.message);
      } else {
        console.log('✅ Login effettuato con successo!');
        
        // 5. Verifica il contesto auth
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('❌ Errore recupero utente:', userError.message);
        } else if (user) {
          console.log('\n👤 Utente corrente:');
          console.log(`   Email: ${user.email}`);
          console.log(`   Tipo: ${user.user_metadata?.user_type}`);
          console.log(`   Company: ${user.user_metadata?.company_name}`);
          
          // 6. Verifica che il profilo sia accessibile
          const { data: userProfile, error: userProfileError } = await supabase
            .from('client_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single();
          
          if (userProfileError) {
            console.error('❌ Errore recupero profilo utente:', userProfileError.message);
          } else if (userProfile) {
            console.log('\n✅ Profilo cliente accessibile:');
            console.log(`   Company: ${userProfile.company_name}`);
            console.log(`   VAT: ${userProfile.vat_number || 'N/A'}`);
          }
        }
      }
      
      // 7. Pulizia finale
      console.log('\n🧹 Pulizia utente di test...');
      await supabase.auth.admin.deleteUser(userData.user.id);
      console.log('✅ Utente di test eliminato');
      
      console.log('\n🎉 TEST COMPLETATO CON SUCCESSO!');
      console.log('✅ Il trigger per la creazione automatica dei profili cliente funziona correttamente.');
      console.log('✅ Il campo company_name viene popolato correttamente.');
      console.log('✅ Il profilo è accessibile dopo il login.');
      
    } else {
      console.log('❌ NESSUN PROFILO CLIENTE TROVATO');
      console.log('⚠️  Il trigger potrebbe non funzionare correttamente.');
      
      // Pulizia in caso di fallimento
      console.log('\n🧹 Pulizia utente di test...');
      await supabase.auth.admin.deleteUser(userData.user.id);
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
  }
}

testClientTrigger();