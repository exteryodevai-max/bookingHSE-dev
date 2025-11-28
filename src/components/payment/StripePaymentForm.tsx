import React, { useState, useEffect } from 'react';
import { stripeService, PaymentIntentRequest } from '../../lib/stripe';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CreditCard, Lock } from 'lucide-react';
import { StripePaymentFormProps, StripeElements, StripeElement } from '../../types/stripe';

export const StripePaymentForm: React.FC<StripePaymentFormProps> = ({
  bookingId,
  amount,
  currency = 'eur',
  serviceName,
  customerEmail,
  onSuccess,
  onError,
  onCancel
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [elements, setElements] = useState<StripeElements | null>(null);
  const [cardElement, setCardElement] = useState<StripeElement | null>(null);
  const [isCardComplete, setIsCardComplete] = useState(false);

  // Inizializza Stripe Elements
  useEffect(() => {
    const initializeStripe = async () => {
      try {
        const stripeElements = await stripeService.createElements();
        if (stripeElements) {
          setElements(stripeElements);
          
          const card = stripeElements.create('card', {
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
                padding: '12px',
              },
              invalid: {
                color: '#9e2146',
              },
            },
            hidePostalCode: true
          });
          
          setCardElement(card);
          
          // Monta l'elemento carta
          setTimeout(() => {
            const cardContainer = document.getElementById('card-element');
            if (cardContainer && card) {
              card.mount('#card-element');
              
              card.on('change', (event: any) => {
                setIsCardComplete(event.complete);
                setError(event.error ? event.error.message : null);
              });
            }
          }, 100);
        }
      } catch (err) {
        setError('Errore inizializzazione pagamento');
        console.error('Errore Stripe:', err);
      }
    };

    initializeStripe();

    return () => {
      if (cardElement) {
        cardElement.unmount();
      }
    };
  }, []);

  // Crea Payment Intent quando il componente è pronto
  useEffect(() => {
    if (elements && !clientSecret) {
      createPaymentIntent();
    }
  }, [elements]);

  const createPaymentIntent = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const request: PaymentIntentRequest = {
        bookingId,
        amount: stripeService.convertToCents(amount),
        currency,
        metadata: {
          booking_id: bookingId,
          service_name: serviceName,
          customer_email: customerEmail || ''
        }
      };

      const response = await stripeService.createPaymentIntent(request);
      
      if (response.success && response.clientSecret) {
        setClientSecret(response.clientSecret);
      } else {
        throw new Error(response.error || 'Errore creazione pagamento');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore sconosciuto';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!clientSecret || !cardElement || !isCardComplete) {
      setError('Completa i dati della carta');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const paymentMethod = {
        card: cardElement,
        billing_details: {
          email: customerEmail,
        }
      };

      const result = await stripeService.confirmCardPayment(clientSecret, paymentMethod);
      
      if (result.success && result.paymentIntent) {
        onSuccess?.(result.paymentIntent);
      } else {
        throw new Error(result.error || 'Pagamento fallito');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Errore pagamento';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const formattedAmount = stripeService.formatAmount(stripeService.convertToCents(amount), currency);

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Pagamento Sicuro
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Riepilogo */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-gray-600">Servizio:</span>
            <span className="font-medium">{serviceName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Totale:</span>
            <span className="text-lg font-bold text-green-600">{formattedAmount}</span>
          </div>
        </div>

        {/* Form di pagamento */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dati Carta di Credito
            </label>
            <div 
              id="card-element" 
              className="p-3 border border-gray-300 rounded-md bg-white"
              style={{ minHeight: '40px' }}
            />
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Lock className="h-3 w-3" />
            <span>I tuoi dati sono protetti con crittografia SSL</span>
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isLoading || !isCardComplete || !clientSecret}
              className="flex-1"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Elaborazione...
                </>
              ) : (
                `Paga ${formattedAmount}`
              )}
            </Button>
            
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Annulla
              </Button>
            )}
          </div>
        </form>

        {/* Informazioni sicurezza */}
        <div className="text-xs text-gray-500 text-center">
          <p>Powered by Stripe • PCI DSS Compliant</p>
          <p>I tuoi dati di pagamento sono sicuri e crittografati</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default StripePaymentForm;