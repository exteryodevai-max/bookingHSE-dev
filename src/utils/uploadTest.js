/**
 * Test diretto per verificare l'upload delle immagini al bucket Supabase
 * Questo script testa la funzionalità di upload senza passare attraverso l'interfaccia utente
 */

import { createClient } from '@supabase/supabase-js';

// Configurazione Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Configurazione Supabase mancante:', {
    url: !!supabaseUrl,
    key: !!supabaseAnonKey
  });
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Test di connessione al bucket service-images
 */
export async function testBucketConnection() {
  console.log('🔍 Testing bucket connection...');
  
  try {
    // Lista i bucket disponibili
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('❌ Errore nel recupero dei bucket:', bucketsError);
      return false;
    }
    
    console.log('📦 Bucket disponibili:', buckets.map(b => b.name));
    
    // Verifica se il bucket service-images esiste
    const serviceImagesBucket = buckets.find(b => b.name === 'service-images');
    if (!serviceImagesBucket) {
      console.error('❌ Bucket "service-images" non trovato');
      return false;
    }
    
    console.log('✅ Bucket "service-images" trovato:', serviceImagesBucket);
    
    // Testa l'accesso al bucket listando i file
    const { data: files, error: listError } = await supabase.storage
      .from('service-images')
      .list('', { limit: 5 });
    
    if (listError) {
      console.error('❌ Errore nell\'accesso al bucket:', listError);
      return false;
    }
    
    console.log('📁 File nel bucket (primi 5):', files);
    console.log('✅ Accesso al bucket riuscito');
    return true;
    
  } catch (error) {
    console.error('❌ Errore durante il test del bucket:', error);
    return false;
  }
}

/**
 * Crea un file di test per l'upload
 */
function createTestFile() {
  // Crea un file di test (1x1 pixel PNG trasparente)
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(255, 0, 0, 0.5)'; // Rosso semi-trasparente
  ctx.fillRect(0, 0, 1, 1);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const file = new File([blob], 'test-upload.png', { type: 'image/png' });
      resolve(file);
    }, 'image/png');
  });
}

/**
 * Test di upload diretto
 */
export async function testDirectUpload() {
  console.log('🚀 Testing direct upload...');
  
  try {
    // Crea un file di test
    const testFile = await createTestFile();
    console.log('📄 File di test creato:', {
      name: testFile.name,
      size: testFile.size,
      type: testFile.type
    });
    
    // Genera un nome file unico
    const timestamp = Date.now();
    const fileName = `test-${timestamp}.png`;
    const filePath = `test-uploads/${fileName}`;
    
    console.log('📤 Uploading file to:', filePath);
    
    // Esegui l'upload
    const { data, error } = await supabase.storage
      .from('service-images')
      .upload(filePath, testFile, {
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      console.error('❌ Errore durante l\'upload:', error);
      return false;
    }
    
    console.log('✅ Upload riuscito:', data);
    
    // Verifica che il file sia stato caricato
    const { data: fileData, error: getError } = await supabase.storage
      .from('service-images')
      .getPublicUrl(filePath);
    
    if (getError) {
      console.error('❌ Errore nel recupero URL pubblico:', getError);
      return false;
    }
    
    console.log('🔗 URL pubblico del file:', fileData.publicUrl);
    
    // Cleanup: rimuovi il file di test
    const { error: deleteError } = await supabase.storage
      .from('service-images')
      .remove([filePath]);
    
    if (deleteError) {
      console.warn('⚠️ Errore nella rimozione del file di test:', deleteError);
    } else {
      console.log('🗑️ File di test rimosso con successo');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Errore durante il test di upload:', error);
    return false;
  }
}

/**
 * Test completo della funzionalità di upload
 */
export async function runUploadTests() {
  console.log('🧪 Avvio test completo upload immagini...');
  console.log('=' .repeat(50));
  
  // Test 1: Connessione al bucket
  const bucketTest = await testBucketConnection();
  console.log('=' .repeat(50));
  
  if (!bucketTest) {
    console.error('❌ Test fallito: impossibile accedere al bucket');
    return false;
  }
  
  // Test 2: Upload diretto
  const uploadTest = await testDirectUpload();
  console.log('=' .repeat(50));
  
  if (!uploadTest) {
    console.error('❌ Test fallito: impossibile caricare file');
    return false;
  }
  
  console.log('✅ Tutti i test sono passati con successo!');
  console.log('🎉 La funzionalità di upload dovrebbe funzionare correttamente');
  
  return true;
}

// Esporta per uso nella console del browser
window.uploadTests = {
  testBucketConnection,
  testDirectUpload,
  runUploadTests
};

console.log('🔧 Test di upload caricati. Usa window.uploadTests.runUploadTests() nella console per eseguire i test.');