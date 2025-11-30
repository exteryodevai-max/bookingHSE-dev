// Script per controllare i servizi con "Provider non disponibile" - versione corretta
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Carica le variabili d'ambiente
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variabili d\'ambiente mancanti');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkProviderIssues() {
  try {
    console.log('🔍 Controllo servizi con problemi di provider...\n');

    // 1. Controlla servizi senza provider_id o con provider_id nullo
    const { data: servicesWithoutProvider, error: error1 } = await supabase
      .from('services')
      .select('id, title, provider_id')
      .or('provider_id.is.null,provider_id.eq.');

    if (error1) {
      console.error('❌ Errore nel controllo servizi senza provider:', error1);
      return;
    }

    console.log(`📊 Servizi senza provider_id valido: ${servicesWithoutProvider?.length || 0}`);
    if (servicesWithoutProvider && servicesWithoutProvider.length > 0) {
      console.log('Primi 10 servizi senza provider:');
      servicesWithoutProvider.slice(0, 10).forEach((service, index) => {
        console.log(`  ${index + 1}. ${service.title} (ID: ${service.id})`);
      });
      console.log('');
    }

    // 2. Controlla se esiste già "Pippo Srl"
    const { data: pippoProvider, error: error2 } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('business_name', 'Pippo Srl')
      .single();

    if (error2 && error2.code !== 'PGRST116') {
      console.error('❌ Errore nel controllo Pippo Srl:', error2);
      return;
    }

    if (pippoProvider) {
      console.log('✅ Provider "Pippo Srl" già esistente:');
      console.log(`   ID: ${pippoProvider.id}`);
      console.log(`   User ID: ${pippoProvider.user_id}`);
      console.log(`   Business Name: ${pippoProvider.business_name}`);
      console.log('');
    } else {
      console.log('❌ Provider "Pippo Srl" non trovato nel database\n');
    }

    // 3. Controlla il totale dei servizi
    const { count: totalServices, error: error3 } = await supabase
      .from('services')
      .select('*', { count: 'exact', head: true });

    if (error3) {
      console.error('❌ Errore nel conteggio totale servizi:', error3);
      return;
    }

    console.log(`📊 Totale servizi nel database: ${totalServices || 0}`);

    // 4. Controlla servizi con provider_id valido
    const { data: servicesWithProvider, error: error4 } = await supabase
      .from('services')
      .select('id, title, provider_id')
      .not('provider_id', 'is', null)
      .neq('provider_id', '');

    if (error4) {
      console.error('❌ Errore nel controllo servizi con provider:', error4);
      return;
    }

    console.log(`📊 Servizi con provider_id valido: ${servicesWithProvider?.length || 0}`);
    
    const orphanServices = (totalServices || 0) - (servicesWithProvider?.length || 0);
    console.log(`🚨 Servizi orfani (senza provider valido): ${orphanServices}`);

    if (orphanServices > 0) {
      console.log('\n⚠️  Questi servizi orfani mostrano "Provider non disponibile" nel frontend');
      console.log('🔧 Sarà necessario assegnarli a "Pippo Srl"');
    }

    // 5. Se Pippo Srl esiste, mostra il suo user_id per l'aggiornamento
    if (pippoProvider && orphanServices > 0) {
      console.log(`\n💡 Per aggiornare i servizi orfani, usa provider_id: ${pippoProvider.user_id}`);
    }

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

checkProviderIssues();