import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variabili d\'ambiente Supabase mancanti');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkProviderText() {
  try {
    console.log('🔍 Controllo testi "Provider non disponibile" nel database...\n');

    // 1. Controlla se ci sono servizi con "Provider non disponibile" nel campo provider_name
    const { data: servicesWithText, error: error1 } = await supabase
      .from('services')
      .select('id, title, provider_name, provider_id')
      .ilike('provider_name', '%Provider non disponibile%');

    if (error1) {
      console.error('❌ Errore nel controllo provider_name:', error1);
    } else {
      console.log(`📊 Servizi con "Provider non disponibile" nel provider_name: ${servicesWithText?.length || 0}`);
      if (servicesWithText && servicesWithText.length > 0) {
        console.log('🔍 Primi 10 servizi trovati:');
        servicesWithText.slice(0, 10).forEach(service => {
          console.log(`   - ID: ${service.id}, Titolo: ${service.title}, Provider Name: ${service.provider_name}, Provider ID: ${service.provider_id}`);
        });
      }
    }

    // 2. Controlla tutti i servizi per vedere i provider_name attuali
    const { data: allServices, error: error2 } = await supabase
      .from('services')
      .select('id, title, provider_name, provider_id')
      .limit(20);

    if (error2) {
      console.error('❌ Errore nel controllo servizi:', error2);
    } else {
      console.log('\n📋 Primi 20 servizi con i loro provider_name:');
      allServices?.forEach(service => {
        console.log(`   - Titolo: ${service.title}, Provider Name: ${service.provider_name || 'NULL'}, Provider ID: ${service.provider_id || 'NULL'}`);
      });
    }

    // 3. Controlla i provider_profiles per vedere tutti i provider disponibili
    const { data: providers, error: error3 } = await supabase
      .from('provider_profiles')
      .select('id, user_id, business_name');

    if (error3) {
      console.error('❌ Errore nel controllo provider_profiles:', error3);
    } else {
      console.log('\n👥 Provider disponibili:');
      providers?.forEach(provider => {
        console.log(`   - ID: ${provider.id}, User ID: ${provider.user_id}, Business Name: ${provider.business_name}`);
      });
    }

    // 4. Controlla se esiste già "Pippo Srl" come provider
    const { data: pippoProvider, error: error4 } = await supabase
      .from('provider_profiles')
      .select('id, user_id, business_name')
      .eq('business_name', 'Pippo Srl')
      .single();

    if (error4 && error4.code !== 'PGRST116') {
      console.error('❌ Errore nel controllo Pippo Srl:', error4);
    } else if (pippoProvider) {
      console.log('\n✅ Provider "Pippo Srl" già esistente:');
      console.log(`   ID: ${pippoProvider.id}`);
      console.log(`   User ID: ${pippoProvider.user_id}`);
      console.log(`   Business Name: ${pippoProvider.business_name}`);
    } else {
      console.log('\n❌ Provider "Pippo Srl" non trovato');
    }

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

checkProviderText();