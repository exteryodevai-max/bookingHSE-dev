// Sistema di notifiche real-time per BookingHSE
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type NotificationType = 
  | 'booking_request'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_completed'
  | 'payment_received'
  | 'payment_failed'
  | 'message_received'
  | 'review_received'
  | 'service_updated'
  | 'profile_verified'
  | 'reminder';

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

interface NotificationData {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  data?: Record<string, string | number | boolean>;
  read: boolean;
  created_at: string;
  expires_at?: string;
}

interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  icon?: string;
  action_url?: string;
}

class NotificationManager {
  private supabase: ReturnType<typeof createClient<Database>>;
  private listeners: Map<string, Set<(notification: NotificationData) => void>> = new Map();
  private subscription: ReturnType<typeof this.supabase.channel> | null = null;
  private isConnected = false;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  // Templates per diversi tipi di notifiche
  private getNotificationTemplate(type: NotificationType, data: Record<string, string | number | boolean>): NotificationTemplate {
    const templates: Record<NotificationType, NotificationTemplate> = {
      booking_request: {
        type: 'booking_request',
        title: 'Nuova richiesta di prenotazione',
        message: `${data.client_name} ha richiesto il servizio "${data.service_title}"`,
        priority: 'high',
        icon: '📅',
        action_url: `/dashboard/bookings/${data.booking_id}`
      },
      booking_confirmed: {
        type: 'booking_confirmed',
        title: 'Prenotazione confermata',
        message: `La tua prenotazione per "${data.service_title}" è stata confermata`,
        priority: 'high',
        icon: '✅',
        action_url: `/bookings/${data.booking_id}`
      },
      booking_cancelled: {
        type: 'booking_cancelled',
        title: 'Prenotazione cancellata',
        message: `La prenotazione per "${data.service_title}" è stata cancellata`,
        priority: 'medium',
        icon: '❌',
        action_url: `/bookings/${data.booking_id}`
      },
      booking_completed: {
        type: 'booking_completed',
        title: 'Servizio completato',
        message: `Il servizio "${data.service_title}" è stato completato. Lascia una recensione!`,
        priority: 'medium',
        icon: '🎉',
        action_url: `/bookings/${data.booking_id}/review`
      },
      payment_received: {
        type: 'payment_received',
        title: 'Pagamento ricevuto',
        message: `Hai ricevuto un pagamento di €${data.amount} per "${data.service_title}"`,
        priority: 'high',
        icon: '💰',
        action_url: `/dashboard/payments`
      },
      payment_failed: {
        type: 'payment_failed',
        title: 'Pagamento fallito',
        message: `Il pagamento per "${data.service_title}" non è andato a buon fine`,
        priority: 'urgent',
        icon: '⚠️',
        action_url: `/bookings/${data.booking_id}/payment`
      },
      message_received: {
        type: 'message_received',
        title: 'Nuovo messaggio',
        message: `${data.sender_name}: ${data.message_preview}`,
        priority: 'medium',
        icon: '💬',
        action_url: `/messages/${data.conversation_id}`
      },
      review_received: {
        type: 'review_received',
        title: 'Nuova recensione',
        message: `${data.client_name} ha lasciato una recensione ${data.rating}⭐ per "${data.service_title}"`,
        priority: 'medium',
        icon: '⭐',
        action_url: `/dashboard/reviews`
      },
      service_updated: {
        type: 'service_updated',
        title: 'Servizio aggiornato',
        message: `Il servizio "${data.service_title}" è stato aggiornato`,
        priority: 'low',
        icon: '🔄',
        action_url: `/services/${data.service_id}`
      },
      profile_verified: {
        type: 'profile_verified',
        title: 'Profilo verificato',
        message: 'Il tuo profilo è stato verificato con successo!',
        priority: 'high',
        icon: '✅',
        action_url: '/dashboard/profile'
      },
      reminder: {
        type: 'reminder',
        title: data.title || 'Promemoria',
        message: data.message || 'Hai un promemoria',
        priority: data.priority || 'medium',
        icon: '⏰',
        action_url: data.action_url
      }
    };

    return templates[type];
  }

  // Inizializza la connessione real-time
  async initialize(userId: string): Promise<void> {
    if (this.isConnected) {
      await this.disconnect();
    }

    try {
      // Sottoscrivi alle notifiche per l'utente specifico
      this.subscription = this.supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const notification = payload.new as NotificationData;
            this.handleNewNotification(notification);
          }
        )
        .subscribe();

      this.isConnected = true;
      console.log('✅ Sistema notifiche inizializzato');
    } catch (error) {
      console.error('❌ Errore inizializzazione notifiche:', error);
      throw error;
    }
  }

  // Disconnetti dal sistema real-time
  async disconnect(): Promise<void> {
    if (this.subscription) {
      await this.supabase.removeChannel(this.subscription);
      this.subscription = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  // Aggiungi listener per un tipo di notifica
  addListener(type: NotificationType | 'all', callback: (notification: NotificationData) => void): void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback);
  }

  // Rimuovi listener
  removeListener(type: NotificationType | 'all', callback: (notification: NotificationData) => void): void {
    const listeners = this.listeners.get(type);
    if (listeners) {
      listeners.delete(callback);
      if (listeners.size === 0) {
        this.listeners.delete(type);
      }
    }
  }

  // Gestisce nuove notifiche in arrivo
  private handleNewNotification(notification: NotificationData): void {
    // Notifica listeners specifici per tipo
    const typeListeners = this.listeners.get(notification.type);
    if (typeListeners) {
      typeListeners.forEach(callback => callback(notification));
    }

    // Notifica listeners generali
    const allListeners = this.listeners.get('all');
    if (allListeners) {
      allListeners.forEach(callback => callback(notification));
    }

    // Mostra notifica browser se supportato
    this.showBrowserNotification(notification);
  }

  // Crea una nuova notifica
  async createNotification(
    userId: string,
    type: NotificationType,
    data: Record<string, string | number | boolean> = {},
    customMessage?: { title?: string; message?: string; priority?: NotificationPriority }
  ): Promise<NotificationData | null> {
    try {
      const template = this.getNotificationTemplate(type, data);
      
      const notificationData = {
        user_id: userId,
        type,
        title: customMessage?.title || template.title,
        message: customMessage?.message || template.message,
        priority: customMessage?.priority || template.priority,
        data: {
          ...data,
          icon: template.icon,
          action_url: template.action_url
        },
        read: false,
        expires_at: data.expires_at || null
      };

      const { data: notification, error } = await this.supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .maybeSingle();

      if (error) {
        console.error('Errore creazione notifica:', error);
        return null;
      }

      return notification as NotificationData;
    } catch (error) {
      console.error('Errore creazione notifica:', error);
      return null;
    }
  }

  // Ottieni notifiche per un utente
  async getNotifications(
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      types?: NotificationType[];
    } = {}
  ): Promise<NotificationData[]> {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (options.unreadOnly) {
        query = query.eq('read', false);
      }

      if (options.types && options.types.length > 0) {
        query = query.in('type', options.types);
      }

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Errore recupero notifiche:', error);
        return [];
      }

      return data as NotificationData[];
    } catch (error) {
      console.error('Errore recupero notifiche:', error);
      return [];
    }
  }

  // Segna notifica come letta
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) {
        console.error('Errore aggiornamento notifica:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Errore aggiornamento notifica:', error);
      return false;
    }
  }

  // Segna tutte le notifiche come lette
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Errore aggiornamento notifiche:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Errore aggiornamento notifiche:', error);
      return false;
    }
  }

  // Elimina notifica
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        console.error('Errore eliminazione notifica:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Errore eliminazione notifica:', error);
      return false;
    }
  }

  // Conta notifiche non lette
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await this.supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) {
        console.error('Errore conteggio notifiche:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Errore conteggio notifiche:', error);
      return 0;
    }
  }

  // Mostra notifica nel browser
  private async showBrowserNotification(notification: NotificationData): Promise<void> {
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission === 'granted') {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: notification.id,
        requireInteraction: notification.priority === 'urgent',
        silent: notification.priority === 'low'
      });

      browserNotification.onclick = () => {
        window.focus();
        if (notification.data?.action_url) {
          window.location.href = notification.data.action_url;
        }
        browserNotification.close();
      };

      // Auto-chiudi dopo 5 secondi per notifiche non urgenti
      if (notification.priority !== 'urgent') {
        setTimeout(() => {
          browserNotification.close();
        }, 5000);
      }
    }
  }

  // Richiedi permesso notifiche browser
  async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Pulisci notifiche scadute
  async cleanupExpiredNotifications(): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('notifications')
        .delete()
        .lt('expires_at', new Date().toISOString());

      if (error) {
        console.error('Errore pulizia notifiche scadute:', error);
      }
    } catch (error) {
      console.error('Errore pulizia notifiche scadute:', error);
    }
  }

  // Stato connessione
  get connected(): boolean {
    return this.isConnected;
  }
}

// Funzioni di utilità per creare notifiche specifiche
export const NotificationHelpers = {
  // Notifica per nuova prenotazione
  async notifyBookingRequest(
    notificationManager: NotificationManager,
    providerId: string,
    bookingData: {
      booking_id: string;
      client_name: string;
      service_title: string;
      service_date: string;
      total_amount: number;
    }
  ) {
    return await notificationManager.createNotification(
      providerId,
      'booking_request',
      bookingData
    );
  },

  // Notifica conferma prenotazione
  async notifyBookingConfirmed(
    notificationManager: NotificationManager,
    clientId: string,
    bookingData: {
      booking_id: string;
      service_title: string;
      provider_name: string;
      service_date: string;
    }
  ) {
    return await notificationManager.createNotification(
      clientId,
      'booking_confirmed',
      bookingData
    );
  },

  // Notifica pagamento ricevuto
  async notifyPaymentReceived(
    notificationManager: NotificationManager,
    providerId: string,
    paymentData: {
      booking_id: string;
      service_title: string;
      amount: number;
      client_name: string;
    }
  ) {
    return await notificationManager.createNotification(
      providerId,
      'payment_received',
      paymentData
    );
  },

  // Notifica nuovo messaggio
  async notifyNewMessage(
    notificationManager: NotificationManager,
    recipientId: string,
    messageData: {
      conversation_id: string;
      sender_name: string;
      message_preview: string;
    }
  ) {
    return await notificationManager.createNotification(
      recipientId,
      'message_received',
      messageData
    );
  },

  // Notifica promemoria
  async notifyReminder(
    notificationManager: NotificationManager,
    userId: string,
    reminderData: {
      title: string;
      message: string;
      action_url?: string;
      priority?: NotificationPriority;
    }
  ) {
    return await notificationManager.createNotification(
      userId,
      'reminder',
      reminderData
    );
  }
};

// Istanza singleton del manager notifiche
let notificationManagerInstance: NotificationManager | null = null;

export function getNotificationManager(): NotificationManager {
  if (!notificationManagerInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configurazione Supabase mancante per le notifiche');
    }
    
    notificationManagerInstance = new NotificationManager(supabaseUrl, supabaseKey);
  }
  
  return notificationManagerInstance;
}

export type {
  NotificationData,
  NotificationType,
  NotificationPriority,
  NotificationTemplate
};

export { NotificationManager };