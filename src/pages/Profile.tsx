import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import {
  UserCircleIcon,
  MapPinIcon,
  PhoneIcon,
  AcademicCapIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { ClientProfile, ProviderProfile } from '../types';
import { ProfileImageUpload } from '../components/ui/ProfileImageUpload';
import { toast } from 'react-hot-toast';
import type { AppError } from '../types/errors';
import { getErrorMessage as getAppErrorMessage, isValidationError } from '../types/errors';
import { db } from '../lib/supabase';

// ✅ Componente per la visualizzazione degli errori
const ErrorDisplay = ({ error }: { error: string | null }) => {
  if (!error) return null;
  
  return (
    <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">
            Errore
          </h3>
          <div className="mt-2 text-sm text-red-700">
            {error}
          </div>
        </div>
      </div>
    </div>
  );
};

// Utilizziamo la funzione tipizzata da types/errors.ts

// ✅ SCHEMI DI VALIDAZIONE PER SEZIONE - CLIENT
const clientGeneralSchema = yup.object({
  company_name: yup.string().required('Nome azienda obbligatorio'),
  company_size: yup.string().oneOf(['micro', 'small', 'medium', 'large']).required('Dimensione azienda obbligatoria'),
  industry_sector: yup.string().required('Settore obbligatorio'),
  employees_count: yup.number().min(1, 'Numero dipendenti deve essere almeno 1').required('Numero dipendenti obbligatorio'),
  website: yup.string().url('URL non valido').nullable(),
  certifications: yup.array().of(yup.string()).nullable()
});

const clientAddressSchema = yup.object({
  legal_address: yup.object({
    street: yup.string().required('Via obbligatoria'),
    city: yup.string().required('Città obbligatoria'),
    province: yup.string().required('Provincia obbligatoria'),
    postal_code: yup.string().required('CAP obbligatorio'),
    region: yup.string().required('Regione obbligatoria'),
    country: yup.string().default('Italia')
  }).required()
});

const clientContactSchema = yup.object({
  vat_number: yup.string().required('Partita IVA obbligatoria'),
  fiscal_code: yup.string().required('Codice fiscale obbligatorio'),
  contact_person: yup.object({
    first_name: yup.string().required('Nome obbligatorio'),
    last_name: yup.string().required('Cognome obbligatorio'),
    role: yup.string().required('Ruolo obbligatorio'),
    email: yup.string().email('Email non valida').required('Email obbligatoria'),
    phone: yup.string().required('Telefono obbligatorio')
  }).required(),
  phone: yup.string().required('Telefono obbligatorio')
});

// ✅ SCHEMI DI VALIDAZIONE PER SEZIONE - PROVIDER
const providerGeneralSchema = yup.object({
  business_name: yup.string().required('Nome attività obbligatorio'),
  description: yup.string().required('Descrizione obbligatoria'),
  professional_order: yup.string().nullable(),
  registration_number: yup.string().nullable(),
  experience_years: yup.number().min(0, 'Anni esperienza non validi').required('Anni esperienza obbligatori'),
  team_size: yup.number().min(1, 'Dimensione team deve essere almeno 1').required('Dimensione team obbligatoria')
});

const providerAddressSchema = yup.object({
  address: yup.object({
    street: yup.string().required('Via obbligatoria'),
    city: yup.string().required('Città obbligatoria'),
    province: yup.string().required('Provincia obbligatoria'),
    postal_code: yup.string().required('CAP obbligatorio'),
    region: yup.string().required('Regione obbligatoria'),
    country: yup.string().default('Italia')
  }).required()
});

const providerContactSchema = yup.object({
  vat_number: yup.string().required('Partita IVA obbligatoria'),
  fiscal_code: yup.string().required('Codice fiscale obbligatorio'),
  contact_person: yup.object({
    first_name: yup.string().required('Nome obbligatorio'),
    last_name: yup.string().required('Cognome obbligatorio'),
    role: yup.string().required('Ruolo obbligatorio'),
    email: yup.string().email('Email non valida').required('Email obbligatoria'),
    phone: yup.string().required('Telefono obbligatorio')
  }).required(),
  phone: yup.string().required('Telefono obbligatorio')
});

const providerServicesSchema = yup.object({
  specializations: yup.array().of(yup.string()).min(1, 'Almeno una specializzazione richiesta'),
  service_areas: yup.array().of(yup.string()).min(1, 'Almeno un\'area di servizio richiesta'),
  languages: yup.array().of(yup.string()).min(1, 'Almeno una lingua richiesta')
});

export default function Profile() {
  const { user, updateProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState(null);
  // lastUpdateTime rimosso perché inutilizzato

  const isClient = user?.user_type === 'client';

  // ✅ FORM SENZA RESOLVER GLOBALE - VALIDAZIONE SOLO AL SALVATAGGIO
  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { errors }
  } = useForm<ClientProfile | ProviderProfile>({
    mode: 'onBlur', // Validazione meno aggressiva
    defaultValues: isClient ? {
      company_name: '',
      vat_number: '',
      fiscal_code: '',
      legal_address: {
        street: '',
        city: '',
        province: '',
        postal_code: '',
        region: '',
        country: 'Italia'
      },
      contact_person: {
        first_name: '',
        last_name: '',
        role: '',
        email: '',
        phone: ''
      },
      company_size: '',
      industry_sector: '',
      employees_count: 0,
      phone: '',
      website: '',
      certifications: []
    } : {
      business_name: '',
      description: '',
      address: {
        street: '',
        city: '',
        province: '',
        postal_code: '',
        region: '',
        country: 'Italia'
      },
      vat_number: '',
      fiscal_code: '',
      contact_person: {
        first_name: '',
        last_name: '',
        role: '',
        email: '',
        phone: ''
      },
      phone: '',
      specializations: [],
      service_areas: [],
      professional_order: '',
      registration_number: '',
      experience_years: 0,
      languages: [],
      team_size: 1
    }
  });

  // ✅ FUNZIONE PER OTTENERE LO SCHEMA DELLA SEZIONE CORRENTE
  const getCurrentSchema = () => {
    if (isClient) {
      switch (activeTab) {
        case 'general': return clientGeneralSchema;
        case 'address': return clientAddressSchema;
        case 'contact': return clientContactSchema;
        default: return clientGeneralSchema;
      }
    } else {
      switch (activeTab) {
        case 'general': return providerGeneralSchema;
        case 'address': return providerAddressSchema;
        case 'contact': return providerContactSchema;
        case 'services': return providerServicesSchema;
        default: return providerGeneralSchema;
      }
    }
  };

  // ✅ FUNZIONE PER SALVARE UNA SEZIONE SPECIFICA
  const saveSection = async () => {
    if (!updateProfile || saving) return;

    try {
      setSaving(true);
      setError(null);

      if (process.env.NODE_ENV === 'development') {
        console.log('🔥 Saving section:', activeTab);
      }

      // 1. Ottieni tutti i dati del form
      const formData = getValues();
      if (process.env.NODE_ENV === 'development') {
        console.log('📝 Form data:', formData);
      }
      
      // 2. Valida solo la sezione corrente
      const currentSchema = getCurrentSchema();
      
      // 3. Estrai solo i dati della sezione corrente
      let sectionData = {};
      
      if (isClient) {
        switch (activeTab) {
          case 'general':
            sectionData = {
              company_name: formData.company_name,
              company_size: formData.company_size,
              industry_sector: formData.industry_sector,
              employees_count: formData.employees_count,
              website: formData.website,
              certifications: formData.certifications
            };
            break;
          case 'address':
            sectionData = {
              legal_address: formData.legal_address
            };
            break;
          case 'contact':
            sectionData = {
              vat_number: formData.vat_number,
              fiscal_code: formData.fiscal_code,
              contact_person_name: formData.contact_person ? 
                `${formData.contact_person.first_name?.trim() || ''} ${formData.contact_person.last_name?.trim() || ''}`.trim() : '',
              contact_person_role: formData.contact_person?.role?.trim() || '',
              contact_person_email: formData.contact_person?.email?.trim() || '',
              contact_person_phone: formData.contact_person?.phone?.trim() || '',
              phone: formData.phone
            };
            break;
        }
      } else {
        switch (activeTab) {
          case 'general':
            sectionData = {
              business_name: formData.business_name,
              description: formData.description,
              professional_order: formData.professional_order,
              registration_number: formData.registration_number,
              experience_years: formData.experience_years,
              team_size: formData.team_size
            };
            break;
          case 'address':
            sectionData = {
              address: {
                street: formData.address?.street || '',
                city: formData.address?.city || '',
                province: formData.address?.province || '',
                postal_code: formData.address?.postal_code || '',
                region: formData.address?.region || '',
                country: formData.address?.country || 'Italy'
              }
            };
            break;
          case 'contact':
            sectionData = {
              vat_number: formData.vat_number,
              fiscal_code: formData.fiscal_code,
              contact_person_name: formData.contact_person ? 
                `${formData.contact_person.first_name?.trim() || ''} ${formData.contact_person.last_name?.trim() || ''}`.trim() : '',
              contact_person_role: formData.contact_person?.role?.trim() || '',
              contact_person_email: formData.contact_person?.email?.trim() || '',
              contact_person_phone: formData.contact_person?.phone?.trim() || '',
              phone: formData.phone
            };
            break;
          case 'services':
            sectionData = {
              specializations: formData.specializations,
              service_areas: formData.service_areas,
              languages: formData.languages
            };
            break;
        }
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('📋 Section data to validate:', sectionData);
      }

      // 4. Valida solo i dati della sezione
      // Per la sezione contact, valida formData invece di sectionData
      const dataToValidate = activeTab === 'contact' ? formData : sectionData;
      await currentSchema.validate(dataToValidate, { abortEarly: false });

      // 5. Prepara solo i dati della sezione per il salvataggio
      let sectionUpdate;
      if (user?.user_type === 'provider' && activeTab === 'address') {
        // Per i provider nella sezione address, estrai i campi dall'oggetto address
        sectionUpdate = {
          ...sectionData.address,
          updated_at: new Date().toISOString()
        };
      } else {
        sectionUpdate = {
          ...sectionData,
          updated_at: new Date().toISOString()
        };
      }

      if (process.env.NODE_ENV === 'development') {
        console.log('💾 Saving section update:', sectionUpdate);
      }

      // 6. Salva nel database solo i dati della sezione usando la funzione specifica per provider
      if (user?.user_type === 'provider') {
        await db.updateProviderProfile(user.id, sectionUpdate);
      } else {
        // Per i client, usa la funzione del context
        await updateProfile(sectionUpdate);
      }

      // 7. Unisci con i dati locali per aggiornare lo stato
      let updatedProfile;
      if (user?.user_type === 'provider' && activeTab === 'address') {
        // Per i provider, ricostruisci l'oggetto address per lo stato locale
        updatedProfile = {
          ...profileData,
          address: {
            street: sectionUpdate.street || '',
            city: sectionUpdate.city || '',
            province: sectionUpdate.province || '',
            postal_code: sectionUpdate.postal_code || '',
            region: sectionUpdate.region || '',
            country: sectionUpdate.country || 'Italy'
          },
          updated_at: new Date().toISOString()
        };
      } else {
        updatedProfile = {
          ...profileData,
          ...sectionData,
          updated_at: new Date().toISOString()
        };
      }

      // 7. Aggiorna lo stato locale
      setProfileData(updatedProfile);

      // 8. Notifica successo
      toast.success(`Sezione "${getTabLabel(activeTab)}" salvata con successo!`);

    } catch (error: AppError) {
      console.error('❌ Errore durante il salvataggio della sezione:', error);

      if (isValidationError(error)) {
        const validationErrors = error.inner?.map(err => err.message).join(', ') || error.message;
        setError(`Errori di validazione: ${validationErrors}`);
        toast.error(`Errori di validazione: ${validationErrors}`);
      } else {
        const errorMessage = getAppErrorMessage(error);
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } finally {
      setSaving(false);
    }
  };

  // ✅ FUNZIONE PER OTTENERE L'ETICHETTA DEL TAB
  const getTabLabel = (tab: string) => {
    const labels: { [key: string]: string } = {
      general: 'Informazioni Generali',
      address: 'Indirizzo',
      contact: 'Contatti',
      services: 'Servizi'
    };
    return labels[tab] || tab;
  };

  // ✅ Caricamento profilo
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true);
        setError(null);

        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Loading profile for user:', user);
        }

        if (user?.profile) {
          if (process.env.NODE_ENV === 'development') {
            console.log('✅ Profile loaded successfully:', user.profile);
          }
          
          // Popola i dati di contatto con le informazioni dell'utente se mancano
          const profileDataWithContact = {
            ...user.profile,
            contact_person: {
              ...user.profile.contact_person,
              email: user.profile.contact_person?.email || user.email || '',
              phone: user.profile.contact_person?.phone || user.phone || ''
            }
          };
          
          setProfileData(profileDataWithContact);
          reset(profileDataWithContact);
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('ℹ️ No profile found for user');
          }
          
          // Se non c'è un profilo, inizializza il form con i dati dell'utente
          
          if (isClient) {
            reset({
              company_name: '',
              vat_number: '',
              fiscal_code: '',
              legal_address: {
                street: '',
                city: '',
                province: '',
                postal_code: '',
                region: '',
                country: 'Italia'
              },
              contact_person: {
                first_name: '',
                last_name: '',
                role: '',
                email: user?.email || '',
                phone: user?.phone || ''
              },
              company_size: '',
              industry_sector: '',
              employees_count: 0,
              phone: user?.phone || '',
              website: '',
              certifications: []
            });
          } else {
            reset({
              business_name: '',
              description: '',
              address: {
                street: '',
                city: '',
                province: '',
                postal_code: '',
                region: '',
                country: 'Italia'
              },
              vat_number: '',
              fiscal_code: '',
              contact_person: {
                first_name: '',
                last_name: '',
                role: '',
                email: user?.email || '',
                phone: user?.phone || ''
              },
              phone: user?.phone || '',
              specializations: [],
              service_areas: [],
              professional_order: '',
              registration_number: '',
              experience_years: 0,
              languages: [],
              team_size: 1
            });
          }
        }
      } catch (error: AppError) {
        console.error('❌ Errore durante il caricamento del profilo:', error);
        setError('Errore durante il caricamento del profilo');
      } finally {
        setIsLoading(false);
      }
    };

    if (user && !loading) {
      loadProfile();
    } else if (!user && !loading) {
      setIsLoading(false);
    }
  }, [user, loading, reset, isClient]);

  // ✅ Controlli di sicurezza - Rimosso controllo ridondante, ora gestito da ProtectedRoute

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Caricamento profilo...</p>
        </div>
      </div>
    );
  }

  if (!updateProfile || typeof updateProfile !== 'function') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Errore di caricamento
          </h2>
          <p className="text-gray-600">
            Funzione di aggiornamento profilo non disponibile. Riprova più tardi.
          </p>
        </div>
      </div>
    );
  }

  // ✅ DATI PER LE OPZIONI
  const companySizes = [
    { value: 'micro', label: 'Micro (1-9 dipendenti)' },
    { value: 'small', label: 'Piccola (10-49 dipendenti)' },
    { value: 'medium', label: 'Media (50-249 dipendenti)' },
    { value: 'large', label: 'Grande (250+ dipendenti)' }
  ];

  const industrySectors = [
    'Manifatturiero',
    'Costruzioni',
    'Commercio',
    'Trasporti',
    'Servizi',
    'Sanità',
    'Istruzione',
    'Pubblica Amministrazione',
    'Altro'
  ];

  const specializations = [
    'Sicurezza sul lavoro',
    'Igiene industriale',
    'Medicina del lavoro',
    'Prevenzione incendi',
    'Ambiente',
    'Qualità',
    'Formazione',
    'Consulenza normativa'
  ];

  const languages = [
    'Italiano',
    'Inglese',
    'Francese',
    'Tedesco',
    'Spagnolo',
    'Altro'
  ];

  const italianRegions = [
    'Abruzzo', 'Basilicata', 'Calabria', 'Campania', 'Emilia-Romagna',
    'Friuli-Venezia Giulia', 'Lazio', 'Liguria', 'Lombardia', 'Marche',
    'Molise', 'Piemonte', 'Puglia', 'Sardegna', 'Sicilia', 'Toscana',
    'Trentino-Alto Adige', 'Umbria', 'Valle d\'Aosta', 'Veneto'
  ];

  // ✅ DEFINIZIONE DEI TAB
  const tabs = isClient ? [
    { id: 'general', name: 'Informazioni Generali', icon: UserCircleIcon },
    { id: 'address', name: 'Indirizzo', icon: MapPinIcon },
    { id: 'contact', name: 'Contatti', icon: PhoneIcon }
  ] : [
    { id: 'general', name: 'Informazioni Generali', icon: UserCircleIcon },
    { id: 'address', name: 'Indirizzo', icon: MapPinIcon },
    { id: 'contact', name: 'Contatti', icon: PhoneIcon },
    { id: 'services', name: 'Servizi', icon: AcademicCapIcon }
  ];

  return (
    <Layout>
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg">
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900">
              Profilo {isClient ? 'Cliente' : 'Fornitore'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              Gestisci le informazioni del tuo profilo
            </p>
          </div>

          {/* Error Display */}
          <ErrorDisplay error={error} />

          {/* Profile Image */}
          <div className="px-6 py-4 border-b border-gray-200">
            <ProfileImageUpload 
              bucket="profile-images"
              path={`${user?.id || 'temp'}`}
              currentImageUrl={profileData?.profile_image_url}
              onUploadComplete={async (url) => {
                try {
                  // Aggiorna lo stato locale
                  setProfileData(prev => prev ? { ...prev, profile_image_url: url } : null);
                  
                  // Salva nel database
                  if (user?.user_type === 'provider') {
                    await db.updateProviderProfile(user.id, { profile_image_url: url });
                  } else {
                    await db.updateUserProfile(user.id, { profile_image_url: url });
                  }
                  
                  toast.success('Immagine profilo aggiornata!');
                } catch (error) {
                  console.error('Errore nel salvare l\'immagine profilo:', error);
                  toast.error('Errore nel salvare l\'immagine profilo');
                }
              }}
              onUploadError={(error) => {
                console.error('Errore upload immagine:', error);
                toast.error(`Errore upload: ${error}`);
              }}
            />
          </div>

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <tab.icon className="h-5 w-5 mr-2" />
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>

          {/* Form Content */}
          <div className="px-6 py-6">
            <form onSubmit={handleSubmit(() => {})}>
              {/* Informazioni Generali */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Informazioni Generali
                  </h3>
                  
                  {isClient ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nome Azienda *
                        </label>
                        <input
                          type="text"
                          {...register('company_name')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.company_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.company_name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Dimensione Azienda *
                        </label>
                        <select
                          {...register('company_size')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Seleziona dimensione</option>
                          {companySizes.map((size) => (
                            <option key={size.value} value={size.value}>
                              {size.label}
                            </option>
                          ))}
                        </select>
                        {errors.company_size && (
                          <p className="mt-1 text-sm text-red-600">{errors.company_size.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Settore *
                        </label>
                        <select
                          {...register('industry_sector')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Seleziona settore</option>
                          {industrySectors.map((sector) => (
                            <option key={sector} value={sector}>
                              {sector}
                            </option>
                          ))}
                        </select>
                        {errors.industry_sector && (
                          <p className="mt-1 text-sm text-red-600">{errors.industry_sector.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Numero Dipendenti *
                        </label>
                        <input
                          type="number"
                          min="1"
                          {...register('employees_count', { valueAsNumber: true })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.employees_count && (
                          <p className="mt-1 text-sm text-red-600">{errors.employees_count.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Sito Web
                        </label>
                        <input
                          type="url"
                          {...register('website')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.website && (
                          <p className="mt-1 text-sm text-red-600">{errors.website.message}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nome Attività *
                        </label>
                        <input
                          type="text"
                          {...register('business_name')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.business_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.business_name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Descrizione *
                        </label>
                        <textarea
                          rows={4}
                          {...register('description')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.description && (
                          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Anni di Esperienza *
                        </label>
                        <input
                          type="number"
                          min="0"
                          {...register('experience_years', { valueAsNumber: true })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.experience_years && (
                          <p className="mt-1 text-sm text-red-600">{errors.experience_years.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Dimensione Team *
                        </label>
                        <input
                          type="number"
                          min="1"
                          {...register('team_size', { valueAsNumber: true })}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.team_size && (
                          <p className="mt-1 text-sm text-red-600">{errors.team_size.message}</p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Indirizzo */}
              {activeTab === 'address' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Indirizzo
                  </h3>
                  
                  {isClient ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Via *
                        </label>
                        <input
                          type="text"
                          {...register('legal_address.street')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.legal_address?.street && (
                          <p className="mt-1 text-sm text-red-600">{errors.legal_address.street.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Città *
                          </label>
                          <input
                            type="text"
                            {...register('legal_address.city')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.legal_address?.city && (
                            <p className="mt-1 text-sm text-red-600">{errors.legal_address.city.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            CAP *
                          </label>
                          <input
                            type="text"
                            {...register('legal_address.postal_code')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.legal_address?.postal_code && (
                            <p className="mt-1 text-sm text-red-600">{errors.legal_address.postal_code.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Provincia *
                          </label>
                          <input
                            type="text"
                            {...register('legal_address.province')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.legal_address?.province && (
                            <p className="mt-1 text-sm text-red-600">{errors.legal_address.province.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Regione *
                          </label>
                          <select
                            {...register('legal_address.region')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleziona regione</option>
                            {italianRegions.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                          {errors.legal_address?.region && (
                            <p className="mt-1 text-sm text-red-600">{errors.legal_address.region.message}</p>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Via *
                        </label>
                        <input
                          type="text"
                          {...register('address.street')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.address?.street && (
                          <p className="mt-1 text-sm text-red-600">{errors.address.street.message}</p>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Città *
                          </label>
                          <input
                            type="text"
                            {...register('address.city')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.address?.city && (
                            <p className="mt-1 text-sm text-red-600">{errors.address.city.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            CAP *
                          </label>
                          <input
                            type="text"
                            {...register('address.postal_code')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.address?.postal_code && (
                            <p className="mt-1 text-sm text-red-600">{errors.address.postal_code.message}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Provincia *
                          </label>
                          <input
                            type="text"
                            {...register('address.province')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          />
                          {errors.address?.province && (
                            <p className="mt-1 text-sm text-red-600">{errors.address.province.message}</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700">
                            Regione *
                          </label>
                          <select
                            {...register('address.region')}
                            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="">Seleziona regione</option>
                            {italianRegions.map((region) => (
                              <option key={region} value={region}>
                                {region}
                              </option>
                            ))}
                          </select>
                          {errors.address?.region && (
                            <p className="mt-1 text-sm text-red-600">{errors.address.region.message}</p>
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Contatti */}
              {activeTab === 'contact' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Informazioni di Contatto
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Partita IVA *
                      </label>
                      <input
                        type="text"
                        {...register('vat_number')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.vat_number && (
                        <p className="mt-1 text-sm text-red-600">{errors.vat_number.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Codice Fiscale *
                      </label>
                      <input
                        type="text"
                        {...register('fiscal_code')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.fiscal_code && (
                        <p className="mt-1 text-sm text-red-600">{errors.fiscal_code.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">
                      Persona di Contatto
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Nome *
                        </label>
                        <input
                          type="text"
                          {...register('contact_person.first_name')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.contact_person?.first_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.contact_person.first_name.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Cognome *
                        </label>
                        <input
                          type="text"
                          {...register('contact_person.last_name')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.contact_person?.last_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.contact_person.last_name.message}</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">
                        Ruolo *
                      </label>
                      <input
                        type="text"
                        {...register('contact_person.role')}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                      />
                      {errors.contact_person?.role && (
                        <p className="mt-1 text-sm text-red-600">{errors.contact_person.role.message}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Email *
                        </label>
                        <input
                          type="email"
                          {...register('contact_person.email')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.contact_person?.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.contact_person.email.message}</p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Telefono *
                        </label>
                        <input
                          type="tel"
                          {...register('contact_person.phone')}
                          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        {errors.contact_person?.phone && (
                          <p className="mt-1 text-sm text-red-600">{errors.contact_person.phone.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Telefono Principale *
                    </label>
                    <input
                      type="tel"
                      {...register('phone')}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Servizi (solo per provider) */}
              {!isClient && activeTab === 'services' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">
                    Servizi e Specializzazioni
                  </h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specializzazioni *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {specializations.map((spec) => (
                        <label key={spec} className="flex items-center">
                          <input
                            type="checkbox"
                            value={spec}
                            {...register('specializations')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{spec}</span>
                        </label>
                      ))}
                    </div>
                    {errors.specializations && (
                      <p className="mt-1 text-sm text-red-600">{errors.specializations.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Aree di Servizio *
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {italianRegions.map((region) => (
                        <label key={region} className="flex items-center">
                          <input
                            type="checkbox"
                            value={region}
                            {...register('service_areas')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{region}</span>
                        </label>
                      ))}
                    </div>
                    {errors.service_areas && (
                      <p className="mt-1 text-sm text-red-600">{errors.service_areas.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Lingue *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {languages.map((lang) => (
                        <label key={lang} className="flex items-center">
                          <input
                            type="checkbox"
                            value={lang}
                            {...register('languages')}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">{lang}</span>
                        </label>
                      ))}
                    </div>
                    {errors.languages && (
                      <p className="mt-1 text-sm text-red-600">{errors.languages.message}</p>
                    )}
                  </div>
                </div>
              )}

              {/* ✅ PULSANTE DI SALVATAGGIO PER SEZIONE */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={saveSection}
                  disabled={saving}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Salvataggio...
                    </>
                  ) : (
                    <>
                      <ShieldCheckIcon className="h-5 w-5 mr-2" />
                      Salva {getTabLabel(activeTab)}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}