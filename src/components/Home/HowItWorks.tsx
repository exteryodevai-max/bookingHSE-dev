import React from 'react';
import { Link } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  StarIcon
} from '@heroicons/react/24/outline';

const steps = [
  {
    id: 1,
    name: 'Cerca e Confronta',
    description: 'Trova i migliori fornitori HSE nella tua zona. Confronta prezzi, recensioni e specializzazioni per scegliere il servizio più adatto alle tue esigenze.',
    icon: MagnifyingGlassIcon,
    color: 'bg-blue-500',
    features: [
      'Ricerca per località e categoria',
      'Filtri avanzati per specializzazione',
      'Confronto prezzi trasparente',
      'Recensioni verificate'
    ]
  },
  {
    id: 2,
    name: 'Prenota Facilmente',
    description: 'Prenota il servizio direttamente online o richiedi un preventivo personalizzato. Gestisci tutto dalla tua dashboard personale.',
    icon: CalendarDaysIcon,
    color: 'bg-green-500',
    features: [
      'Prenotazione istantanea o su richiesta',
      'Calendario disponibilità in tempo reale',
      'Pagamento sicuro online',
      'Conferma immediata'
    ]
  },
  {
    id: 3,
    name: 'Ricevi il Servizio',
    description: 'Il fornitore eroga il servizio secondo gli accordi. Ricevi tutta la documentazione necessaria e le certificazioni richieste.',
    icon: CheckCircleIcon,
    color: 'bg-purple-500',
    features: [
      'Servizio professionale garantito',
      'Documentazione completa',
      'Certificazioni digitali',
      'Supporto dedicato'
    ]
  },
  {
    id: 4,
    name: 'Valuta e Recensisci',
    description: 'Lascia una recensione per aiutare altri clienti. Il tuo feedback contribuisce a mantenere alta la qualità dei servizi sulla piattaforma.',
    icon: StarIcon,
    color: 'bg-orange-500',
    features: [
      'Sistema di rating trasparente',
      'Recensioni verificate',
      'Feedback costruttivo',
      'Miglioramento continuo'
    ]
  }
];

export default function HowItWorks() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Come Funziona BookingHSE
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Prenotare servizi HSE non è mai stato così semplice. 
            Segui questi 4 semplici passaggi per trovare e prenotare 
            il servizio perfetto per la tua azienda.
          </p>
        </div>

        <div className="relative">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step) => {
              const IconComponent = step.icon;
              return (
                <div key={step.id} className="relative">
                  {/* Step Number */}
                  <div className="flex items-center justify-center mb-6">
                    <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center relative z-10 shadow-lg`}>
                      <IconComponent className="h-8 w-8 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 bg-white border-2 border-gray-200 rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold text-gray-700 z-20">
                      {step.id}
                    </div>
                  </div>

                  <div className="text-center">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      {step.name}
                    </h3>
                    <p className="text-gray-600 mb-6">
                      {step.description}
                    </p>

                    {/* Features List */}
                    <ul className="text-left space-y-2">
                      {step.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-600">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-center mt-16">
          <div className="bg-blue-50 rounded-2xl p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Pronto per Iniziare?
            </h3>
            <p className="text-gray-600 mb-6">
              Unisciti a migliaia di aziende che hanno già scelto BookingHSE 
              per i loro servizi di sicurezza, salute e ambiente.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/search"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-lg transition-colors duration-200"
              >
                Cerca Servizi
              </Link>
              <Link
                to="/auth/register"
                className="bg-white hover:bg-gray-50 text-blue-600 font-semibold px-8 py-3 rounded-lg border-2 border-blue-600 transition-colors duration-200"
              >
                Registrati Gratis
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}