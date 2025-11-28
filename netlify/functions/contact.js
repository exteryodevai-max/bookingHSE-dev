const { Resend } = require('resend');

// Inizializza Resend con la chiave API
const resend = new Resend(process.env.RESEND_API_KEY);

// Email di destinazione per il supporto
const SUPPORT_EMAIL = 'support@bookinghse.com';
const COMMERCIAL_EMAIL = 'commerciale@bookinghse.com';
const ADMIN_EMAIL = 'amministrazione@bookinghse.com';

// Template HTML per l'email di contatto
const getContactEmailTemplate = (formData) => `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nuovo Messaggio di Contatto - BookingHSE</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 20px;
            background-color: #f9fafb;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        .header {
            background: #2563eb;
            color: white;
            padding: 24px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 600;
        }
        .content {
            padding: 24px;
        }
        .field {
            margin-bottom: 16px;
        }
        .field-label {
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
            display: block;
        }
        .field-value {
            background: #f9fafb;
            padding: 12px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            margin-top: 4px;
        }
        .message-content {
            white-space: pre-wrap;
            background: #f9fafb;
            padding: 16px;
            border-radius: 6px;
            border: 1px solid #e5e7eb;
            margin-top: 8px;
        }
        .footer {
            background: #f9fafb;
            padding: 20px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
            border-top: 1px solid #e5e7eb;
        }
        .urgent {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            padding: 12px;
            border-radius: 6px;
            margin-bottom: 16px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📧 Nuovo Messaggio di Contatto</h1>
        </div>
        
        <div class="content">
            ${formData.subject === 'urgent' ? `
            <div class="urgent">
                <strong>🚨 RICHIESTA URGENTE</strong> - Questo messaggio richiede attenzione immediata.
            </div>
            ` : ''}
            
            <div class="field">
                <span class="field-label">Da:</span>
                <div class="field-value">
                    ${formData.name} &lt;${formData.email}&gt;
                    ${formData.phone ? ` | 📞 ${formData.phone}` : ''}
                    ${formData.company ? ` | 🏢 ${formData.company}` : ''}
                </div>
            </div>
            
            <div class="field">
                <span class="field-label">Oggetto:</span>
                <div class="field-value">
                    ${getSubjectDisplayName(formData.subject)}
                </div>
            </div>
            
            <div class="field">
                <span class="field-label">Messaggio:</span>
                <div class="message-content">
                    ${formData.message}
                </div>
            </div>
            
            <div class="field">
                <span class="field-label">Inviato il:</span>
                <div class="field-value">
                    ${new Date().toLocaleString('it-IT', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p>Questo messaggio è stato inviato tramite il form di contatto di BookingHSE.</p>
            <p>© ${new Date().getFullYear()} BookingHSE - Tutti i diritti riservati</p>
        </div>
    </div>
</body>
</html>`;

// Nomi visualizzati per gli oggetti
const getSubjectDisplayName = (subject) => {
    const subjects = {
        'info': '📋 Informazioni Generali',
        'support': '🛠️ Supporto Tecnico',
        'commercial': '💼 Richiesta Commerciale',
        'partnership': '🤝 Partnership',
        'urgent': '🚨 Richiesta Urgente',
        'other': '❓ Altro'
    };
    return subjects[subject] || subject;
};

// Determina l'email di destinazione in base all'oggetto
const getRecipientEmail = (subject) => {
    const emailMap = {
        'support': SUPPORT_EMAIL,
        'commercial': COMMERCIAL_EMAIL,
        'partnership': COMMERCIAL_EMAIL,
        'urgent': SUPPORT_EMAIL,
        'default': SUPPORT_EMAIL
    };
    return emailMap[subject] || emailMap['default'];
};

// Handler principale della funzione
const handler = async (event) => {
    // Verifica che sia una richiesta POST
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Metodo non consentito' })
        };
    }

    try {
        // Parsing del corpo della richiesta
        const formData = JSON.parse(event.body);

        // Validazione base
        if (!formData.name || !formData.email || !formData.message) {
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    error: 'Campi obbligatori mancanti: nome, email, messaggio' 
                })
            };
        }

        // Validazione email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Email non valida' })
            };
        }

        // Determina il destinatario
        const recipientEmail = getRecipientEmail(formData.subject);

        // Invia l'email
        const { data, error } = await resend.emails.send({
            from: 'BookingHSE Contact <noreply@bookinghse.com>',
            to: recipientEmail,
            reply_to: `${formData.name} <${formData.email}>`,
            subject: `Nuovo contatto: ${getSubjectDisplayName(formData.subject)} - ${formData.name}`,
            html: getContactEmailTemplate(formData),
            text: `
Nuovo Messaggio di Contatto - BookingHSE
=========================================

Da: ${formData.name} <${formData.email}>
Telefono: ${formData.phone || 'Non fornito'}
Azienda: ${formData.company || 'Non fornita'}
Oggetto: ${getSubjectDisplayName(formData.subject)}

Messaggio:
${formData.message}

Inviato il: ${new Date().toLocaleString('it-IT')}
            `
        });

        if (error) {
            console.error('Errore Resend:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({ 
                    error: 'Errore durante l\'invio dell\'email',
                    details: error.message 
                })
            };
        }

        // Risposta di successo
        return {
            statusCode: 200,
            headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Methods': 'POST, OPTIONS'
            },
            body: JSON.stringify({ 
                success: true, 
                message: 'Messaggio inviato con successo',
                emailId: data.id 
            })
        };

    } catch (error) {
        console.error('Errore nella funzione contact:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ 
                error: 'Errore interno del server',
                details: error.message 
            })
        };
    }
};

// Gestione delle richieste OPTIONS per CORS
const handleOptions = () => {
    return {
        statusCode: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: ''
    };
};

// Export principale
module.exports = { handler };

// Export per testing
module.exports.getSubjectDisplayName = getSubjectDisplayName;
module.exports.getRecipientEmail = getRecipientEmail;