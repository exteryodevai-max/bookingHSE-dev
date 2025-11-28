const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY sono richieste');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function deleteAllClientUsers() {
  console.log('🗑️  Eliminazione di tutti gli utenti con user_type = client...');
  
  try {
    // 1. Prima ottieni tutti gli utenti client
    console.log('📋 Ricerca utenti client...');
    
    const { data: clientUsers, error: searchError } = await supabase
      .from('users')
      .select('id, email, user_type, company_name')
      .eq('user_type', 'client');
    
    if (searchError) {
      console.error('❌ Errore nella ricerca:', searchError.message);
      return;
    }
    
    if (!clientUsers || clientUsers.length === 0) {
      console.log('ℹ️  Nessun utente client trovato nel database');
      return;
    }
    
    console.log(`📊 Trovati ${clientUsers.length} utenti client:`);
    clientUsers.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id}) - Company: ${user.company_name || 'N/A'}`);
    });
    
    // 2. Per ogni utente client, elimina anche il profilo cliente associato
    console.log('\n🗑️  Eliminazione profili cliente associati...');
    
    for (const user of clientUsers) {
      // Elimina il profilo cliente
      const { error: profileError } = await supabase
        .from('client_profiles')
        .delete()
        .eq('user_id', user.id);
      
      if (profileError) {
        console.log(`⚠️  Errore eliminazione profilo per ${user.email}: ${profileError.message}`);
      } else {
        console.log(`✅ Profilo cliente eliminato per ${user.email}`);
      }
      
      // Piccola pausa per evitare rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // 3. Ora elimina gli utenti tramite auth.admin
    console.log('\n🗑️  Eliminazione utenti auth...');
    
    let deletedCount = 0;
    let errorCount = 0;
    
    for (const user of clientUsers) {
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id);
        
        if (deleteError) {
          console.error(`❌ Errore eliminazione ${user.email}: ${deleteError.message}`);
          errorCount++;
        } else {
          console.log(`✅ Utente eliminato: ${user.email}`);
          deletedCount++;
        }
        
        // Pausa tra eliminazioni per evitare rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Errore critico per ${user.email}: ${error.message}`);
        errorCount++;
      }
    }
    
    // 4. Riepilogo
    console.log('\n📊 Riepilogo eliminazione:');
    console.log(`✅ Utenti eliminati con successo: ${deletedCount}`);
    console.log(`❌ Errori: ${errorCount}`);
    console.log(`📋 Totale processato: ${clientUsers.length}`);
    
    // 5. Verifica finale
    console.log('\n🔍 Verifica finale...');
    const { data: remainingClients, error: finalError } = await supabase
      .from('users')
      .select('count')
      .eq('user_type', 'client');
    
    if (!finalError && remainingClients) {
      console.log(`ℹ️  Utenti client rimanenti: ${remainingClients[0].count}`);
    }
    
    console.log('\n✅ Operazione completata!');
    console.log('💡 Ora puoi testare il nuovo trigger creando un utente client.');
    
  } catch (error) {
    console.error('❌ Errore generale:', error.message);
    process.exit(1);
  }
}

// Conferma prima di procedere
console.log('⚠️  ATTENZIONE: Questo script eliminerà TUTTI gli utenti con user_type = client');
console.log('📝 Includerà:');
console.log('   - Tutti gli utenti auth');
console.log('   - Tutti i profili cliente associati');
console.log('   - Tutti i dati collegati (prenotazioni, ecc.)');

// Richiedi conferma
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n🤔 Sei sicuro di voler procedere? Digita "SI" per confermare: ', (answer) => {
  if (answer.toUpperCase() === 'SI') {
    console.log('🚀 Procedo con l\'eliminazione...\n');
    deleteAllClientUsers();
  } else {
    console.log('❌ Operazione annullata.');
    rl.close();
  }
});