const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Legge le variabili d'ambiente
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY è richiesta per applicare i trigger');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyTriggers() {
  try {
    console.log('🔧 Applicazione trigger di sincronizzazione utenti...');
    
    // Legge il file SQL
    const sqlPath = path.join(__dirname, '..', 'database', 'user-sync-triggers.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');
    
    // Esegue il SQL
    const { error } = await supabase.rpc('exec_sql', { sql: sqlContent });
    
    if (error) {
      console.error('❌ Errore applicazione trigger:', error.message);
      process.exit(1);
    }
    
    console.log('✅ Trigger applicati con successo!');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
    process.exit(1);
  }
}

applyTriggers();