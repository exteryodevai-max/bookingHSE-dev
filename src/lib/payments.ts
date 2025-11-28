// Sistema di pagamenti integrato per BookingHSE
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type PaymentStatus = 'pending' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'refunded';
type PaymentMethod = 'card' | 'bank_transfer' | 'paypal' | 'apple_pay' | 'google_pay';
type Currency = 'EUR' | 'USD' | 'GBP';

interface PaymentIntent {
  id: string;
  booking_id: string;
  amount: number;
  currency: Currency;
  status: PaymentStatus;
  payment_method?: PaymentMethod;
  stripe_payment_intent_id?: string;
  paypal_order_id?: string;
  metadata?: Record<string, string | number | boolean>;
  created_at: string;
  updated_at: string;
}

interface PaymentConfig {
  stripePublishableKey: string;
  stripeSecretKey?: string;
  paypalClientId?: string;
  enabledMethods: PaymentMethod[];
  defaultCurrency: Currency;
  feePercentage: number;
  minimumAmount: number;
  maximumAmount: number;
}

interface CreatePaymentIntentParams {
  bookingId: string;
  amount: number;
  currency?: Currency;
  paymentMethod?: PaymentMethod;
  metadata?: Record<string, string | number | boolean>;
  automaticConfirmation?: boolean;
}

interface RefundParams {
  paymentIntentId: string;
  amount?: number; // Partial refund if specified
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer' | 'other';
  metadata?: Record<string, string | number | boolean>;
}

interface PaymentAnalytics {
  totalRevenue: number;
  totalTransactions: number;
  averageTransactionValue: number;
  successRate: number;
  refundRate: number;
  topPaymentMethods: Array<{ method: PaymentMethod; count: number; percentage: number }>;
  monthlyTrends: Array<{ month: string; revenue: number; transactions: number }>;
}

class PaymentManager {
  private stripe: Stripe | null = null;
  private supabase: ReturnType<typeof createClient<Database>>;
  private config: PaymentConfig;

  constructor(config: PaymentConfig, supabaseUrl: string, supabaseKey: string) {
    this.config = config;
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  // Inizializza Stripe
  async initializeStripe(): Promise<void> {
    if (!this.stripe) {
      this.stripe = await loadStripe(this.config.stripePublishableKey);
      if (!this.stripe) {
        throw new Error('Impossibile inizializzare Stripe');
      }
    }
  }

  // Crea un Payment Intent
  async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntent | null> {
    try {
      // Validazioni
      if (params.amount < this.config.minimumAmount) {
        throw new Error(`Importo minimo: €${this.config.minimumAmount}`);
      }
      if (params.amount > this.config.maximumAmount) {
        throw new Error(`Importo massimo: €${this.config.maximumAmount}`);
      }

      // Calcola commissioni
      const feeAmount = Math.round(params.amount * this.config.feePercentage / 100);
      const totalAmount = params.amount + feeAmount;

      // Crea record nel database
      const paymentData = {
        booking_id: params.bookingId,
        amount: params.amount,
        fee_amount: feeAmount,
        total_amount: totalAmount,
        currency: params.currency || this.config.defaultCurrency,
        status: 'pending' as PaymentStatus,
        payment_method: params.paymentMethod || 'card',
        metadata: {
          ...params.metadata,
          automatic_confirmation: params.automaticConfirmation || false
        }
      };

      const { data: payment, error } = await this.supabase
        .from('payment_intents')
        .insert(paymentData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Errore creazione payment intent:', error);
        return null;
      }

      // Se è Stripe, crea anche il Payment Intent su Stripe
      if (params.paymentMethod === 'card' || !params.paymentMethod) {
        await this.initializeStripe();
        
        const stripePaymentIntent = await this.createStripePaymentIntent({
          amount: totalAmount,
          currency: params.currency || this.config.defaultCurrency,
          metadata: {
            booking_id: params.bookingId,
            payment_intent_id: payment.id,
            ...params.metadata
          },
          automatic_payment_methods: {
            enabled: true
          }
        });

        if (stripePaymentIntent) {
          // Aggiorna con l'ID di Stripe
          const { data: updatedPayment } = await this.supabase
            .from('payment_intents')
            .update({ stripe_payment_intent_id: stripePaymentIntent.id })
            .eq('id', payment.id)
            .select()
            .maybeSingle();

          return updatedPayment as PaymentIntent;
        }
      }

      return payment as PaymentIntent;
    } catch (error) {
      console.error('Errore creazione payment intent:', error);
      return null;
    }
  }

  // Crea Payment Intent su Stripe
  private async createStripePaymentIntent(params: {
    amount: number;
    currency: string;
    bookingId: string;
    metadata?: Record<string, string | number | boolean>;
  }): Promise<{
    success: boolean;
    clientSecret?: string;
    paymentIntentId?: string;
    error?: string;
  }> {
    try {
      // In produzione, questa chiamata dovrebbe essere fatta dal backend
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Errore creazione Stripe Payment Intent');
      }

      return await response.json();
    } catch (error) {
      console.error('Errore Stripe Payment Intent:', error);
      return null;
    }
  }

  // Conferma pagamento
  async confirmPayment(
    paymentIntentId: string,
    paymentMethodId?: string,
    returnUrl?: string
  ): Promise<{ success: boolean; error?: string; requiresAction?: boolean }> {
    try {
      await this.initializeStripe();
      if (!this.stripe) {
        throw new Error('Stripe non inizializzato');
      }

      // Ottieni il payment intent dal database
      const { data: payment, error: dbError } = await this.supabase
        .from('payment_intents')
        .select('*')
        .eq('id', paymentIntentId)
        .maybeSingle();

      if (dbError || !payment) {
        return { success: false, error: 'Payment intent non trovato' };
      }

      if (!payment.stripe_payment_intent_id) {
        return { success: false, error: 'Payment intent Stripe non trovato' };
      }

      // Aggiorna stato a processing
      await this.updatePaymentStatus(paymentIntentId, 'processing');

      // Conferma con Stripe
      const result = await this.stripe.confirmPayment({
        elements: paymentMethodId ? undefined : await this.createStripeElements(payment.stripe_payment_intent_id),
        confirmParams: {
          return_url: returnUrl || window.location.origin + '/payment/success'
        },
        redirect: 'if_required'
      });

      if (result.error) {
        await this.updatePaymentStatus(paymentIntentId, 'failed', {
          error_message: result.error.message,
          error_code: result.error.code
        });
        return { success: false, error: result.error.message };
      }

      if (result.paymentIntent?.status === 'succeeded') {
        await this.updatePaymentStatus(paymentIntentId, 'succeeded', {
          stripe_payment_intent: result.paymentIntent
        });
        
        // Aggiorna stato booking
        await this.updateBookingPaymentStatus(payment.booking_id, 'captured');
        
        return { success: true };
      }

      if (result.paymentIntent?.status === 'requires_action') {
        return { success: false, requiresAction: true };
      }

      return { success: false, error: 'Stato pagamento sconosciuto' };
    } catch (error) {
      console.error('Errore conferma pagamento:', error);
      await this.updatePaymentStatus(paymentIntentId, 'failed', {
        error_message: error instanceof Error ? error.message : 'Errore sconosciuto'
      });
      return { success: false, error: 'Errore durante la conferma del pagamento' };
    }
  }

  // Crea elementi Stripe
  private async createStripeElements(clientSecret: string): Promise<{
    create: (type: string, options?: Record<string, unknown>) => unknown;
    submit: () => Promise<{ error?: { message: string } }>;
  }> {
    if (!this.stripe) {
      throw new Error('Stripe non inizializzato');
    }

    const elements = this.stripe.elements({
      clientSecret,
      appearance: {
        theme: 'stripe',
        variables: {
          colorPrimary: '#3b82f6',
          colorBackground: '#ffffff',
          colorText: '#1f2937',
          colorDanger: '#ef4444',
          fontFamily: 'system-ui, sans-serif',
          spacingUnit: '4px',
          borderRadius: '8px'
        }
      }
    });

    return elements;
  }

  // Aggiorna stato pagamento
  async updatePaymentStatus(
    paymentIntentId: string,
    status: PaymentStatus,
    metadata?: Record<string, string | number | boolean>
  ): Promise<boolean> {
    try {
      const updateData: {
        status: PaymentStatus;
        updated_at: string;
        [key: string]: string | number | boolean | PaymentStatus;
      } = {
        status,
        updated_at: new Date().toISOString()
      };

      if (metadata) {
        updateData.metadata = metadata;
      }

      const { error } = await this.supabase
        .from('payment_intents')
        .update(updateData)
        .eq('id', paymentIntentId);

      if (error) {
        console.error('Errore aggiornamento stato pagamento:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Errore aggiornamento stato pagamento:', error);
      return false;
    }
  }

  // Aggiorna stato pagamento booking
  private async updateBookingPaymentStatus(
    bookingId: string,
    paymentStatus: 'pending' | 'authorized' | 'captured' | 'failed' | 'refunded'
  ): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('bookings')
        .update({ 
          payment_status: paymentStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      return !error;
    } catch (error) {
      console.error('Errore aggiornamento stato pagamento booking:', error);
      return false;
    }
  }

  // Rimborso
  async refundPayment(params: RefundParams): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      // Ottieni payment intent
      const { data: payment, error: dbError } = await this.supabase
        .from('payment_intents')
        .select('*')
        .eq('id', params.paymentIntentId)
        .maybeSingle();

      if (dbError || !payment) {
        return { success: false, error: 'Payment intent non trovato' };
      }

      if (payment.status !== 'succeeded') {
        return { success: false, error: 'Il pagamento non può essere rimborsato' };
      }

      // Calcola importo rimborso
      const refundAmount = params.amount || payment.total_amount;
      if (refundAmount > payment.total_amount) {
        return { success: false, error: 'Importo rimborso superiore al pagamento' };
      }

      // Esegui rimborso su Stripe
      if (payment.stripe_payment_intent_id) {
        const refundResult = await this.createStripeRefund({
          payment_intent: payment.stripe_payment_intent_id,
          amount: refundAmount * 100, // Stripe usa centesimi
          reason: params.reason || 'requested_by_customer',
          metadata: params.metadata
        });

        if (!refundResult.success) {
          return refundResult;
        }

        // Aggiorna stato nel database
        await this.updatePaymentStatus(params.paymentIntentId, 'refunded', {
          refund_id: refundResult.refundId,
          refund_amount: refundAmount,
          refund_reason: params.reason,
          ...params.metadata
        });

        // Aggiorna booking
        await this.updateBookingPaymentStatus(payment.booking_id, 'refunded');

        return { success: true, refundId: refundResult.refundId };
      }

      return { success: false, error: 'Metodo di rimborso non supportato' };
    } catch (error) {
      console.error('Errore rimborso:', error);
      return { success: false, error: 'Errore durante il rimborso' };
    }
  }

  // Crea rimborso Stripe
  private async createStripeRefund(params: {
    paymentIntentId: string;
    amount?: number;
    reason?: string;
    metadata?: Record<string, string | number | boolean>;
  }): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const response = await fetch('/api/payments/refund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        throw new Error('Errore rimborso Stripe');
      }

      const result = await response.json();
      return { success: true, refundId: result.id };
    } catch (error) {
      console.error('Errore rimborso Stripe:', error);
      return { success: false, error: 'Errore rimborso Stripe' };
    }
  }

  // Ottieni pagamenti per provider
  async getProviderPayments(
    providerId: string,
    options: {
      startDate?: string;
      endDate?: string;
      status?: PaymentStatus;
      limit?: number;
      offset?: number;
    } = {}
  ): Promise<PaymentIntent[]> {
    try {
      let query = this.supabase
        .from('payment_intents')
        .select(`
          *,
          bookings!inner(
            provider_id,
            service_id,
            client_id,
            service_date,
            services(title)
          )
        `)
        .eq('bookings.provider_id', providerId)
        .order('created_at', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }

      if (options.startDate) {
        query = query.gte('created_at', options.startDate);
      }

      if (options.endDate) {
        query = query.lte('created_at', options.endDate);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Errore recupero pagamenti provider:', error);
        return [];
      }

      return data as PaymentIntent[];
    } catch (error) {
      console.error('Errore recupero pagamenti provider:', error);
      return [];
    }
  }

  // Analytics pagamenti
  async getPaymentAnalytics(
    providerId: string,
    startDate?: string,
    endDate?: string
  ): Promise<PaymentAnalytics | null> {
    try {
      const payments = await this.getProviderPayments(providerId, {
        startDate,
        endDate,
        status: 'succeeded'
      });

      if (payments.length === 0) {
        return {
          totalRevenue: 0,
          totalTransactions: 0,
          averageTransactionValue: 0,
          successRate: 0,
          refundRate: 0,
          topPaymentMethods: [],
          monthlyTrends: []
        };
      }

      const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
      const totalTransactions = payments.length;
      const averageTransactionValue = totalRevenue / totalTransactions;

      // Calcola success rate
      const allPayments = await this.getProviderPayments(providerId, { startDate, endDate });
      const successRate = allPayments.length > 0 ? 
        (payments.length / allPayments.length) * 100 : 0;

      // Calcola refund rate
      const refundedPayments = allPayments.filter(p => p.status === 'refunded');
      const refundRate = payments.length > 0 ? 
        (refundedPayments.length / payments.length) * 100 : 0;

      // Top payment methods
      const methodCounts = payments.reduce((acc, p) => {
        const method = p.payment_method || 'card';
        acc[method] = (acc[method] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const topPaymentMethods = Object.entries(methodCounts)
        .map(([method, count]) => ({
          method: method as PaymentMethod,
          count,
          percentage: (count / totalTransactions) * 100
        }))
        .sort((a, b) => b.count - a.count);

      // Monthly trends (ultimi 12 mesi)
      const monthlyTrends = this.calculateMonthlyTrends(payments);

      return {
        totalRevenue,
        totalTransactions,
        averageTransactionValue,
        successRate,
        refundRate,
        topPaymentMethods,
        monthlyTrends
      };
    } catch (error) {
      console.error('Errore analytics pagamenti:', error);
      return null;
    }
  }

  // Calcola trend mensili
  private calculateMonthlyTrends(payments: PaymentIntent[]): Array<{ month: string; revenue: number; transactions: number }> {
    const monthlyData = payments.reduce((acc, payment) => {
      const date = new Date(payment.created_at);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { revenue: 0, transactions: 0 };
      }
      
      acc[monthKey].revenue += payment.amount;
      acc[monthKey].transactions += 1;
      
      return acc;
    }, {} as Record<string, { revenue: number; transactions: number }>);

    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Ultimi 12 mesi
  }

  // Verifica stato pagamento
  async getPaymentStatus(paymentIntentId: string): Promise<PaymentIntent | null> {
    try {
      const { data, error } = await this.supabase
        .from('payment_intents')
        .select('*')
        .eq('id', paymentIntentId)
        .maybeSingle();

      if (error) {
        console.error('Errore recupero stato pagamento:', error);
        return null;
      }

      return data as PaymentIntent;
    } catch (error) {
      console.error('Errore recupero stato pagamento:', error);
      return null;
    }
  }
}

// Funzioni di utilità
export const PaymentHelpers = {
  // Formatta importo per visualizzazione
  formatAmount(amount: number, currency: Currency = 'EUR'): string {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency
    }).format(amount);
  },

  // Calcola commissioni
  calculateFees(amount: number, feePercentage: number): { feeAmount: number; totalAmount: number } {
    const feeAmount = Math.round(amount * feePercentage / 100);
    return {
      feeAmount,
      totalAmount: amount + feeAmount
    };
  },

  // Valida importo
  validateAmount(amount: number, config: PaymentConfig): { valid: boolean; error?: string } {
    if (amount < config.minimumAmount) {
      return { valid: false, error: `Importo minimo: ${PaymentHelpers.formatAmount(config.minimumAmount)}` };
    }
    if (amount > config.maximumAmount) {
      return { valid: false, error: `Importo massimo: ${PaymentHelpers.formatAmount(config.maximumAmount)}` };
    }
    return { valid: true };
  },

  // Ottieni icona metodo pagamento
  getPaymentMethodIcon(method: PaymentMethod): string {
    const icons = {
      card: '💳',
      bank_transfer: '🏦',
      paypal: '🅿️',
      apple_pay: '🍎',
      google_pay: '🔍'
    };
    return icons[method] || '💳';
  },

  // Ottieni colore stato
  getStatusColor(status: PaymentStatus): string {
    const colors = {
      pending: 'text-yellow-600 bg-yellow-100',
      processing: 'text-blue-600 bg-blue-100',
      succeeded: 'text-green-600 bg-green-100',
      failed: 'text-red-600 bg-red-100',
      cancelled: 'text-gray-600 bg-gray-100',
      refunded: 'text-purple-600 bg-purple-100'
    };
    return colors[status] || 'text-gray-600 bg-gray-100';
  }
};

// Configurazione di default
export const defaultPaymentConfig: PaymentConfig = {
  stripePublishableKey: import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '',
  enabledMethods: ['card', 'apple_pay', 'google_pay'],
  defaultCurrency: 'EUR',
  feePercentage: 2.9, // 2.9% + 0.30€ per transazione
  minimumAmount: 5,
  maximumAmount: 10000
};

// Istanza singleton
let paymentManagerInstance: PaymentManager | null = null;

export function getPaymentManager(): PaymentManager {
  if (!paymentManagerInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configurazione Supabase mancante per i pagamenti');
    }
    
    paymentManagerInstance = new PaymentManager(defaultPaymentConfig, supabaseUrl, supabaseKey);
  }
  
  return paymentManagerInstance;
}

export type {
  PaymentIntent,
  PaymentStatus,
  PaymentMethod,
  Currency,
  PaymentConfig,
  CreatePaymentIntentParams,
  RefundParams,
  PaymentAnalytics
};

export { PaymentManager };