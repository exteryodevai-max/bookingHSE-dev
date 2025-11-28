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

async function fixPatrickUser() {
  try {
    console.log('🔧 Creando utente Patrick Cioni nella tabella users...');
    
    const userId = '5a215d46-15bb-47eb-ad1d-afe4104ea6fe';
    const email = 'patrickcioni95@gmail.com';
    const companyName = 'Pippo Srl';
    const userType = 'provider';
    
    // Controlla se l'utente esiste già
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (existingUser) {
      console.log('✅ Utente già esistente nella tabella users');
    } else {
      // Crea l'utente nella tabella users
      const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          company_name: companyName,
          user_type: userType,
          first_name: 'Patrick',
          last_name: 'Cioni',
          phone: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (userError) {
        console.error('❌ Errore creazione utente:', userError);
        return;
      }
      
      console.log('✅ Utente creato nella tabella users:', newUser.email);
    }
    
    // Controlla se il profilo provider esiste già
    const { data: existingProfile } = await supabase
      .from('provider_profiles')
      .select('id')
      .eq('user_id', userId)
      .single();
    
    if (existingProfile) {
      console.log('✅ Profilo provider già esistente');
    } else {
      // Crea il profilo provider
      const { data: newProfile, error: profileError } = await supabase
        .from('provider_profiles')
        .insert({
          user_id: userId,
          business_name: companyName,
          vat_number: '',
          fiscal_code: '',
          phone: '',
          website: '',
          description: '',
          experience_years: 0,
          team_size: 1,
          street: '',
          city: '',
          province: '',
          postal_code: '',
          country: 'Italy',
          contact_person_name: 'Patrick Cioni',
          contact_person_email: email,
          contact_person_phone: '',
          specializations: [],
          service_areas: [],
          languages: ['Italian'],
          rating_average: 0.0,
          reviews_count: 0,
          verified: false,
          auto_accept_bookings: false,
          advance_notice_hours: 24,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('❌ Errore creazione profilo provider:', profileError);
        return;
      }
      
      console.log('✅ Profilo provider creato:', newProfile.business_name);
    }
    
    console.log('\n🎉 Operazione completata! L\'utente dovrebbe ora poter accedere senza loop.');
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

fixPatrickUser();