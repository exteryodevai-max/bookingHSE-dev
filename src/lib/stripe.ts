import { loadStripe, Stripe } from '@stripe/stripe-js';

// Inizializza Stripe con la chiave pubblica
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
    
    if (!publishableKey) {
      console.error('VITE_STRIPE_PUBLISHABLE_KEY non configurata');
      return null;
    }
    
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

export default getStripe;

// Tipi per l'integrazione Stripe
export interface PaymentIntentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  metadata?: Record<string, string>;
}

export interface PaymentIntentResponse {
  success: boolean;
  clientSecret?: string;
  paymentIntentId?: string;
  error?: string;
}

export interface StripePaymentResult {
  success: boolean;
  paymentIntent?: any;
  error?: string;
}

// Servizio per gestire i pagamenti
export class StripeService {
  private stripe: Promise<Stripe | null>;

  constructor() {
    this.stripe = getStripe();
  }

  /**
   * Crea un Payment Intent per una prenotazione
   */
  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      const response = await fetch('/functions/v1/stripe-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Errore creazione Payment Intent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }

  /**
   * Conferma un pagamento con carta
   */
  async confirmCardPayment(
    clientSecret: string,
    paymentMethod: any
  ): Promise<StripePaymentResult> {
    try {
      const stripe = await this.stripe;
      if (!stripe) {
        throw new Error('Stripe non inizializzato');
      }

      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethod
      });

      if (result.error) {
        return {
          success: false,
          error: result.error.message
        };
      }

      return {
        success: true,
        paymentIntent: result.paymentIntent
      };
    } catch (error) {
      console.error('Errore conferma pagamento:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Errore sconosciuto'
      };
    }
  }

  /**
   * Crea elementi Stripe per il form di pagamento
   */
  async createElements(options?: any) {
    try {
      const stripe = await this.stripe;
      if (!stripe) {
        throw new Error('Stripe non inizializzato');
      }

      const elements = stripe.elements({
        appearance: {
          theme: 'stripe',
          variables: {
            colorPrimary: '#0570de',
            colorBackground: '#ffffff',
            colorText: '#30313d',
            colorDanger: '#df1b41',
            fontFamily: 'Inter, system-ui, sans-serif',
            spacingUnit: '4px',
            borderRadius: '8px'
          }
        },
        ...options
      });

      return elements;
    } catch (error) {
      console.error('Errore creazione elementi Stripe:', error);
      return null;
    }
  }

  /**
   * Formatta un importo per la visualizzazione
   */
  formatAmount(amount: number, currency: string = 'EUR'): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: currency
    }).format(amount / 100);
  }

  /**
   * Converte un importo in centesimi
   */
  convertToCents(amount: number): number {
    return Math.round(amount * 100);
  }

  /**
   * Valida una carta di credito
   */
  async validateCard(cardElement: any): Promise<boolean> {
    try {
      const stripe = await this.stripe;
      if (!stripe) {
        return false;
      }

      const { error } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement
      });

      return !error;
    } catch (error) {
      console.error('Errore validazione carta:', error);
      return false;
    }
  }
}

// Istanza singleton del servizio
export const stripeService = new StripeService();

// Hook per React (se necessario)
export const useStripe = () => {
  return {
    stripe: getStripe(),
    stripeService,
    formatAmount: stripeService.formatAmount.bind(stripeService),
    convertToCents: stripeService.convertToCents.bind(stripeService)
  };
};