import React from 'react';
import { Link } from 'react-router-dom';
import {
  CurrencyEuroIcon,
  ChartBarIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Layout from '../../components/Layout/Layout';

export default function ForProvidersPage() {
  const benefits = [
    {
      icon: UserGroupIcon,
      title: 'Raggiungi Nuovi Clienti',
      description: 'Accedi a migliaia di aziende che cercano servizi HSE qualificati nella tua zona.',
      color: 'bg-blue-500'
    },
    {
      icon: CurrencyEuroIcon,
      title: 'Aumenta i Ricavi',
      description: 'Ottimizza la tua agenda e massimizza i guadagni con prenotazioni costanti.',
      color: 'bg-green-500'
    },
    {
      icon: ChartBarIcon,
      title: 'Gestione Semplificata',
      description: 'Dashboard completa per gestire prenotazioni, clienti e pagamenti in un unico posto.',
      color: 'bg-purple-500'
    },
    {
      icon: ShieldCheckIcon,
      title: 'Credibilità Professionale',
      description: 'Profilo verificato e recensioni autentiche aumentano la tua reputazione.',
      color: 'bg-orange-500'
    },
    {
      icon: ClockIcon,
      title: 'Risparmia Tempo',
      description: 'Automatizza la gestione delle prenotazioni e riduci il lavoro amministrativo.',
      color: 'bg-indigo-500'
    },
    {
      icon: DocumentTextIcon,
      title: 'Supporto Completo',
      description: 'Assistenza dedicata e strumenti per gestire contratti e documentazione.',
      color: 'bg-red-500'
    }
  ];

  const features = [
    'Profilo professionale personalizzabile',
    'Calendario disponibilità integrato',
    'Sistema di prenotazioni automatizzato',
    'Gestione pagamenti sicura',
    'Chat diretta con i clienti',
    'Analytics e reportistica avanzata',
    'App mobile per gestire tutto in movimento',
    'Supporto clienti dedicato'
  ];

  const testimonials = [
    {
      name: 'Marco Rossi',
      role: 'Consulente HSE',
      company: 'Studio Sicurezza Milano',
      content: 'BookingHSE ha trasformato il mio business. In 6 mesi ho triplicato i clienti e ottimizzato completamente la gestione delle prenotazioni.',
      rating: 5
    },
    {
      name: 'Laura Bianchi',
      role: 'Medico Competente',
      company: 'Salute & Lavoro',
      content: 'Piattaforma eccellente per raggiungere nuove aziende. Il sistema di recensioni mi ha aiutato a costruire una solida reputazione online.',
      rating: 5
    },
    {
      name: 'Giuseppe Verde',
      role: 'Formatore Sicurezza',
      company: 'Formazione HSE Pro',
      content: 'Gestire le prenotazioni non è mai stato così semplice. Dashboard intuitiva e supporto clienti sempre disponibile.',
      rating: 5
    }
  ];

  return (
    <Layout>
      <div className="bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                Fai Crescere il Tuo Business HSE
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Unisciti alla rete di fornitori HSE più grande d'Italia. 
                Raggiungi migliaia di aziende, gestisci le prenotazioni automaticamente 
                e fai crescere i tuoi ricavi con BookingHSE.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/register?type=provider"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
                >
                  Registrati Come Fornitore
                </Link>
                <button className="bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-3 rounded-lg border-2 border-blue-600 transition-colors duration-200">
                  Richiedi Demo Gratuita
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Perché Scegliere BookingHSE
              </h2>
              <p className="text-xl text-gray-600">
                I vantaggi concreti per il tuo business HSE
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {benefits.map((benefit, index) => {
                const IconComponent = benefit.icon;
                return (
                  <div key={index} className="text-center">
                    <div className={`${benefit.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-6">
                  Tutto Quello Che Ti Serve per Avere Successo
                </h2>
                <p className="text-lg text-gray-600 mb-8">
                  La nostra piattaforma ti offre tutti gli strumenti necessari 
                  per gestire e far crescere la tua attività HSE in modo professionale ed efficiente.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">Inizia Subito</h3>
                  <p className="text-gray-600">Registrazione gratuita e commissioni competitive</p>
                </div>
                
                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Registrazione</span>
                    <span className="font-semibold text-green-600">Gratuita</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Canone mensile</span>
                    <span className="font-semibold text-green-600">€0</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-200">
                    <span className="text-gray-600">Commissione per prenotazione</span>
                    <span className="font-semibold text-blue-600">Custom</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">Supporto clienti</span>
                    <span className="font-semibold text-blue-600">Incluso</span>
                  </div>
                </div>
                
                <Link
                  to="/register?type=provider"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors text-center block"
                >
                  Registrati Ora
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Cosa Dicono i Nostri Fornitori
              </h2>
              <p className="text-xl text-gray-600">
                Storie di successo di professionisti HSE che hanno scelto BookingHSE
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <svg key={i} className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  <p className="text-gray-700 mb-4 italic">"{testimonial.content}"</p>
                  
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.name}</div>
                    <div className="text-sm text-gray-600">{testimonial.role}</div>
                    <div className="text-sm text-gray-500">{testimonial.company}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Pronto a Far Crescere il Tuo Business?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Unisciti a centinaia di fornitori HSE che hanno già scelto BookingHSE 
              per espandere la loro clientela e aumentare i ricavi.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register?type=provider"
                className="bg-white hover:bg-gray-100 text-blue-600 font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
              >
                Inizia Gratis Oggi
              </Link>
              <button className="bg-blue-700 hover:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200">
                Contatta il Nostro Team
              </button>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}