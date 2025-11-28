import React from 'react';
import Layout from '../../components/Layout/Layout';
import HowItWorks from '../../components/Home/HowItWorks';

export default function HowItWorksPage() {
  return (
    <Layout>
      <div className="bg-white">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-blue-50 via-white to-blue-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Come Funziona BookingHSE
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Scopri quanto è semplice trovare e prenotare i migliori servizi HSE 
              per la tua azienda. La nostra piattaforma ti guida passo dopo passo 
              verso la soluzione perfetta per le tue esigenze di sicurezza, salute e ambiente.
            </p>
          </div>
        </div>

        {/* How It Works Component */}
        <HowItWorks />

        {/* Additional Benefits Section */}
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Perché Scegliere BookingHSE
              </h2>
              <p className="text-xl text-gray-600">
                I vantaggi che rendono la nostra piattaforma la scelta ideale per le tue esigenze HSE
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  title: 'Fornitori Verificati',
                  description: 'Tutti i fornitori sono accuratamente verificati e possiedono le certificazioni necessarie per operare nel settore HSE.',
                  icon: '🛡️'
                },
                {
                  title: 'Prezzi Trasparenti',
                  description: 'Nessun costo nascosto. Tutti i prezzi sono chiari e trasparenti fin dall\'inizio, con preventivi dettagliati.',
                  icon: '💰'
                },
                {
                  title: 'Supporto Dedicato',
                  description: 'Il nostro team di esperti HSE è sempre disponibile per aiutarti a trovare la soluzione più adatta.',
                  icon: '🎯'
                },
                {
                  title: 'Documentazione Completa',
                  description: 'Ricevi tutta la documentazione necessaria in formato digitale, sempre accessibile dalla tua dashboard.',
                  icon: '📋'
                },
                {
                  title: 'Conformità Normativa',
                  description: 'Tutti i servizi rispettano le normative vigenti in materia di sicurezza sul lavoro e ambiente.',
                  icon: '⚖️'
                },
                {
                  title: 'Gestione Semplificata',
                  description: 'Dashboard intuitiva per gestire tutte le tue prenotazioni, documenti e scadenze in un unico posto.',
                  icon: '📊'
                }
              ].map((benefit, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                  <div className="text-4xl mb-4">{benefit.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{benefit.title}</h3>
                  <p className="text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Domande Frequenti
              </h2>
              <p className="text-xl text-gray-600">
                Le risposte alle domande più comuni su BookingHSE
              </p>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: 'Come posso essere sicuro della qualità dei fornitori?',
                  answer: 'Tutti i fornitori sulla nostra piattaforma sono accuratamente verificati. Controlliamo le loro certificazioni, assicurazioni e referenze. Inoltre, il sistema di recensioni ti permette di vedere le esperienze di altri clienti.'
                },
                {
                  question: 'Quanto tempo ci vuole per ricevere una risposta?',
                  answer: 'Per i servizi con prenotazione immediata, ricevi conferma istantanea. Per i servizi su richiesta, i fornitori rispondono entro 24 ore con un preventivo dettagliato.'
                },
                {
                  question: 'Posso cancellare una prenotazione?',
                  answer: 'Sì, puoi cancellare una prenotazione seguendo le condizioni specificate dal fornitore. Generalmente è richiesto un preavviso di almeno 24-48 ore.'
                },
                {
                  question: 'Come funziona il pagamento?',
                  answer: 'Il pagamento avviene in modo sicuro attraverso la piattaforma. Puoi pagare con carta di credito, bonifico o altri metodi supportati. Il pagamento viene richiesto solo dopo la conferma del servizio.'
                },
                {
                  question: 'Ricevo la documentazione necessaria?',
                  answer: 'Sì, tutti i documenti (certificati, attestati, relazioni) vengono caricati nella tua dashboard personale in formato digitale, sempre accessibili quando ne hai bisogno.'
                }
              ].map((faq, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
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