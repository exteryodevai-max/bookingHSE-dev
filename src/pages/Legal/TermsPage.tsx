import React from 'react';

const TermsPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Termini e Condizioni di Servizio
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Accettazione dei Termini
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizzando BookingHSE, accetti di essere vincolato da questi termini e condizioni di servizio.
                Se non accetti questi termini, non utilizzare il nostro servizio.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Descrizione del Servizio
              </h2>
              <p className="text-gray-700 mb-4">
                BookingHSE è una piattaforma che connette clienti con fornitori di servizi HSE (Health, Safety & Environment).
                Facilitiamo la prenotazione e la gestione di servizi professionali nel settore della sicurezza sul lavoro.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Registrazione e Account
              </h2>
              <p className="text-gray-700 mb-4">
                Per utilizzare alcuni servizi, devi creare un account fornendo informazioni accurate e complete.
                Sei responsabile della sicurezza del tuo account e password.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Responsabilità degli Utenti
              </h2>
              <p className="text-gray-700 mb-4">
                Gli utenti sono responsabili del contenuto che pubblicano e delle interazioni con altri utenti.
                È vietato utilizzare la piattaforma per attività illegali o dannose.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Pagamenti e Rimborsi
              </h2>
              <p className="text-gray-700 mb-4">
                I pagamenti vengono elaborati attraverso fornitori di servizi di pagamento sicuri.
                Le politiche di rimborso variano in base al tipo di servizio prenotato.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Limitazione di Responsabilità
              </h2>
              <p className="text-gray-700 mb-4">
                BookingHSE agisce come intermediario tra clienti e fornitori di servizi.
                Non siamo responsabili per la qualità dei servizi forniti dai professionisti sulla piattaforma.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Modifiche ai Termini
              </h2>
              <p className="text-gray-700 mb-4">
                Ci riserviamo il diritto di modificare questi termini in qualsiasi momento.
                Le modifiche saranno comunicate agli utenti e entreranno in vigore dopo la pubblicazione.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Contatti
              </h2>
              <p className="text-gray-700 mb-4">
                Per domande sui termini di servizio, contattaci all'indirizzo: legal@bookinghse.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsPage;