// Test per verificare la ricerca frontend per "Ispezione DPI"
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://rnqvqjqvqjqvqjqvqjqv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Placeholder

// Simula la stessa query che fa il frontend
async function testFrontendSearch() {
  try {
    console.log('🔍 Testing frontend search for "Ispezione DPI"...');
    
    // Simula una chiamata HTTP alla pagina di ricerca
    const response = await fetch('http://localhost:5174/search?q=Ispezione%20DPI');
    
    if (response.ok) {
      console.log('✅ Search page loads successfully');
      console.log('Status:', response.status);
      
      // Verifica che la pagina contenga elementi di ricerca
      const html = await response.text();
      
      if (html.includes('search') || html.includes('ricerca')) {
        console.log('✅ Search page contains search elements');
      } else {
        console.log('⚠️  Search page might not contain search elements');
      }
      
    } else {
      console.log('❌ Search page failed to load');
      console.log('Status:', response.status);
    }
    
  } catch (error) {
    console.error('❌ Error testing frontend search:', error.message);
  }
}

testFrontendSearch();