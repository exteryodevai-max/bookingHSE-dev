// Tipi per integrazione Stripe

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
  client_secret?: string;
  description?: string;
  metadata?: Record<string, string>;
  created: number;
  payment_method?: {
    id: string;
    type: string;
    card?: {
      brand: string;
      last4: string;
      exp_month: number;
      exp_year: number;
    };
  };
}

export interface StripeError {
  type: 'card_error' | 'validation_error' | 'api_error' | 'authentication_error' | 'rate_limit_error' | 'idempotency_error' | 'invalid_request_error';
  code?: string;
  decline_code?: string;
  message: string;
  param?: string;
  payment_intent?: StripePaymentIntent;
}

export interface StripePaymentMethodCreateResult {
  error?: StripeError;
  paymentMethod?: {
    id: string;
    type: string;
    created: number;
    billing_details: {
      email?: string;
      name?: string;
      phone?: string;
    };
  };
}

export interface StripeConfirmCardPaymentResult {
  error?: StripeError;
  paymentIntent?: StripePaymentIntent;
}

// Props per il form di pagamento
export interface StripePaymentFormProps {
  bookingId: string;
  amount: number;
  currency?: string;
  serviceName: string;
  customerEmail?: string;
  onSuccess?: (paymentIntent: StripePaymentIntent) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

// Response del backend per creare un PaymentIntent
export interface CreatePaymentIntentResponse {
  client_secret: string;
  payment_intent_id: string;
  amount: number;
  currency: string;
}

export interface CreatePaymentIntentRequest {
  amount: number;
  currency: string;
  booking_id: string;
  customer_email?: string;
  description?: string;
  metadata?: Record<string, string>;
}

// Tipi per Stripe Elements (semplificati)
export interface StripeElements {
  create: (type: string, options?: any) => StripeElement;
  getElement: (type: string) => StripeElement | null;
}

export interface StripeElement {
  mount: (selector: string | HTMLElement) => void;
  unmount: () => void;
  on: (event: string, callback: (event: any) => void) => void;
  focus: () => void;
  blur: () => void;
  clear: () => void;
}