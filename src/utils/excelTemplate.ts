import * as XLSX from 'xlsx';

// Definizione dei campi del template Excel basati sullo schema del database
export interface ServiceTemplateRow {
  title: string;
  description: string;
  category: string;
  service_type: string;
  location_type: string;
  base_price: number;
  pricing_unit: string;
  currency: string;
  duration_hours: number;
  max_participants: number;
  min_participants: number;
  service_areas: string;
  requirements: string;
  deliverables: string;
  tags: string;
  active: string;
  featured: string;
  meta_description: string;
}

// Valori enum per validazione
export const ENUM_VALUES = {
  category: [
    'consultation_management',
    'workplace_safety',
    'training_education',
    'environment',
    'occupational_health',
    'emergency_crisis',
    'innovation_digital',
    'specialized_services'
  ],
  service_type: ['instant', 'on_request', 'scheduled'],
  location_type: ['on_site', 'remote', 'flexible'],
  pricing_unit: ['fixed', 'hourly', 'daily', 'per_participant', 'per_sqm'],
  currency: ['EUR', 'USD'],
  boolean: ['TRUE', 'FALSE']
};

// Traduzioni per i campi in italiano
export const FIELD_TRANSLATIONS = {
  title: 'Titolo',
  description: 'Descrizione',
  category: 'Categoria',
  service_type: 'Tipo Servizio',
  location_type: 'Tipo Ubicazione',
  base_price: 'Prezzo Base',
  pricing_unit: 'Unità Prezzo',
  currency: 'Valuta',
  duration_hours: 'Durata (ore)',
  max_participants: 'Max Partecipanti',
  min_participants: 'Min Partecipanti',
  service_areas: 'Aree Servizio',
  requirements: 'Requisiti',
  deliverables: 'Deliverable',
  tags: 'Tag',
  active: 'Attivo',
  featured: 'In Evidenza',
  meta_description: 'Meta Descrizione'
};

// Traduzioni italiane per i valori enum
const CATEGORY_TRANSLATIONS = {
  consultation_management: 'Consulenza e Gestione',
  workplace_safety: 'Sicurezza sul Lavoro',
  training_education: 'Formazione ed Educazione',
  environment: 'Ambiente',
  occupational_health: 'Salute Occupazionale',
  emergency_crisis: 'Emergenze e Crisi',
  innovation_digital: 'Innovazione e Digitale',
  specialized_services: 'Servizi Specializzati'
};

const SERVICE_TYPE_TRANSLATIONS = {
  instant: 'Immediato (disponibile subito)',
  on_request: 'Su Richiesta (da concordare)',
  scheduled: 'Programmato (date fisse)'
};

const LOCATION_TYPE_TRANSLATIONS = {
  on_site: 'Presso il Cliente',
  remote: 'Da Remoto (online)',
  flexible: 'Flessibile (entrambi)'
};

const PRICING_UNIT_TRANSLATIONS = {
  fixed: 'Prezzo Fisso',
  hourly: 'All\'Ora',
  daily: 'Al Giorno',
  per_participant: 'Per Partecipante',
  per_sqm: 'Per Metro Quadro'
};

// Traduzioni inverse per i valori booleani
const BOOLEAN_TRANSLATIONS = {
  'Sì': true,
  'Si': true,
  'sì': true,
  'si': true,
  'SÌ': true,
  'SI': true,
  'SÃ¬': true,
  'sÃ¬': true,
  'No': false,
  'no': false,
  'NO': false
};

// Descrizioni dei campi per il foglio istruzioni
export const FIELD_DESCRIPTIONS = {
  title: 'Nome del servizio (obbligatorio, max 255 caratteri)',
  description: 'Descrizione dettagliata del servizio (obbligatorio)',
  category: `Categoria del servizio. Scegli tra: ${Object.values(CATEGORY_TRANSLATIONS).join(', ')}`,
  service_type: `Tipo di servizio. Scegli tra: ${Object.values(SERVICE_TYPE_TRANSLATIONS).join(', ')}`,
  location_type: `Dove viene erogato il servizio. Scegli tra: ${Object.values(LOCATION_TYPE_TRANSLATIONS).join(', ')}`,
  base_price: 'Prezzo base del servizio (numero decimale, es: 150.00)',
  pricing_unit: `Come viene calcolato il prezzo. Scegli tra: ${Object.values(PRICING_UNIT_TRANSLATIONS).join(', ')}`,
  currency: 'Valuta del prezzo. Scrivi "EUR" per Euro o "USD" per Dollaro (default: EUR)',
  duration_hours: 'Durata in ore (numero decimale, es: 2.5 per 2 ore e 30 minuti)',
  max_participants: 'Numero massimo di partecipanti (numero intero)',
  min_participants: 'Numero minimo di partecipanti (numero intero, default: 1)',
  service_areas: 'Aree geografiche servite, separate da virgola (es: Milano, Roma, Torino)',
  requirements: 'Requisiti necessari per il servizio',
  deliverables: 'Cosa viene consegnato al cliente',
  tags: 'Tag per la ricerca, separati da virgola (es: sicurezza, formazione, audit)',
  active: 'Se il servizio è disponibile. Scrivi "Sì" per attivo o "No" per non attivo (default: Sì)',
  featured: 'Se il servizio deve essere messo in evidenza. Scrivi "Sì" per sì o "No" per no (default: No)',
  meta_description: 'Descrizione per SEO (max 160 caratteri)'
};

// Dati di esempio per il template
// Reverse mappings per convertire valori italiani in codici tecnici
export const REVERSE_CATEGORY_TRANSLATIONS = Object.fromEntries(
  Object.entries(CATEGORY_TRANSLATIONS).map(([key, value]) => [value, key])
);

export const REVERSE_SERVICE_TYPE_TRANSLATIONS = Object.fromEntries(
  Object.entries(SERVICE_TYPE_TRANSLATIONS).map(([key, value]) => [value, key])
);

export const REVERSE_LOCATION_TYPE_TRANSLATIONS = Object.fromEntries(
  Object.entries(LOCATION_TYPE_TRANSLATIONS).map(([key, value]) => [value, key])
);

export const REVERSE_PRICING_UNIT_TRANSLATIONS = Object.fromEntries(
  Object.entries(PRICING_UNIT_TRANSLATIONS).map(([key, value]) => [value, key])
);

export const BOOLEAN_TRANSLATIONS_MAP = BOOLEAN_TRANSLATIONS;

const EXAMPLE_DATA: ServiceTemplateRow[] = [
  {
    title: 'Corso di Formazione Sicurezza sul Lavoro',
    description: 'Corso completo di formazione sulla sicurezza sul lavoro secondo D.Lgs 81/08',
    category: 'Formazione ed Educazione',
    service_type: 'Programmato (date fisse)',
    location_type: 'Presso il Cliente',
    base_price: 250.00,
    pricing_unit: 'Per Partecipante',
    currency: 'EUR',
    duration_hours: 8.0,
    max_participants: 20,
    min_participants: 5,
    service_areas: 'Milano, Roma, Torino',
    requirements: 'Aula con proiettore, minimo 5 partecipanti',
    deliverables: 'Attestato di partecipazione, materiale didattico',
    tags: 'formazione, sicurezza, D.Lgs 81/08',
    active: 'Sì',
    featured: 'No',
    meta_description: 'Corso di formazione sicurezza sul lavoro conforme al D.Lgs 81/08'
  },
  {
    title: 'Audit Ambientale ISO 14001',
    description: 'Audit completo del sistema di gestione ambientale secondo ISO 14001',
    category: 'Ambiente',
    service_type: 'Su Richiesta (da concordare)',
    location_type: 'Presso il Cliente',
    base_price: 1500.00,
    pricing_unit: 'Prezzo Fisso',
    currency: 'EUR',
    duration_hours: 16.0,
    max_participants: 1,
    min_participants: 1,
    service_areas: 'Lombardia, Piemonte, Veneto',
    requirements: 'Accesso ai documenti del sistema di gestione',
    deliverables: 'Rapporto di audit, piano di miglioramento',
    tags: 'audit, ambiente, ISO 14001, certificazione',
    active: 'Sì',
    featured: 'Sì',
    meta_description: 'Audit professionale ISO 14001 per certificazione ambientale'
  }
];

export function generateExcelTemplate(): ArrayBuffer {
  // Crea un nuovo workbook
  const workbook = XLSX.utils.book_new();

  // Foglio 1: Template per i dati
  const headers = Object.keys(FIELD_TRANSLATIONS).map(key => 
    FIELD_TRANSLATIONS[key as keyof typeof FIELD_TRANSLATIONS]
  );
  
  const templateData = [headers, ...EXAMPLE_DATA.map(row => [
    row.title,
    row.description,
    row.category,
    row.service_type,
    row.location_type,
    row.base_price,
    row.pricing_unit,
    row.currency,
    row.duration_hours,
    row.max_participants,
    row.min_participants,
    row.service_areas,
    row.requirements,
    row.deliverables,
    row.tags,
    row.active,
    row.featured,
    row.meta_description
  ])];

  const templateSheet = XLSX.utils.aoa_to_sheet(templateData);
  
  // Imposta la larghezza delle colonne
  const columnWidths = [
    { wch: 30 }, // title
    { wch: 50 }, // description
    { wch: 20 }, // category
    { wch: 15 }, // service_type
    { wch: 15 }, // location_type
    { wch: 12 }, // base_price
    { wch: 15 }, // pricing_unit
    { wch: 8 },  // currency
    { wch: 12 }, // duration_hours
    { wch: 15 }, // max_participants
    { wch: 15 }, // min_participants
    { wch: 30 }, // service_areas
    { wch: 40 }, // requirements
    { wch: 40 }, // deliverables
    { wch: 30 }, // tags
    { wch: 8 },  // active
    { wch: 12 }, // featured
    { wch: 40 }  // meta_description
  ];
  
  templateSheet['!cols'] = columnWidths;
  
  XLSX.utils.book_append_sheet(workbook, templateSheet, 'Servizi');

  // Foglio 2: Istruzioni
  const instructionsData = [
    ['ISTRUZIONI PER IL CARICAMENTO SERVIZI'],
    [''],
    ['IMPORTANTE: Rispettare esattamente i valori indicati per i campi con opzioni predefinite'],
    [''],
    ['CAMPI E DESCRIZIONI:'],
    [''],
    ...Object.entries(FIELD_DESCRIPTIONS).map(([field, description]) => [
      FIELD_TRANSLATIONS[field as keyof typeof FIELD_TRANSLATIONS],
      description
    ]),
    [''],
    ['VALORI CATEGORIA:'],
    ...Object.values(CATEGORY_TRANSLATIONS).map(value => ['', value]),
    [''],
    ['VALORI TIPO SERVIZIO:'],
    ...Object.values(SERVICE_TYPE_TRANSLATIONS).map(value => ['', value]),
    [''],
    ['VALORI TIPO UBICAZIONE:'],
    ...Object.values(LOCATION_TYPE_TRANSLATIONS).map(value => ['', value]),
    [''],
    ['VALORI UNITÀ PREZZO:'],
    ...Object.values(PRICING_UNIT_TRANSLATIONS).map(value => ['', value]),
    [''],
    ['NOTE:'],
    ['- I campi obbligatori sono: Titolo, Descrizione, Categoria, Tipo Servizio, Ubicazione, Prezzo Base, Unità Prezzo'],
    ['- Per i campi booleani (Attivo, In Evidenza):'],
    ['  • Scrivi "TRUE" se vuoi che il servizio sia attivo/in evidenza'],
    ['  • Scrivi "FALSE" se vuoi che il servizio sia disattivo/normale'],
    ['  • Se lasci vuoto, il sistema userà i valori predefiniti (Attivo=TRUE, In Evidenza=FALSE)'],
    ['- Per le liste (Aree Servizio, Tag) separare i valori con virgole'],
    ['- I prezzi devono essere numeri decimali (es: 150.00)'],
    ['- Le ore possono essere decimali (es: 2.5 per 2 ore e 30 minuti)'],
    ['- IMPORTANTE: Per i campi con valori predefiniti, scrivi esattamente il testo italiano mostrato sopra'],
    ['- Eliminare le righe di esempio prima di importare i vostri dati']
  ];

  const instructionsSheet = XLSX.utils.aoa_to_sheet(instructionsData);
  instructionsSheet['!cols'] = [{ wch: 25 }, { wch: 80 }];
  
  XLSX.utils.book_append_sheet(workbook, instructionsSheet, 'Istruzioni');

  // Converte in ArrayBuffer
  return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
}

export function downloadExcelTemplate(filename: string = 'template_servizi_bookinghse.xlsx') {
  const buffer = generateExcelTemplate();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Funzione per validare i dati importati
export function validateImportData(data: Array<Record<string, unknown>>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!data || data.length === 0) {
    errors.push('Il file non contiene dati');
    return { valid: false, errors };
  }

  data.forEach((row, index) => {
    const rowNum = index + 1;
    
    // Estrarre e validare campi con type-narrowing
    const title = typeof row.title === 'string' ? row.title : '';
    const description = typeof row.description === 'string' ? row.description : '';
    const category = typeof row.category === 'string' ? row.category : undefined;
    const serviceType = typeof row.service_type === 'string' ? row.service_type : undefined;
    const locationType = typeof row.location_type === 'string' ? row.location_type : undefined;
    const pricingUnit = typeof row.pricing_unit === 'string' ? row.pricing_unit : undefined;
    const metaDescription = typeof row.meta_description === 'string' ? row.meta_description : undefined;

    // Campi obbligatori
    if (!title.trim()) {
      errors.push(`Riga ${rowNum}: Titolo obbligatorio`);
    }
    if (!description.trim()) {
      errors.push(`Riga ${rowNum}: Descrizione obbligatoria`);
    }
    if (!category || !ENUM_VALUES.category.includes(category)) {
      errors.push(`Riga ${rowNum}: Categoria non valida. Valori possibili: ${ENUM_VALUES.category.join(', ')}`);
    }
    if (!serviceType || !ENUM_VALUES.service_type.includes(serviceType)) {
      errors.push(`Riga ${rowNum}: Tipo servizio non valido. Valori possibili: ${ENUM_VALUES.service_type.join(', ')}`);
    }
    if (!locationType || !ENUM_VALUES.location_type.includes(locationType)) {
      errors.push(`Riga ${rowNum}: Tipo ubicazione non valido. Valori possibili: ${ENUM_VALUES.location_type.join(', ')}`);
    }
    if (!pricingUnit || !ENUM_VALUES.pricing_unit.includes(pricingUnit)) {
      errors.push(`Riga ${rowNum}: Unità prezzo non valida. Valori possibili: ${ENUM_VALUES.pricing_unit.join(', ')}`);
    }
    
    // Validazione numerica
    const basePrice = typeof row.base_price === 'number' ? row.base_price : (row.base_price !== undefined ? Number(row.base_price) : undefined);
    if (basePrice !== undefined && (isNaN(basePrice) || basePrice < 0)) {
      errors.push(`Riga ${rowNum}: Prezzo base deve essere un numero positivo`);
    }

    const durationHours = typeof row.duration_hours === 'number' ? row.duration_hours : (row.duration_hours !== undefined ? Number(row.duration_hours) : undefined);
    if (durationHours !== undefined && (isNaN(durationHours) || durationHours <= 0)) {
      errors.push(`Riga ${rowNum}: Durata deve essere un numero positivo`);
    }

    const maxParticipants = typeof row.max_participants === 'number' ? row.max_participants : (row.max_participants !== undefined ? Number(row.max_participants) : undefined);
    if (maxParticipants !== undefined && (isNaN(maxParticipants) || maxParticipants < 1)) {
      errors.push(`Riga ${rowNum}: Max partecipanti deve essere un numero intero positivo`);
    }

    const minParticipants = typeof row.min_participants === 'number' ? row.min_participants : (row.min_participants !== undefined ? Number(row.min_participants) : undefined);
    if (minParticipants !== undefined && (isNaN(minParticipants) || minParticipants < 1)) {
      errors.push(`Riga ${rowNum}: Min partecipanti deve essere un numero intero positivo`);
    }
    
    // Validazione lunghezza campi
    if (title && title.length > 255) {
      errors.push(`Riga ${rowNum}: Titolo troppo lungo (max 255 caratteri)`);
    }
    if (metaDescription && metaDescription.length > 160) {
      errors.push(`Riga ${rowNum}: Meta descrizione troppo lunga (max 160 caratteri)`);
    }
  });

  return { valid: errors.length === 0, errors };
}