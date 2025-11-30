/**
 * Test finale per verificare la ricerca solo nel campo descrizione
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

async function testFinalSearch() {
  try {
    console.log('🔍 Test finale: ricerca "Ispezione DPI" solo nel campo descrizione...\n');
    
    const searchTerm = 'Ispezione DPI';
    
    // Simuliamo la query del sistema aggiornato
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

    // Applica il filtro di ricerca solo sulla descrizione
    query = query.ilike('description', `%${searchTerm}%`);

    const { data: services, error } = await query;

    if (error) {
      console.error('❌ Errore nella query:', error);
      return;
    }

    console.log(`📊 Risultati trovati: ${services?.length || 0}`);
    
    if (services && services.length > 0) {
      console.log('\n📋 Primi 10 servizi trovati:');
      services.slice(0, 10).forEach((service, index) => {
        console.log(`\n${index + 1}. ${service.title}`);
        console.log(`   Categoria: ${service.category}`);
        console.log(`   Sottocategoria: ${service.subcategory || 'N/A'}`);
        console.log(`   Prezzo: €${service.base_price}`);
        console.log(`   Provider: ${service.provider?.first_name} ${service.provider?.last_name}`);
        console.log(`   Descrizione: ${service.description?.substring(0, 100)}...`);
      });
      
      if (services.length > 10) {
        console.log(`\n... e altri ${services.length - 10} servizi`);
      }
    } else {
      console.log('\n❌ Nessun servizio trovato');
    }

    // Test del count
    console.log('\n🔍 Test count query...');
    let countQuery = supabase
      .from('services')
      .select('id', { count: 'exact', head: true })
      .eq('active', true);

    countQuery = countQuery.ilike('description', `%${searchTerm}%`);

    const { count, error: countError } = await countQuery;

    if (countError) {
      console.error('❌ Errore nella count query:', countError);
    } else {
      console.log(`📊 Count query risultato: ${count}`);
    }

  } catch (error) {
    console.error('❌ Errore durante il test:', error);
  }
}

// Esegui il test
testFinalSearch();