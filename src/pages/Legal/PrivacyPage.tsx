import React from 'react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Informativa sulla Privacy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Introduzione
              </h2>
              <p className="text-gray-700 mb-4">
                BookingHSE rispetta la tua privacy e si impegna a proteggere i tuoi dati personali.
                Questa informativa spiega come raccogliamo, utilizziamo e proteggiamo le tue informazioni.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Dati che Raccogliamo
              </h2>
              <p className="text-gray-700 mb-4">
                Raccogliamo i seguenti tipi di informazioni:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Informazioni di registrazione (nome, email, telefono)</li>
                <li>Informazioni di profilo professionale</li>
                <li>Dati di utilizzo della piattaforma</li>
                <li>Informazioni di pagamento (elaborate da fornitori terzi)</li>
                <li>Cookie e tecnologie simili</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Come Utilizziamo i Tuoi Dati
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizziamo i tuoi dati per:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Fornire e migliorare i nostri servizi</li>
                <li>Facilitare le prenotazioni e i pagamenti</li>
                <li>Comunicare con te riguardo ai servizi</li>
                <li>Garantire la sicurezza della piattaforma</li>
                <li>Rispettare gli obblighi legali</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Condivisione dei Dati
              </h2>
              <p className="text-gray-700 mb-4">
                Condividiamo i tuoi dati solo quando necessario:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Con fornitori di servizi per completare le prenotazioni</li>
                <li>Con fornitori di servizi di pagamento</li>
                <li>Per rispettare obblighi legali</li>
                <li>Con il tuo consenso esplicito</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Sicurezza dei Dati
              </h2>
              <p className="text-gray-700 mb-4">
                Implementiamo misure di sicurezza tecniche e organizzative appropriate per proteggere
                i tuoi dati personali da accesso non autorizzato, alterazione, divulgazione o distruzione.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. I Tuoi Diritti
              </h2>
              <p className="text-gray-700 mb-4">
                Hai il diritto di:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Accedere ai tuoi dati personali</li>
                <li>Correggere dati inesatti</li>
                <li>Richiedere la cancellazione dei tuoi dati</li>
                <li>Limitare il trattamento dei tuoi dati</li>
                <li>Portabilità dei dati</li>
                <li>Opporti al trattamento</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Cookie
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizziamo cookie per migliorare la tua esperienza sulla piattaforma.
                Puoi gestire le preferenze dei cookie nelle impostazioni del tuo browser.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Contatti
              </h2>
              <p className="text-gray-700 mb-4">
                Per domande sulla privacy o per esercitare i tuoi diritti, contattaci all'indirizzo:
                privacy@bookinghse.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;