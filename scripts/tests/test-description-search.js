/**
 * Test script per verificare la ricerca nel campo descrizione
 */

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

async function testDescriptionSearch() {
  try {
    console.log('🔍 Analisi servizi con "Ispezione DPI" nella descrizione...\n');
    
    // 1. Prima cerchiamo tutti i servizi che contengono "Ispezione DPI" nella descrizione
    console.log('📋 Step 1: Cerco servizi con "Ispezione DPI" nella descrizione...');
    const { data: servicesWithDPI, error: errorDPI } = await supabase
      .from('services')
      .select(`
        id,
        title,
        description,
        category,
        subcategory,
        active,
        provider_id,
        provider:users!services_provider_id_fkey(
          id,
          first_name,
          last_name,
          email,
          user_type
        )
      `)
      .ilike('description', '%Ispezione DPI%');

    if (errorDPI) {
      console.error('❌ Errore nella query descrizione:', errorDPI);
      return;
    }

    console.log(`📊 Servizi trovati con "Ispezione DPI" nella descrizione: ${servicesWithDPI?.length || 0}`);
    
    if (servicesWithDPI && servicesWithDPI.length > 0) {
      console.log('\n📋 Dettagli servizi trovati:');
      servicesWithDPI.forEach((service, index) => {
        console.log(`\n${index + 1}. ID: ${service.id}`);
        console.log(`   Titolo: ${service.title}`);
        console.log(`   Attivo: ${service.active}`);
        console.log(`   Provider ID: ${service.provider_id}`);
        console.log(`   Provider: ${service.provider ? `${service.provider.first_name} ${service.provider.last_name} (${service.provider.user_type})` : 'MANCANTE'}`);
        console.log(`   Descrizione: ${service.description?.substring(0, 150)}...`);
      });
    }

    // 2. Ora testiamo la query attuale del sistema
    console.log('\n🔍 Step 2: Testo la query attuale del sistema...');
    
    const searchTerm = 'Ispezione DPI';
    let query = supabase
      .from('services')
      .select(`
        id,
        title,
        description,
        category,
        subcategory,
        base_price,
        active,
        provider:users!services_provider_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('active', true);

    // Applica il filtro di ricerca come implementato nel codice
    query = query.ilike('title,category,subcategory,description', `%${searchTerm}%`);

    const { data: systemResults, error: systemError } = await query;

    if (systemError) {
      console.error('❌ Errore nella query sistema:', systemError);
      return;
    }

    console.log(`📊 Risultati query sistema: ${systemResults?.length || 0}`);

    // 3. Confrontiamo i risultati
    console.log('\n🔍 Step 3: Confronto risultati...');
    
    if (servicesWithDPI && servicesWithDPI.length > 0) {
      const activeServicesWithDPI = servicesWithDPI.filter(s => s.active);
      console.log(`📊 Servizi attivi con "Ispezione DPI" nella descrizione: ${activeServicesWithDPI.length}`);
      
      const servicesWithProvider = activeServicesWithDPI.filter(s => s.provider);
      console.log(`📊 Servizi attivi con provider valido: ${servicesWithProvider.length}`);
      
      const servicesWithoutProvider = activeServicesWithDPI.filter(s => !s.provider);
      console.log(`📊 Servizi attivi SENZA provider: ${servicesWithoutProvider.length}`);
      
      if (servicesWithoutProvider.length > 0) {
        console.log('\n❌ Servizi senza provider (potrebbero essere esclusi):');
        servicesWithoutProvider.forEach((service, index) => {
          console.log(`   ${index + 1}. ID: ${service.id} - ${service.title}`);
          console.log(`      Provider ID: ${service.provider_id}`);
        });
      }
    }

    // 4. Test della sintassi multi-campo
    console.log('\n🔍 Step 4: Test sintassi multi-campo alternativa...');
    
    // Proviamo con OR esplicito
    const { data: orResults, error: orError } = await supabase
      .from('services')
      .select(`
        id,
        title,
        description,
        category,
        subcategory,
        active,
        provider:users!services_provider_id_fkey(
          id,
          first_name,
          last_name,
          email
        )
      `)
      .eq('active', true)
      .or(`title.ilike.%${searchTerm}%,category.ilike.%${searchTerm}%,subcategory.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);

    if (orError) {
      console.error('❌ Errore nella query OR:', orError);
    } else {
      console.log(`📊 Risultati con OR esplicito: ${orResults?.length || 0}`);
      
      if (orResults && orResults.length > 0) {
        console.log('\n📋 Servizi trovati con OR:');
        orResults.forEach((service, index) => {
          console.log(`   ${index + 1}. ${service.title}`);
          console.log(`      Provider: ${service.provider ? 'OK' : 'MANCANTE'}`);
        });
      }
    }

    // 5. Test senza join provider
    console.log('\n🔍 Step 5: Test senza join provider...');
    
    const { data: noJoinResults, error: noJoinError } = await supabase
      .from('services')
      .select(`
        id,
        title,
        description,
        category,
        subcategory,
        active,
        provider_id
      `)
      .eq('active', true)
      .ilike('description', `%${searchTerm}%`);

    if (noJoinError) {
      console.error('❌ Errore nella query senza join:', noJoinError);
    } else {
      console.log(`📊 Risultati senza join provider: ${noJoinResults?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  }
}

// Esegui il test
testDescriptionSearch();