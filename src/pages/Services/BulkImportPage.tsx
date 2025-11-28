import React, { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  DocumentArrowDownIcon,
  DocumentArrowUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowLeftIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { downloadExcelTemplate, validateImportData, FIELD_TRANSLATIONS, FIELD_DESCRIPTIONS, REVERSE_CATEGORY_TRANSLATIONS, REVERSE_SERVICE_TYPE_TRANSLATIONS, REVERSE_LOCATION_TYPE_TRANSLATIONS, REVERSE_PRICING_UNIT_TRANSLATIONS, BOOLEAN_TRANSLATIONS_MAP } from '../../utils/excelTemplate';
import * as XLSX from 'xlsx';
import { supabase } from '../../lib/supabase';

interface ImportResult {
  success: boolean;
  imported: number;
  errors: string[];
  warnings: string[];
}

export default function BulkImportPage() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if not a provider
  if (user?.user_type !== 'provider') {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-lg font-medium text-gray-900">Accesso Negato</h2>
            <p className="mt-2 text-sm text-gray-600">
              Solo i fornitori possono accedere a questa funzionalità.
            </p>
            <Link
              to="/dashboard"
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Torna alla Dashboard
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const downloadTemplate = () => {
    try {
      downloadExcelTemplate();
      toast.success('Template scaricato con successo!');
    } catch (error) {
      console.error('Errore nel download del template:', error);
      toast.error('Errore nel download del template');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!validTypes.includes(selectedFile.type) && !selectedFile.name.endsWith('.csv')) {
        toast.error('Formato file non supportato. Utilizzare CSV o Excel.');
        return;
      }

      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Seleziona un file da importare');
      return;
    }

    // Verifica che l'utente sia autenticato e sia un provider
    if (!user || !user.id) {
      toast.error('Utente non autenticato. Effettua il login per continuare.');
      return;
    }

    if (user.user_type !== 'provider') {
      toast.error('Solo i fornitori possono importare servizi.');
      return;
    }

    setImporting(true);
    
    try {
      // Leggi il file Excel
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      // Converti in JSON usando le traduzioni dei campi
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      if (jsonData.length < 2) {
        throw new Error('Il file deve contenere almeno una riga di dati oltre all\'header');
      }

      // Mappa i dati usando le traduzioni
      const headers = jsonData[0] as string[];
      const reverseTranslations = Object.fromEntries(
        Object.entries(FIELD_TRANSLATIONS).map(([key, value]) => [value, key])
      );

      // Alias per intestazioni comuni o con problemi di encoding (es. "Unità Prezzo")
      const HEADER_ALIASES: Record<string, keyof typeof FIELD_TRANSLATIONS> = {
        'UnitÃ  Prezzo': 'pricing_unit',
        'Unita Prezzo': 'pricing_unit'
      };

      const mappedData = (jsonData.slice(1) as unknown[][]).map((row) => {
        const rowData: Record<string, unknown> = {};
        headers.forEach((header, colIndex) => {
          const normalizedHeader = typeof header === 'string' ? header.trim() : header;
          const fieldKey = reverseTranslations[normalizedHeader] || HEADER_ALIASES[normalizedHeader] || normalizedHeader as string;
          let value = row[colIndex];
          
          // Converti i valori italiani in codici tecnici per i campi enum
          if (fieldKey === 'category' && value && typeof value === 'string') {
            value = REVERSE_CATEGORY_TRANSLATIONS[value] || value;
          }
          if (fieldKey === 'service_type' && value && typeof value === 'string') {
            value = REVERSE_SERVICE_TYPE_TRANSLATIONS[value] || value;
          }
          if (fieldKey === 'location_type' && value && typeof value === 'string') {
            value = REVERSE_LOCATION_TYPE_TRANSLATIONS[value] || value;
          }
          if (fieldKey === 'pricing_unit' && value && typeof value === 'string') {
            value = REVERSE_PRICING_UNIT_TRANSLATIONS[value] || value;
          }
          
          // Converti i valori booleani
          if (fieldKey === 'active' || fieldKey === 'featured') {
            const boolString = typeof value === 'string' ? value.trim() : value;
            if (typeof boolString === 'string' && boolString in BOOLEAN_TRANSLATIONS_MAP) {
              value = BOOLEAN_TRANSLATIONS_MAP[boolString];
            } else {
              value = boolString === 'TRUE' || boolString === true || boolString === 1;
            }
          }
          
          // Converti i numeri
          if (['base_price', 'duration_hours'].includes(fieldKey) && value !== undefined && value !== '') {
            value = parseFloat(value);
          }
          
          if (['max_participants', 'min_participants'].includes(fieldKey) && value !== undefined && value !== '') {
            value = parseInt(value);
          }
          
          // Converti le stringhe separate da virgole in array per i campi array
          if (['deliverables', 'service_areas', 'requirements', 'tags'].includes(fieldKey) && value && typeof value === 'string') {
            value = value.split(',').map(item => item.trim()).filter(item => item.length > 0);
          }
          
          rowData[fieldKey] = value;
        });
        return rowData;
      });

      // Valida i dati
      const validation = validateImportData(mappedData);
      
      if (!validation.valid) {
        setResult({
          success: false,
          imported: 0,
          errors: validation.errors,
          warnings: []
        });
        return;
      }

      // Importa i servizi nel database
      let importedCount = 0;
      const errors: string[] = [];
      const warnings: string[] = [];

      console.log('Mapped data before import:', mappedData);

      for (let i = 0; i < mappedData.length; i++) {
        try {
          console.log(`Processing row ${i + 1}:`, mappedData[i]);
          
          const serviceData = {
            ...mappedData[i],
            provider_id: user.id,
            currency: mappedData[i].currency || 'EUR',
            min_participants: mappedData[i].min_participants || 1,
            active: mappedData[i].active !== false,
            featured: mappedData[i].featured === true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { error } = await supabase.from('services').insert(serviceData);
          
          if (error) {
            errors.push(`Riga ${i + 1}: ${error.message}`);
          } else {
            importedCount++;
          }
        } catch (error) {
          console.error(`Error importing row ${i + 1}:`, error);
          errors.push(`Riga ${i + 1}: ${error instanceof Error ? error.message : 'Errore durante l\'importazione'}`);
        }
      }

      // Aggiungi avvisi per valori predefiniti utilizzati
      if (mappedData.some(item => !item.currency)) {
        warnings.push('Alcuni servizi non avevano valuta specificata, utilizzato EUR come predefinito');
      }
      if (mappedData.some(item => !item.min_participants)) {
        warnings.push('Alcuni servizi non avevano numero minimo partecipanti, utilizzato 1 come predefinito');
      }

      setResult({
        success: importedCount > 0,
        imported: importedCount,
        errors: errors,
        warnings: warnings
      });

      if (importedCount > 0) {
        toast.success(`${importedCount} servizi importati con successo!`);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Errore durante l\'importazione');
      setResult({
        success: false,
        imported: 0,
        errors: [error instanceof Error ? error.message : 'Errore durante l\'elaborazione del file'],
        warnings: []
      });
    } finally {
      setImporting(false);
    }
  };

  const resetImport = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <Link
              to="/dashboard"
              className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-1" />
              Dashboard
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Caricamento Servizi</h1>
          <p className="mt-2 text-gray-600">
            Importa i tuoi servizi in massa utilizzando un file Excel o CSV
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <InformationCircleIcon className="h-6 w-6 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-medium text-blue-900 mb-2">Come utilizzare questa funzionalità</h3>
              <ol className="list-decimal list-inside space-y-2 text-blue-800">
                <li>Scarica il template Excel/CSV cliccando sul pulsante qui sotto</li>
                <li>Compila il file con i dati dei tuoi servizi seguendo l'esempio fornito</li>
                <li>Carica il file compilato utilizzando il form di upload</li>
                <li>Verifica i risultati dell'importazione</li>
              </ol>
            </div>
          </div>
        </div>

        {/* Template Download */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Scarica Template</h2>
          <p className="text-gray-600 mb-4">
            Scarica il template Excel/CSV con tutti i campi necessari e un esempio di compilazione.
          </p>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
            Scarica Template
          </button>
        </div>

        {/* File Upload */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Carica File</h2>
          
          {!file ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <DocumentArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Seleziona il file da importare
              </p>
              <p className="text-gray-600 mb-4">
                Formati supportati: CSV, Excel (.xls, .xlsx)
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Seleziona File
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <DocumentArrowUpIcon className="h-8 w-8 text-green-600 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-600">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetImport}
                  className="text-red-600 hover:text-red-800 text-sm font-medium"
                >
                  Rimuovi
                </button>
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {importing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Importazione in corso...
                    </>
                  ) : (
                    <>
                      <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
                      Importa Servizi
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Risultati Importazione</h2>
            
            <div className={`p-4 rounded-lg mb-4 ${
              result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {result.success ? (
                  <CheckCircleIcon className="h-6 w-6 text-green-600 mr-3" />
                ) : (
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-3" />
                )}
                <div>
                  <p className={`font-medium ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                    {result.success ? 'Importazione completata' : 'Importazione fallita'}
                  </p>
                  <p className={`text-sm ${result.success ? 'text-green-700' : 'text-red-700'}`}>
                    {result.success 
                      ? `${result.imported} servizi importati con successo`
                      : 'Si sono verificati degli errori durante l\'importazione'
                    }
                  </p>
                </div>
              </div>
            </div>

            {result.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-yellow-900 mb-2">Avvisi:</h4>
                <ul className="list-disc list-inside space-y-1 text-yellow-800">
                  {result.warnings.map((warning, index) => (
                    <li key={index} className="text-sm">{warning}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.errors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-red-900 mb-2">Errori:</h4>
                <ul className="list-disc list-inside space-y-1 text-red-800">
                  {result.errors.map((error, index) => (
                    <li key={index} className="text-sm">{error}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex space-x-4">
              <button
                onClick={resetImport}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Importa Altri Servizi
              </button>
              <Link
                to="/my-services"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Visualizza I Miei Servizi
              </Link>
            </div>
          </div>
        )}

        {/* Field Reference */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Riferimento Campi</h2>
          <p className="text-gray-600 mb-4">
            Ecco la lista completa dei campi disponibili nel template Excel con le loro descrizioni:
          </p>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campo Excel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Obbligatorio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrizione / Valori Possibili
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.title}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Testo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sì</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.title}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Testo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sì</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.description}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Selezione</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sì</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.category}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.service_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Selezione</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sì</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.service_type}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.location_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Selezione</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sì</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.location_type}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.base_price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Numero</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sì</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.base_price}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.pricing_unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Selezione</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sì</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.pricing_unit}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.currency}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Selezione</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.currency}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.duration_hours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Numero</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.duration_hours}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.max_participants}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Numero</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.max_participants}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.min_participants}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Numero</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.min_participants}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.service_areas}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Testo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.service_areas}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.requirements}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Testo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.requirements}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.deliverables}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Testo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.deliverables}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.tags}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Testo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.tags}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.active}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sì/No</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.active}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.featured}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Sì/No</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.featured}</td>
                </tr>
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {FIELD_TRANSLATIONS.meta_description}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Testo</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">No</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{FIELD_DESCRIPTIONS.meta_description}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}