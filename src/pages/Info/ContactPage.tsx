import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import Layout from '../../components/Layout/Layout';
import { toast } from 'react-hot-toast';

// Schema di validazione per il form contatti
const contactSchema = yup.object({
  name: yup.string().required('Il nome è obbligatorio'),
  email: yup.string().email('Email non valida').required('Email obbligatoria'),
  phone: yup.string().optional(),
  company: yup.string().optional(),
  subject: yup.string().required('Il soggetto è obbligatorio'),
  message: yup.string().min(10, 'Il messaggio deve essere di almeno 10 caratteri').required('Il messaggio è obbligatorio'),
  privacy: yup.boolean().oneOf([true], 'Devi accettare la privacy policy').required()
});

type ContactFormData = yup.InferType<typeof contactSchema>;

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  // Scroll automatico all'inizio della pagina quando viene caricata
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ContactFormData>({
    resolver: yupResolver(contactSchema)
  });

  const onSubmit = async (data: ContactFormData) => {
    setLoading(true);
    
    try {
      // Invio effettivo tramite API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Errore durante l\'invio del messaggio');
      }
      
      toast.success('Messaggio inviato con successo! Ti risponderemo al più presto.');
      reset();
    } catch (error) {
      console.error('Errore invio contatto:', error);
      toast.error(
        error instanceof Error 
          ? error.message 
          : 'Errore durante l\'invio del messaggio. Riprova più tardi.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="bg-white min-h-screen">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Contattaci
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hai domande, suggerimenti o bisogno di supporto? Il nostro team è qui per aiutarti.
              Compila il form qui sotto e ti risponderemo al più presto.
            </p>
          </div>
        </div>

        {/* Contact Form Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome */}
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Nome e Cognome *
                    </label>
                    <input
                      {...register('name')}
                      id="name"
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Mario Rossi"
                    />
                    {errors.name && (
                      <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email *
                    </label>
                    <input
                      {...register('email')}
                      id="email"
                      type="email"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="mario.rossi@azienda.com"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  {/* Telefono */}
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      Telefono
                    </label>
                    <input
                      {...register('phone')}
                      id="phone"
                      type="tel"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="+39 123 456 7890"
                    />
                  </div>

                  {/* Azienda */}
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
                      Azienda
                    </label>
                    <input
                      {...register('company')}
                      id="company"
                      type="text"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Nome azienda"
                    />
                  </div>
                </div>

                {/* Soggetto */}
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Soggetto *
                  </label>
                  <select
                    {...register('subject')}
                    id="subject"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleziona un soggetto</option>
                    <option value="supporto">Supporto Tecnico</option>
                    <option value="informazioni">Informazioni Generali</option>
                    <option value="partnership">Partnership</option>
                    <option value="lavora-con-noi">Lavora con Noi</option>
                    <option value="altro">Altro</option>
                  </select>
                  {errors.subject && (
                    <p className="mt-1 text-sm text-red-600">{errors.subject.message}</p>
                  )}
                </div>

                {/* Messaggio */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Messaggio *
                  </label>
                  <textarea
                    {...register('message')}
                    id="message"
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Descrivi la tua richiesta in dettaglio..."
                  />
                  {errors.message && (
                    <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
                  )}
                </div>

                {/* Privacy Policy */}
                <div className="flex items-start">
                  <input
                    {...register('privacy')}
                    id="privacy"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                  />
                  <label htmlFor="privacy" className="ml-3 block text-sm text-gray-700">
                    Accetto la{' '}
                    <a href="/privacy" className="text-blue-600 hover:text-blue-500">
                      privacy policy
                    </a>
                    {' '}e autorizzo il trattamento dei miei dati personali
                  </label>
                </div>
                {errors.privacy && (
                  <p className="mt-1 text-sm text-red-600">{errors.privacy.message}</p>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold py-4 px-6 rounded-lg transition-colors"
                >
                  {loading ? 'Invio in corso...' : 'Invia Messaggio'}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Contact Info Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Altri Modi per Contattarci
              </h2>
              <p className="text-xl text-gray-600">
                Preferisci contattarci direttamente? Ecco come puoi raggiungerci
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Supporto Clienti',
                  description: 'Per assistenza tecnica e domande sui servizi',
                  email: 'support@bookinghse.com',
                  phone: '+39 02 1234 5678',
                  hours: 'Lun-Ven: 9:00-18:00',
                  icon: '🎯'
                },
                {
                  title: 'Informazioni Commerciali',
                  description: 'Per partnership e collaborazioni commerciali',
                  email: 'commerciale@bookinghse.com',
                  phone: '+39 02 1234 5679',
                  hours: 'Lun-Ven: 9:00-17:00',
                  icon: '💼'
                },
                {
                  title: 'Amministrazione',
                  description: 'Per questioni amministrative e fatturazione',
                  email: 'amministrazione@bookinghse.com',
                  phone: '+39 02 1234 5680',
                  hours: 'Lun-Ven: 9:00-13:00, 14:00-17:00',
                  icon: '📋'
                }
              ].map((contact, index) => (
                <div key={index} className="text-center p-6 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-4xl mb-4">{contact.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{contact.title}</h3>
                  <p className="text-gray-600 mb-4">{contact.description}</p>
                  
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Email:</strong><br />
                      <a href={`mailto:${contact.email}`} className="text-blue-600 hover:text-blue-500">
                        {contact.email}
                      </a>
                    </div>
                    <div>
                      <strong>Telefono:</strong><br />
                      <a href={`tel:${contact.phone}`} className="text-blue-600 hover:text-blue-500">
                        {contact.phone}
                      </a>
                    </div>
                    <div>
                      <strong>Orari:</strong><br />
                      {contact.hours}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Domande Frequenti
              </h2>
              <p className="text-xl text-gray-600">
                Risposte rapide alle domande più comuni
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: 'Quanto tempo ci vuole per ricevere una risposta?',
                  answer: 'Rispondiamo a tutte le richieste entro 24 ore lavorative. Per urgenze, contattaci telefonicamente.'
                },
                {
                  question: 'Posso richiedere un preventivo personalizzato?',
                  answer: 'Sì, utilizza il form contatti selezionando "Informazioni Generali" come soggetto e descrivi le tue esigenze.'
                },
                {
                  question: 'Come posso diventare un fornitore sulla piattaforma?',
                  answer: 'Compila il form contatti selezionando "Partnership" come soggetto e il nostro team commerciale ti contatterà.'
                },
                {
                  question: 'Offrite supporto per l\'implementazione dei servizi?',
                  answer: 'Sì, il nostro team di supporto può aiutarti nella scelta e implementazione dei servizi HSE più adatti.'
                }
              ].map((faq, index) => (
                <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">{faq.question}</h3>
                  <p className="text-gray-700">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}