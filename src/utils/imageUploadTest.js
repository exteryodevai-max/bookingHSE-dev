// Script di test per il caricamento immagini da console
// Copiare e incollare nel browser console per testare l'upload

console.log('🧪 [ImageUploadTest] Inizializzazione test caricamento immagini...');

// Funzione per creare un file di test
function createTestFile(name = 'villafdp.png', sizeInMB = 2.5) {
  console.log(`📁 [ImageUploadTest] Creazione file di test: ${name} (${sizeInMB} MB)`);
  
  // Crea un canvas per generare un'immagine di test
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;
  const ctx = canvas.getContext('2d');
  
  // Disegna un'immagine di test
  ctx.fillStyle = '#4F46E5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'white';
  ctx.font = '48px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('TEST IMAGE', canvas.width / 2, canvas.height / 2);
  ctx.fillText(name, canvas.width / 2, canvas.height / 2 + 60);
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      // Crea un file con la dimensione desiderata
      const targetSize = sizeInMB * 1024 * 1024;
      const padding = Math.max(0, targetSize - blob.size);
      
      if (padding > 0) {
        // Aggiungi padding per raggiungere la dimensione desiderata
        const paddedBlob = new Blob([blob, new ArrayBuffer(padding)], { type: 'image/png' });
        const file = new File([paddedBlob], name, { type: 'image/png' });
        resolve(file);
      } else {
        const file = new File([blob], name, { type: 'image/png' });
        resolve(file);
      }
    }, 'image/png');
  });
}

// Funzione per testare la selezione file
async function testFileSelection() {
  console.log('🔍 [ImageUploadTest] Test selezione file...');
  
  const testFile = await createTestFile('villafdp.png', 2.5);
  
  console.log('📊 [ImageUploadTest] Dettagli file creato:', {
    name: testFile.name,
    size: testFile.size,
    sizeInMB: (testFile.size / 1024 / 1024).toFixed(2) + ' MB',
    type: testFile.type,
    lastModified: new Date(testFile.lastModified).toISOString()
  });
  
  // Simula la selezione del file
  const files = [testFile];
  
  // Verifica che la funzione di calcolo dimensione funzioni
  const calculatedSize = (testFile.size / 1024 / 1024).toFixed(1) + ' MB';
  console.log('📏 [ImageUploadTest] Dimensione calcolata:', calculatedSize);
  
  if (calculatedSize === '0.0 MB') {
    console.error('❌ [ImageUploadTest] ERRORE: Dimensione file calcolata come 0.0 MB!');
    console.log('🔍 [ImageUploadTest] Debug info:', {
      'testFile.size': testFile.size,
      'typeof testFile.size': typeof testFile.size,
      'testFile.size / 1024 / 1024': testFile.size / 1024 / 1024,
      'calculation': (testFile.size / 1024 / 1024).toFixed(1)
    });
  } else {
    console.log('✅ [ImageUploadTest] Calcolo dimensione file corretto');
  }
  
  return files;
}

// Funzione per testare l'upload
async function testImageUpload() {
  console.log('🚀 [ImageUploadTest] Test upload immagini...');
  
  try {
    const files = await testFileSelection();
    
    // Verifica se esiste la funzione uploadFiles globalmente
    if (typeof window.uploadFiles === 'function') {
      console.log('📤 [ImageUploadTest] Chiamata uploadFiles...');
      const result = await window.uploadFiles(files, 'services/test');
      console.log('✅ [ImageUploadTest] Upload completato:', result);
    } else {
      console.warn('⚠️ [ImageUploadTest] Funzione uploadFiles non disponibile globalmente');
      console.log('💡 [ImageUploadTest] Prova a eseguire questo test dalla pagina CreateService');
    }
    
  } catch (error) {
    console.error('❌ [ImageUploadTest] Errore durante il test:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// Funzione per verificare lo stato del file input
function checkFileInputState() {
  console.log('🔍 [ImageUploadTest] Verifica stato file input...');
  
  const fileInputs = document.querySelectorAll('input[type="file"]');
  console.log(`📁 [ImageUploadTest] Trovati ${fileInputs.length} input file`);
  
  fileInputs.forEach((input, index) => {
    console.log(`📄 [ImageUploadTest] Input ${index + 1}:`, {
      accept: input.accept,
      multiple: input.multiple,
      disabled: input.disabled,
      files: input.files ? Array.from(input.files).map(f => ({
        name: f.name,
        size: f.size,
        type: f.type
      })) : 'nessun file'
    });
  });
}

// Funzione per simulare la selezione di un file reale
async function simulateFileSelection() {
  console.log('🎭 [ImageUploadTest] Simulazione selezione file...');
  
  const fileInput = document.querySelector('input[type="file"]');
  if (!fileInput) {
    console.error('❌ [ImageUploadTest] Nessun input file trovato');
    return;
  }
  
  const testFile = await createTestFile('villafdp.png', 2.5);
  
  // Crea un DataTransfer per simulare la selezione
  const dataTransfer = new DataTransfer();
  dataTransfer.items.add(testFile);
  
  fileInput.files = dataTransfer.files;
  
  // Trigger change event
  const changeEvent = new Event('change', { bubbles: true });
  fileInput.dispatchEvent(changeEvent);
  
  console.log('✅ [ImageUploadTest] File selezionato simulato');
}

// Esporta le funzioni per uso globale
window.imageUploadTest = {
  createTestFile,
  testFileSelection,
  testImageUpload,
  checkFileInputState,
  simulateFileSelection
};

console.log('✅ [ImageUploadTest] Script caricato. Usa window.imageUploadTest per accedere alle funzioni di test');
console.log('📋 [ImageUploadTest] Funzioni disponibili:');
console.log('  - window.imageUploadTest.testFileSelection()');
console.log('  - window.imageUploadTest.testImageUpload()');
console.log('  - window.imageUploadTest.checkFileInputState()');
console.log('  - window.imageUploadTest.simulateFileSelection()');