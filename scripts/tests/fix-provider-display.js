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

async function fixProviderDisplay() {
  try {
    console.log('🔍 Analisi dei servizi e dei loro provider...\n');

    // 1. Ottieni tutti i servizi con i loro provider_id
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('id, title, provider_id')
      .limit(20);

    if (servicesError) {
      console.error('❌ Errore nel recupero servizi:', servicesError);
      return;
    }

    console.log(`📊 Trovati ${services?.length || 0} servizi (primi 20)`);

    // 2. Per ogni servizio, controlla se esiste un provider_profile
    const servicesWithProviderInfo = [];
    
    for (const service of services || []) {
      // Cerca il provider_profile per questo user_id
      const { data: providerProfile, error: profileError } = await supabase
        .from('provider_profiles')
        .select('id, business_name')
        .eq('user_id', service.provider_id)
        .single();

      const serviceInfo = {
        service_id: service.id,
        service_title: service.title,
        provider_id: service.provider_id,
        has_profile: !!providerProfile,
        business_name: providerProfile?.business_name || 'NESSUN PROFILO'
      };

      servicesWithProviderInfo.push(serviceInfo);
    }

    // 3. Mostra i risultati
    console.log('\n📋 Analisi servizi e provider:');
    servicesWithProviderInfo.forEach((info, index) => {
      const status = info.has_profile ? '✅' : '❌';
      console.log(`${index + 1}. ${status} ${info.service_title}`);
      console.log(`   Provider ID: ${info.provider_id}`);
      console.log(`   Business Name: ${info.business_name}`);
      console.log('');
    });

    // 4. Conta i servizi senza provider_profile
    const servicesWithoutProfile = servicesWithProviderInfo.filter(info => !info.has_profile);
    console.log(`🚨 Servizi senza provider_profile: ${servicesWithoutProfile.length}`);

    if (servicesWithoutProfile.length > 0) {
      console.log('\n🔧 Servizi che mostrano "Provider non disponibile":');
      servicesWithoutProfile.forEach(info => {
        console.log(`   - ${info.service_title} (Provider ID: ${info.provider_id})`);
      });

      // 5. Ottieni l'ID di Pippo Srl
      const { data: pippoProvider, error: pippoError } = await supabase
        .from('provider_profiles')
        .select('user_id, business_name')
        .eq('business_name', 'Pippo Srl')
        .single();

      if (pippoError) {
        console.error('❌ Errore nel recupero Pippo Srl:', pippoError);
        return;
      }

      console.log(`\n💡 Per risolvere, aggiorna i provider_id di questi servizi a: ${pippoProvider.user_id} (Pippo Srl)`);
      
      // 6. Chiedi conferma e procedi con l'aggiornamento
      console.log('\n🔄 Procedo con l\'aggiornamento automatico...');
      
      for (const serviceInfo of servicesWithoutProfile) {
        const { error: updateError } = await supabase
          .from('services')
          .update({ provider_id: pippoProvider.user_id })
          .eq('id', serviceInfo.service_id);

        if (updateError) {
          console.error(`❌ Errore aggiornamento servizio ${serviceInfo.service_title}:`, updateError);
        } else {
          console.log(`✅ Aggiornato: ${serviceInfo.service_title} → Pippo Srl`);
        }
      }

      console.log('\n🎉 Aggiornamento completato!');
    } else {
      console.log('\n✅ Tutti i servizi hanno un provider_profile valido!');
    }

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

fixProviderDisplay();