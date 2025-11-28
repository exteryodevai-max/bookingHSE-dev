const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      process.env[key] = value;
    }
  });
}

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function fixMissingProfile() {
  try {
    console.log('🔍 Cercando utenti senza profilo...');
    
    // Get user without profile
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'pierluigi.pisanti@gmail.com')
      .single();
    
    if (userError) {
      console.error('❌ Errore nel recuperare l\'utente:', userError);
      return;
    }
    
    if (!user) {
      console.log('❌ Utente non trovato');
      return;
    }
    
    console.log('👤 Utente trovato:', user.email, 'Tipo:', user.user_type);
    
    // Check if profile already exists
    if (user.user_type === 'client') {
      const { data: existingProfile } = await supabase
        .from('client_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (existingProfile) {
        console.log('✅ Profilo client già esistente');
        return;
      }
      
      // Create client profile
      const { error: profileError } = await supabase
        .from('client_profiles')
        .insert({
          user_id: user.id,
          company_name: user.company_name || 'Azienda',
          vat_number: '',
          fiscal_code: '',
          company_size: 'micro',
          industry_sector: '',
          employees_count: 1,
          phone: user.phone || '',
          legal_street: '',
          legal_city: '',
          legal_province: '',
          legal_postal_code: '',
          legal_country: 'Italy',
          contact_person_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Contatto',
          contact_person_email: user.email,
          contact_person_phone: user.phone || ''
        });
      
      if (profileError) {
        console.error('❌ Errore nella creazione del profilo client:', profileError);
      } else {
        console.log('✅ Profilo client creato con successo per:', user.email);
      }
    } else if (user.user_type === 'provider') {
      const { data: existingProfile } = await supabase
        .from('provider_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (existingProfile) {
        console.log('✅ Profilo provider già esistente');
        return;
      }
      
      // Create provider profile
      const { error: profileError } = await supabase
        .from('provider_profiles')
        .insert({
          user_id: user.id,
          business_name: user.company_name || 'Azienda',
          vat_number: '',
          fiscal_code: '',
          phone: user.phone || '',
          website: '',
          description: '',
          experience_years: 0,
          team_size: 1,
          street: '',
          city: '',
          province: '',
          postal_code: '',
          country: 'Italy',
          contact_person_name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Contatto',
          contact_person_email: user.email,
          contact_person_phone: user.phone || '',
          specializations: [],
          service_areas: [],
          languages: ['Italian'],
          rating_average: 0.0,
          reviews_count: 0,
          verified: false,
          auto_accept_bookings: false,
          advance_notice_hours: 24
        });
      
      if (profileError) {
        console.error('❌ Errore nella creazione del profilo provider:', profileError);
      } else {
        console.log('✅ Profilo provider creato con successo per:', user.email);
      }
    }
    
  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

fixMissingProfile();