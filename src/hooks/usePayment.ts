import { useState, useCallback } from 'react';
import { stripeService, PaymentIntentRequest, StripePaymentResult } from '../lib/stripe';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

export interface PaymentState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
  paymentIntent: any | null;
}

export interface UsePaymentReturn {
  paymentState: PaymentState;
  processPayment: (request: PaymentIntentRequest) => Promise<StripePaymentResult>;
  confirmPayment: (clientSecret: string, paymentMethod: any) => Promise<StripePaymentResult>;
  resetPaymentState: () => void;
  formatAmount: (amount: number, currency?: string) => string;
  convertToCents: (amount: number) => number;
}

export const usePayment = (): UsePaymentReturn => {
  const { user } = useAuth();
  const [paymentState, setPaymentState] = useState<PaymentState>({
    isLoading: false,
    error: null,
    success: false,
    paymentIntent: null
  });

  const resetPaymentState = useCallback(() => {
    setPaymentState({
      isLoading: false,
      error: null,
      success: false,
      paymentIntent: null
    });
  }, []);

  const processPayment = useCallback(async (request: PaymentIntentRequest): Promise<StripePaymentResult> => {
    if (!user) {
      const error = 'Utente non autenticato';
      setPaymentState(prev => ({ ...prev, error }));
      return { success: false, error };
    }

    try {
      setPaymentState(prev => ({ ...prev, isLoading: true, error: null }));

      // Verifica che la prenotazione esista e appartenga all'utente
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', request.bookingId)
        .eq('user_id', user.id)
        .single();

      if (bookingError || !booking) {
        throw new Error('Prenotazione non trovata o non autorizzata');
      }

      // Verifica che la prenotazione sia in stato valido per il pagamento
      if (!['pending', 'confirmed'].includes(booking.status)) {
        throw new Error('Prenotazione non valida per il pagamento');
      }

      // Crea il Payment Intent
      const response = await stripeService.createPaymentIntent(request);
      
      if (!response.success) {
        throw new Error(response.error || 'Errore creazione pagamento');
      }

      setPaymentState(prev => ({ 
        ...prev, 
        isLoading: false, 
        success: true 
      }));

      return {
        success: true,
        paymentIntent: {
          clientSecret: response.clientSecret,
          id: response.paymentIntentId
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore sconosciuto';
      setPaymentState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      return { success: false, error: errorMessage };
    }
  }, [user]);

  const confirmPayment = useCallback(async (
    clientSecret: string, 
    paymentMethod: any
  ): Promise<StripePaymentResult> => {
    try {
      setPaymentState(prev => ({ ...prev, isLoading: true, error: null }));

      const result = await stripeService.confirmCardPayment(clientSecret, paymentMethod);
      
      if (result.success && result.paymentIntent) {
        setPaymentState(prev => ({ 
          ...prev, 
          isLoading: false, 
          success: true,
          paymentIntent: result.paymentIntent
        }));

        // Aggiorna lo stato della prenotazione localmente
        // Il webhook si occuperà dell'aggiornamento definitivo
        return result;
      } else {
        throw new Error(result.error || 'Pagamento fallito');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Errore conferma pagamento';
      setPaymentState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: errorMessage 
      }));
      
      return { success: false, error: errorMessage };
    }
  }, []);

  const formatAmount = useCallback((amount: number, currency: string = 'EUR'): string => {
    return stripeService.formatAmount(amount, currency);
  }, []);

  const convertToCents = useCallback((amount: number): number => {
    return stripeService.convertToCents(amount);
  }, []);

  return {
    paymentState,
    processPayment,
    confirmPayment,
    resetPaymentState,
    formatAmount,
    convertToCents
  };
};

// Hook per gestire lo stato dei pagamenti di una prenotazione
export const useBookingPayment = (bookingId: string) => {
  const [paymentStatus, setPaymentStatus] = useState<{
    status: 'idle' | 'processing' | 'succeeded' | 'failed';
    amount?: number;
    currency?: string;
    paymentIntentId?: string;
    error?: string;
  }>({ status: 'idle' });

  const checkPaymentStatus = useCallback(async () => {
    if (!bookingId) return;

    try {
      const { data: booking, error } = await supabase
        .from('bookings')
        .select('payment_status, payment_amount, payment_intent_id')
        .eq('id', bookingId)
        .single();

      if (error) throw error;

      setPaymentStatus({
        status: booking.payment_status || 'idle',
        amount: booking.payment_amount,
        paymentIntentId: booking.payment_intent_id
      });

    } catch (error) {
      console.error('Errore controllo stato pagamento:', error);
      setPaymentStatus(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Errore sconosciuto' 
      }));
    }
  }, [bookingId]);

  return {
    paymentStatus,
    checkPaymentStatus,
    refreshPaymentStatus: checkPaymentStatus
  };
};