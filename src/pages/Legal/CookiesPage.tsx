import React from 'react';

const CookiesPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Politica sui Cookie
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-600 mb-6">
              Ultimo aggiornamento: {new Date().toLocaleDateString('it-IT')}
            </p>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Cosa sono i Cookie
              </h2>
              <p className="text-gray-700 mb-4">
                I cookie sono piccoli file di testo che vengono memorizzati sul tuo dispositivo quando visiti
                il nostro sito web. Ci aiutano a fornire una migliore esperienza utente e a comprendere
                come viene utilizzato il nostro sito.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Tipi di Cookie che Utilizziamo
              </h2>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Cookie Essenziali
                </h3>
                <p className="text-gray-700 mb-4">
                  Questi cookie sono necessari per il funzionamento del sito web e non possono essere disabilitati.
                  Includono cookie per l'autenticazione, la sicurezza e le preferenze di base.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Cookie di Performance
                </h3>
                <p className="text-gray-700 mb-4">
                  Questi cookie ci aiutano a capire come i visitatori interagiscono con il nostro sito,
                  raccogliendo informazioni in forma anonima per migliorare le prestazioni.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Cookie di Funzionalità
                </h3>
                <p className="text-gray-700 mb-4">
                  Questi cookie permettono al sito di ricordare le scelte che fai (come il nome utente,
                  la lingua o la regione) e forniscono funzionalità migliorate e personalizzate.
                </p>
              </div>

              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Cookie di Marketing
                </h3>
                <p className="text-gray-700 mb-4">
                  Questi cookie vengono utilizzati per tracciare i visitatori sui siti web per mostrare
                  annunci pertinenti e coinvolgenti per il singolo utente.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Cookie di Terze Parti
              </h2>
              <p className="text-gray-700 mb-4">
                Utilizziamo anche cookie di terze parti per:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Google Analytics per l'analisi del traffico</li>
                <li>Fornitori di servizi di pagamento</li>
                <li>Servizi di chat e supporto clienti</li>
                <li>Piattaforme di social media</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. Come Gestire i Cookie
              </h2>
              <p className="text-gray-700 mb-4">
                Puoi controllare e/o eliminare i cookie come desideri. Puoi eliminare tutti i cookie
                che sono già sul tuo computer e puoi impostare la maggior parte dei browser per
                impedire che vengano inseriti.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <p className="text-blue-800">
                  <strong>Nota:</strong> Se scegli di disabilitare i cookie, alcune funzionalità del
                  nostro sito potrebbero non funzionare correttamente.
                </p>
              </div>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                5. Impostazioni del Browser
              </h2>
              <p className="text-gray-700 mb-4">
                La maggior parte dei browser web consente un certo controllo sui cookie attraverso
                le impostazioni del browser. Per saperne di più sui cookie, incluso come vedere
                quali cookie sono stati impostati, visita:
              </p>
              <ul className="list-disc pl-6 text-gray-700 mb-4">
                <li>Chrome: chrome://settings/cookies</li>
                <li>Firefox: about:preferences#privacy</li>
                <li>Safari: Preferenze &gt; Privacy</li>
                <li>Edge: edge://settings/cookies</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. Modifiche a questa Politica
              </h2>
              <p className="text-gray-700 mb-4">
                Potremmo aggiornare questa politica sui cookie di tanto in tanto per riflettere
                cambiamenti nelle nostre pratiche o per altri motivi operativi, legali o normativi.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. Contatti
              </h2>
              <p className="text-gray-700 mb-4">
                Se hai domande su questa politica sui cookie, contattaci all'indirizzo:
                privacy@bookinghse.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookiesPage;