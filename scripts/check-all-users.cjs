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

async function checkAllUsers() {
  console.log('🔍 Controllo tutti gli utenti nella tabella users...');
  
  const { data: users, error } = await supabase
    .from('users')
    .select('id, email, first_name, last_name, user_type, company_name, created_at')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('❌ Errore:', error);
    return;
  }
  
  console.log(`📊 Trovati ${users.length} utenti:`);
  users.forEach(user => {
    console.log(`- ID: ${user.id}`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Nome: ${user.first_name} ${user.last_name}`);
    console.log(`  Tipo: ${user.user_type}`);
    console.log(`  Azienda: ${user.company_name}`);
    console.log(`  Creato: ${user.created_at}`);
    console.log('---');
  });
}

checkAllUsers().catch(console.error);