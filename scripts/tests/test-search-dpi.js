/**
 * Test script per verificare la ricerca "Ispezione DPI"
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

async function testSearchIspezioneDPI() {
  try {
    console.log('🔍 Testando ricerca per "Ispezione DPI"...\n');
    
    const searchTerm = 'Ispezione DPI';
    
    // Query principale per i servizi
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

    const { data: services, error } = await query;

    if (error) {
      console.error('❌ Errore nella query:', error);
      return;
    }

    console.log(`📊 Risultati trovati: ${services?.length || 0}`);
    
    if (services && services.length > 0) {
      console.log('\n📋 Servizi trovati:');
      services.forEach((service, index) => {
        console.log(`\n${index + 1}. ${service.title}`);
        console.log(`   Categoria: ${service.category}`);
        console.log(`   Sottocategoria: ${service.subcategory || 'N/A'}`);
        console.log(`   Prezzo: €${service.base_price}`);
        console.log(`   Provider: ${service.provider?.first_name} ${service.provider?.last_name}`);
        console.log(`   Descrizione: ${service.description?.substring(0, 100)}...`);
      });
    } else {
      console.log('\n❌ Nessun servizio trovato per "Ispezione DPI"');
      
      // Test alternativo: cerchiamo solo "DPI"
      console.log('\n🔍 Provo a cercare solo "DPI"...');
      
      let queryDPI = supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          category,
          subcategory,
          base_price,
          active
        `)
        .eq('active', true);

      queryDPI = queryDPI.ilike('title,category,subcategory,description', '%DPI%');

      const { data: servicesDPI, error: errorDPI } = await queryDPI;
      
      if (errorDPI) {
        console.error('❌ Errore nella query DPI:', errorDPI);
        return;
      }
      
      console.log(`📊 Risultati per "DPI": ${servicesDPI?.length || 0}`);
      
      if (servicesDPI && servicesDPI.length > 0) {
        servicesDPI.forEach((service, index) => {
          console.log(`\n${index + 1}. ${service.title}`);
          console.log(`   Categoria: ${service.category}`);
          console.log(`   Sottocategoria: ${service.subcategory || 'N/A'}`);
        });
      }
    }

    // Test per vedere tutti i servizi attivi
    console.log('\n🔍 Controllo totale servizi attivi...');
    const { data: allServices, error: allError } = await supabase
      .from('services')
      .select('id, title, category, subcategory')
      .eq('active', true);

    if (allError) {
      console.error('❌ Errore nel conteggio totale:', allError);
    } else {
      console.log(`📊 Totale servizi attivi nel database: ${allServices?.length || 0}`);
      
      if (allServices && allServices.length > 0) {
        console.log('\n📋 Prime 10 categorie presenti:');
        const categories = [...new Set(allServices.map(s => s.category))];
        categories.slice(0, 10).forEach(cat => {
          const count = allServices.filter(s => s.category === cat).length;
          console.log(`   - ${cat}: ${count} servizi`);
        });
      }
    }

  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  }
}

// Esegui il test
testSearchIspezioneDPI();