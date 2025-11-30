import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function testProviderStructure() {
  try {
    console.log('🔍 Testando struttura dati provider...\n');

    // Test della query LEFT JOIN come nel codice
    const { data: services, error } = await supabase
      .from('services')
      .select(`
        id,
        title,
        provider:users!left(
          id,
          first_name,
          last_name,
          provider_profile:provider_profiles!left(
            business_name,
            verified,
            city,
            province
          )
        )
      `)
      .eq('active', true)
      .limit(5);

    if (error) {
      console.error('❌ Errore nella query:', error);
      return;
    }

    console.log(`📊 Servizi trovati: ${services?.length || 0}\n`);

    services?.forEach((service, index) => {
      console.log(`${index + 1}. ${service.title}`);
      console.log(`   Provider ID: ${service.provider?.id || 'NULL'}`);
      console.log(`   Provider Name: ${service.provider?.first_name} ${service.provider?.last_name}`);
      console.log(`   Business Name: ${service.provider?.provider_profile?.business_name || 'NULL'}`);
      console.log(`   Verified: ${service.provider?.provider_profile?.verified || false}`);
      console.log(`   Location: ${service.provider?.provider_profile?.city || 'N/A'}, ${service.provider?.provider_profile?.province || 'N/A'}`);
      console.log('   ---');
    });

    // Test per vedere come viene mappato nel frontend
    console.log('\n🔧 Test mapping come nel frontend:');
    services?.forEach((service, index) => {
      const businessName = service.provider?.provider_profile?.business_name || 
                          service.provider?.business_name || 
                          'Fornitore non disponibile';
      
      console.log(`${index + 1}. ${service.title} → Provider: "${businessName}"`);
    });

  } catch (error) {
    console.error('❌ Errore generale:', error);
  }
}

testProviderStructure();