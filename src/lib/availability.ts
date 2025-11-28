// Sistema di gestione disponibilità e calendario intelligente per BookingHSE
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

type AvailabilityStatus = 'available' | 'busy' | 'blocked' | 'tentative';
type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'custom';
type BookingType = 'consultation' | 'audit' | 'training' | 'certification' | 'emergency';

interface TimeSlot {
  start: string; // ISO datetime
  end: string;   // ISO datetime
  status: AvailabilityStatus;
  serviceId?: string;
  bookingId?: string;
  notes?: string;
}

interface AvailabilityRule {
  id: string;
  providerId: string;
  title: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
  startTime: string; // HH:MM format
  endTime: string;   // HH:MM format
  isActive: boolean;
  recurrence: RecurrenceType;
  validFrom: string;
  validUntil?: string;
  serviceTypes: BookingType[];
  maxBookingsPerSlot: number;
  slotDuration: number; // minutes
  bufferTime: number;   // minutes between bookings
  priority: number;     // higher number = higher priority
  metadata?: Record<string, string | number | boolean>;
}

interface AvailabilityBlock {
  id: string;
  providerId: string;
  startDateTime: string;
  endDateTime: string;
  reason: string;
  type: 'vacation' | 'sick' | 'maintenance' | 'personal' | 'other';
  isRecurring: boolean;
  recurrencePattern?: string;
  createdAt: string;
}

interface BookingSlot {
  id: string;
  providerId: string;
  serviceId: string;
  startDateTime: string;
  endDateTime: string;
  status: 'available' | 'booked' | 'pending' | 'cancelled';
  maxCapacity: number;
  currentBookings: number;
  price?: number;
  specialRequirements?: string[];
  location?: string;
  isOnline: boolean;
}

interface AvailabilityQuery {
  providerId: string;
  serviceId?: string;
  startDate: string;
  endDate: string;
  duration?: number; // minutes
  bookingType?: BookingType;
  preferredTimes?: string[]; // HH:MM format
  excludeWeekends?: boolean;
  minAdvanceNotice?: number; // hours
  maxAdvanceBooking?: number; // days
}

interface SmartSuggestion {
  slot: BookingSlot;
  score: number;
  reasons: string[];
  alternativeSlots: BookingSlot[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'booking' | 'blocked' | 'available' | 'break';
  status: AvailabilityStatus;
  color: string;
  description?: string;
  location?: string;
  attendees?: string[];
  isEditable: boolean;
}

class AvailabilityManager {
  private supabase: ReturnType<typeof createClient<Database>>;
  private cache: Map<string, {
    data: unknown;
    timestamp: number;
  }> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
  }

  // Crea regola di disponibilità
  async createAvailabilityRule(rule: Omit<AvailabilityRule, 'id'>): Promise<AvailabilityRule | null> {
    try {
      // Since availability_rules table doesn't exist, we'll create slots directly
      // and return a mock rule object for compatibility
      const mockRule: AvailabilityRule = {
        id: `rule_${Date.now()}`,
        providerId: rule.providerId,
        title: rule.title,
        dayOfWeek: rule.dayOfWeek,
        startTime: rule.startTime,
        endTime: rule.endTime,
        isActive: rule.isActive,
        recurrence: rule.recurrence,
        validFrom: rule.validFrom,
        validUntil: rule.validUntil,
        serviceTypes: rule.serviceTypes,
        maxBookingsPerSlot: rule.maxBookingsPerSlot,
        slotDuration: rule.slotDuration,
        bufferTime: rule.bufferTime,
        priority: rule.priority,
        metadata: rule.metadata
      };

      // Invalida cache
      this.invalidateCache(rule.providerId);
      
      // Genera slot automaticamente
      await this.generateSlotsFromRule(mockRule);

      return mockRule;
    } catch (error) {
      console.error('Errore creazione regola disponibilità:', error);
      return null;
    }
  }

  // Genera slot da regola
  private async generateSlotsFromRule(rule: AvailabilityRule): Promise<void> {
    try {
      const slots: Omit<BookingSlot, 'id'>[] = [];
      const startDate = new Date(rule.validFrom);
      const endDate = rule.validUntil ? new Date(rule.validUntil) : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 giorni

      const currentDate = new Date(startDate);
      
      while (currentDate <= endDate) {
        // Verifica se il giorno corrisponde alla regola
        if (currentDate.getDay() === rule.dayOfWeek) {
          const slotStart = new Date(currentDate);
          const [startHour, startMinute] = rule.startTime.split(':').map(Number);
          slotStart.setHours(startHour, startMinute, 0, 0);

          const slotEnd = new Date(currentDate);
          const [endHour, endMinute] = rule.endTime.split(':').map(Number);
          slotEnd.setHours(endHour, endMinute, 0, 0);

          // Genera slot per l'intera durata
          let currentSlotStart = new Date(slotStart);
          
          while (currentSlotStart < slotEnd) {
            const currentSlotEnd = new Date(currentSlotStart.getTime() + rule.slotDuration * 60 * 1000);
            
            if (currentSlotEnd <= slotEnd) {
              slots.push({
                providerId: rule.providerId,
                serviceId: '', // Sarà specificato al momento della prenotazione
                startDateTime: currentSlotStart.toISOString(),
                endDateTime: currentSlotEnd.toISOString(),
                status: 'available',
                maxCapacity: rule.maxBookingsPerSlot,
                currentBookings: 0,
                isOnline: false
              });
            }
            
            // Aggiungi buffer time
            currentSlotStart = new Date(currentSlotEnd.getTime() + rule.bufferTime * 60 * 1000);
          }
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Inserisci slot nel database usando availability_slots
      if (slots.length > 0) {
        const availabilitySlots = slots.map(slot => {
          const startDate = new Date(slot.startDateTime);
          const endDate = new Date(slot.endDateTime);
          
          return {
            provider_id: slot.providerId,
            service_id: slot.serviceId || null,
            date: startDate.toISOString().split('T')[0], // YYYY-MM-DD format
            start_time: startDate.toTimeString().split(' ')[0], // HH:MM:SS format
            end_time: endDate.toTimeString().split(' ')[0], // HH:MM:SS format
            duration_minutes: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60)),
            max_bookings: slot.maxCapacity || 1,
            current_bookings: slot.currentBookings || 0,
            price_override: slot.price || null,
            status: slot.status as 'available' | 'booked' | 'blocked' | 'unavailable',
            notes: slot.specialRequirements || null
          };
        });

        const { error } = await this.supabase
          .from('availability_slots')
          .insert(availabilitySlots);

        if (error) {
          console.error('Errore inserimento slot:', error);
        }
      }
    } catch (error) {
      console.error('Errore generazione slot:', error);
    }
  }

  // Blocca periodo di disponibilità
  async blockAvailability(block: Omit<AvailabilityBlock, 'id' | 'createdAt'>): Promise<boolean> {
    try {
      // Since availability_blocks table doesn't exist, we'll just update slots directly
      // Aggiorna slot esistenti
      await this.updateSlotsForBlock(block);
      
      // Invalida cache
      this.invalidateCache(block.providerId);

      return true;
    } catch (error) {
      console.error('Errore blocco disponibilità:', error);
      return false;
    }
  }

  // Aggiorna slot per blocco
  private async updateSlotsForBlock(block: Omit<AvailabilityBlock, 'id' | 'createdAt'>): Promise<void> {
    try {
      const startDate = new Date(block.startDateTime);
      const endDate = new Date(block.endDateTime);
      
      await this.supabase
        .from('availability_slots')
        .update({ status: 'blocked' })
        .eq('provider_id', block.providerId)
        .eq('date', startDate.toISOString().split('T')[0])
        .gte('start_time', startDate.toTimeString().split(' ')[0])
        .lte('end_time', endDate.toTimeString().split(' ')[0])
        .eq('status', 'available');
    } catch (error) {
      console.error('Errore aggiornamento slot per blocco:', error);
    }
  }

  // Cerca disponibilità
  async findAvailability(query: AvailabilityQuery): Promise<BookingSlot[]> {
    try {
      const cacheKey = `availability_${JSON.stringify(query)}`;
      const cached = this.getFromCache(cacheKey);
      if (cached) return cached;

      let dbQuery = this.supabase
        .from('availability_slots')
        .select('*')
        .eq('provider_id', query.providerId)
        .eq('status', 'available')
        .gte('date', query.startDate.split('T')[0])
        .lte('date', query.endDate.split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (query.serviceId) {
        dbQuery = dbQuery.or(`service_id.eq.${query.serviceId},service_id.is.null`);
      }

      const { data: slots, error } = await dbQuery;

      if (error) {
        console.error('Errore ricerca disponibilità:', error);
        return [];
      }

      // Convert availability_slots to BookingSlot format
      let availableSlots: BookingSlot[] = (slots || []).map(slot => {
        // Combine date and time to create datetime strings
        const startDateTime = `${slot.date}T${slot.start_time}`;
        const endDateTime = `${slot.date}T${slot.end_time}`;
        
        return {
          id: slot.id,
          providerId: slot.provider_id,
          serviceId: slot.service_id || '',
          startDateTime,
          endDateTime,
          status: slot.status as 'available' | 'booked' | 'blocked' | 'unavailable',
          maxCapacity: slot.max_bookings || 1,
          currentBookings: slot.current_bookings || 0,
          price: slot.price_override,
          specialRequirements: slot.notes,
          location: undefined, // Not available in availability_slots
          isOnline: false // Not available in availability_slots
        };
      });

      // Applica filtri aggiuntivi
      if (query.duration) {
        availableSlots = availableSlots.filter(slot => {
          const duration = new Date(slot.endDateTime).getTime() - new Date(slot.startDateTime).getTime();
          return duration >= query.duration! * 60 * 1000;
        });
      }

      if (query.excludeWeekends) {
        availableSlots = availableSlots.filter(slot => {
          const day = new Date(slot.startDateTime).getDay();
          return day !== 0 && day !== 6; // Non domenica e sabato
        });
      }

      if (query.minAdvanceNotice) {
        const minTime = new Date(Date.now() + query.minAdvanceNotice * 60 * 60 * 1000);
        availableSlots = availableSlots.filter(slot => 
          new Date(slot.startDateTime) >= minTime
        );
      }

      if (query.maxAdvanceBooking) {
        const maxTime = new Date(Date.now() + query.maxAdvanceBooking * 24 * 60 * 60 * 1000);
        availableSlots = availableSlots.filter(slot => 
          new Date(slot.startDateTime) <= maxTime
        );
      }

      if (query.preferredTimes && query.preferredTimes.length > 0) {
        availableSlots = availableSlots.filter(slot => {
          const slotTime = new Date(slot.startDateTime).toTimeString().substring(0, 5);
          return query.preferredTimes!.some(preferredTime => {
            const [prefHour, prefMinute] = preferredTime.split(':').map(Number);
            const [slotHour, slotMinute] = slotTime.split(':').map(Number);
            const prefMinutes = prefHour * 60 + prefMinute;
            const slotMinutes = slotHour * 60 + slotMinute;
            return Math.abs(slotMinutes - prefMinutes) <= 30; // Tolleranza di 30 minuti
          });
        });
      }

      // Cache risultato
      this.setCache(cacheKey, availableSlots);

      return availableSlots;
    } catch (error) {
      console.error('Errore ricerca disponibilità:', error);
      return [];
    }
  }

  // Suggerimenti intelligenti
  async getSmartSuggestions(query: AvailabilityQuery): Promise<SmartSuggestion[]> {
    try {
      const availableSlots = await this.findAvailability(query);
      const suggestions: SmartSuggestion[] = [];

      // Ottieni storico prenotazioni per analisi pattern
      const { data: bookingHistory } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('provider_id', query.providerId)
        .eq('status', 'completed')
        .gte('created_at', new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      for (const slot of availableSlots.slice(0, 10)) { // Limita a 10 suggerimenti
        let score = 50; // Score base
        const reasons: string[] = [];

        // Analisi pattern temporali
        if (bookingHistory) {
          const slotHour = new Date(slot.startDateTime).getHours();
          const slotDay = new Date(slot.startDateTime).getDay();
          
          // Preferenza orari popolari
          const popularHours = this.getPopularHours(bookingHistory);
          if (popularHours.includes(slotHour)) {
            score += 15;
            reasons.push('Orario popolare');
          }

          // Preferenza giorni popolari
          const popularDays = this.getPopularDays(bookingHistory);
          if (popularDays.includes(slotDay)) {
            score += 10;
            reasons.push('Giorno popolare');
          }
        }

        // Bonus per slot vicini a orari preferiti
        if (query.preferredTimes) {
          const slotTime = new Date(slot.startDateTime).toTimeString().substring(0, 5);
          const isPreferred = query.preferredTimes.some(time => {
            const timeDiff = this.getTimeDifference(time, slotTime);
            return timeDiff <= 60; // Entro 1 ora
          });
          
          if (isPreferred) {
            score += 20;
            reasons.push('Vicino a orario preferito');
          }
        }

        // Bonus per disponibilità immediata
        const hoursFromNow = (new Date(slot.startDateTime).getTime() - Date.now()) / (1000 * 60 * 60);
        if (hoursFromNow <= 24) {
          score += 10;
          reasons.push('Disponibilità immediata');
        }

        // Penalità per orari scomodi
        const hour = new Date(slot.startDateTime).getHours();
        if (hour < 8 || hour > 18) {
          score -= 10;
          reasons.push('Orario meno conveniente');
        }

        // Bonus per slot con maggiore capacità
        if (slot.maxCapacity > 1) {
          score += 5;
          reasons.push('Maggiore flessibilità');
        }

        // Trova slot alternativi
        const alternativeSlots = availableSlots
          .filter(altSlot => 
            altSlot.id !== slot.id &&
            Math.abs(new Date(altSlot.startDateTime).getTime() - new Date(slot.startDateTime).getTime()) <= 2 * 60 * 60 * 1000 // Entro 2 ore
          )
          .slice(0, 3);

        suggestions.push({
          slot,
          score: Math.min(100, Math.max(0, score)),
          reasons,
          alternativeSlots
        });
      }

      // Ordina per score
      return suggestions.sort((a, b) => b.score - a.score);
    } catch (error) {
      console.error('Errore generazione suggerimenti:', error);
      return [];
    }
  }

  // Ottieni orari popolari
  private getPopularHours(bookings: Array<{ start_datetime: string }>): number[] {
    const hourCounts: Record<number, number> = {};
    
    bookings.forEach(booking => {
      const hour = new Date(booking.start_datetime).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    return Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([hour]) => parseInt(hour));
  }

  // Ottieni giorni popolari
  private getPopularDays(bookings: Array<{ start_datetime: string }>): number[] {
    const dayCounts: Record<number, number> = {};
    
    bookings.forEach(booking => {
      const day = new Date(booking.start_datetime).getDay();
      dayCounts[day] = (dayCounts[day] || 0) + 1;
    });

    return Object.entries(dayCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([day]) => parseInt(day));
  }

  // Calcola differenza tempo in minuti
  private getTimeDifference(time1: string, time2: string): number {
    const [h1, m1] = time1.split(':').map(Number);
    const [h2, m2] = time2.split(':').map(Number);
    const minutes1 = h1 * 60 + m1;
    const minutes2 = h2 * 60 + m2;
    return Math.abs(minutes1 - minutes2);
  }

  // Prenota slot
  async bookSlot(
    slotId: string,
    bookingData: {
      clientId: string;
      serviceId: string;
      notes?: string;
      specialRequirements?: string[];
    }
  ): Promise<boolean> {
    try {
      // Verifica disponibilità
      const { data: slot, error: slotError } = await this.supabase
        .from('booking_slots')
        .select('*')
        .eq('id', slotId)
        .eq('status', 'available')
        .maybeSingle();

      if (slotError || !slot) {
        console.error('Slot non disponibile:', slotError);
        return false;
      }

      // Verifica capacità
      if ((slot.current_bookings || 0) >= (slot.max_bookings || 1)) {
        console.error('Slot al completo');
        return false;
      }

      // Crea prenotazione
      const startDateTime = `${slot.date}T${slot.start_time}`;
      const endDateTime = `${slot.date}T${slot.end_time}`;
      
      const { error: bookingError } = await this.supabase
        .from('bookings')
        .insert({
          client_id: bookingData.clientId,
          provider_id: slot.provider_id,
          service_id: bookingData.serviceId,
          start_datetime: startDateTime,
          end_datetime: endDateTime,
          status: 'confirmed',
          notes: bookingData.notes,
          special_requirements: bookingData.specialRequirements
        })
        .select()
        .maybeSingle();

      if (bookingError) {
        console.error('Errore creazione prenotazione:', bookingError);
        return false;
      }

      // Aggiorna slot
      const newBookingCount = (slot.current_bookings || 0) + 1;
      const newStatus = newBookingCount >= (slot.max_bookings || 1) ? 'booked' : 'available';

      await this.supabase
        .from('availability_slots')
        .update({
          current_bookings: newBookingCount,
          status: newStatus
        })
        .eq('id', slotId);

      // Invalida cache
      this.invalidateCache(slot.provider_id);

      return true;
    } catch (error) {
      console.error('Errore prenotazione slot:', error);
      return false;
    }
  }

  // Ottieni calendario eventi
  async getCalendarEvents(
    providerId: string,
    startDate: string,
    endDate: string
  ): Promise<CalendarEvent[]> {
    try {
      const events: CalendarEvent[] = [];

      // Carica prenotazioni
      const { data: bookings } = await this.supabase
        .from('bookings')
        .select(`
          *,
          services!inner(title),
          client:users!bookings_client_id_fkey(first_name, last_name)
        `)
        .eq('provider_id', providerId)
        .gte('start_datetime', startDate)
        .lte('start_datetime', endDate)
        .in('status', ['confirmed', 'pending', 'in_progress']);

      if (bookings) {
        bookings.forEach(booking => {
          events.push({
            id: booking.id,
            title: `${booking.services.title} - ${(booking as any).client.first_name} ${(booking as any).client.last_name}`,
            start: booking.start_datetime,
            end: booking.end_datetime,
            type: 'booking',
            status: booking.status === 'confirmed' ? 'busy' : 'tentative',
            color: this.getEventColor(booking.status),
            description: booking.notes,
            location: booking.location,
            isEditable: true
          });
        });
      }

      // Skip loading blocks since availability_blocks table doesn't exist
      // Blocks are handled by setting is_available to false in availability_slots

      // Carica slot disponibili
      const { data: slots } = await this.supabase
        .from('availability_slots')
        .select('*')
        .eq('provider_id', providerId)
        .eq('status', 'available')
        .gte('date', startDate.split('T')[0])
        .lte('date', endDate.split('T')[0])
        .limit(50); // Limita per performance

      if (slots) {
        slots.forEach(slot => {
          const startDateTime = `${slot.date}T${slot.start_time}`;
          const endDateTime = `${slot.date}T${slot.end_time}`;
          
          events.push({
            id: `slot_${slot.id}`,
            title: 'Disponibile',
            start: startDateTime,
            end: endDateTime,
            type: 'available',
            status: 'available',
            color: '#10b981',
            isEditable: false
          });
        });
      }

      return events.sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());
    } catch (error) {
      console.error('Errore caricamento eventi calendario:', error);
      return [];
    }
  }

  // Ottieni colore evento
  private getEventColor(status: string): string {
    switch (status) {
      case 'confirmed': return '#3b82f6';
      case 'pending': return '#f59e0b';
      case 'in_progress': return '#8b5cf6';
      case 'completed': return '#10b981';
      case 'cancelled': return '#ef4444';
      default: return '#6b7280';
    }
  }

  // Gestione cache
  private getFromCache(key: string): unknown {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: unknown): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  private invalidateCache(providerId: string): void {
    const keysToDelete = Array.from(this.cache.keys())
      .filter(key => key.includes(providerId));
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  // Ottieni statistiche disponibilità
  async getAvailabilityStats(
    providerId: string,
    startDate: string,
    endDate: string
  ): Promise<{
    totalSlots: number;
    bookedSlots: number;
    availableSlots: number;
    utilizationRate: number;
    peakHours: number[];
    peakDays: number[];
    averageBookingDuration: number;
  }> {
    try {
      const { data: slots } = await this.supabase
        .from('availability_slots')
        .select('*')
        .eq('provider_id', providerId)
        .gte('date', startDate.split('T')[0])
        .lte('date', endDate.split('T')[0]);

      const { data: bookings } = await this.supabase
        .from('bookings')
        .select('*')
        .eq('provider_id', providerId)
        .gte('start_datetime', startDate)
        .lte('start_datetime', endDate)
        .eq('status', 'completed');

      if (!slots) {
        return {
          totalSlots: 0,
          bookedSlots: 0,
          availableSlots: 0,
          utilizationRate: 0,
          peakHours: [],
          peakDays: [],
          averageBookingDuration: 0
        };
      }

      const totalSlots = slots.length;
      const bookedSlots = slots.filter(s => s.status === 'booked').length;
      const availableSlots = slots.filter(s => s.status === 'available').length;
      const utilizationRate = totalSlots > 0 ? (bookedSlots / totalSlots) * 100 : 0;

      const peakHours = bookings ? this.getPopularHours(bookings) : [];
      const peakDays = bookings ? this.getPopularDays(bookings) : [];

      const averageBookingDuration = bookings && bookings.length > 0 ?
        bookings.reduce((sum, booking) => {
          const duration = new Date(booking.end_datetime).getTime() - new Date(booking.start_datetime).getTime();
          return sum + duration;
        }, 0) / bookings.length / (1000 * 60) : 0; // in minuti

      return {
        totalSlots,
        bookedSlots,
        availableSlots,
        utilizationRate: Math.round(utilizationRate * 100) / 100,
        peakHours,
        peakDays,
        averageBookingDuration: Math.round(averageBookingDuration)
      };
    } catch (error) {
      console.error('Errore statistiche disponibilità:', error);
      return {
        totalSlots: 0,
        bookedSlots: 0,
        availableSlots: 0,
        utilizationRate: 0,
        peakHours: [],
        peakDays: [],
        averageBookingDuration: 0
      };
    }
  }
}

// Funzioni di utilità
export const AvailabilityHelpers = {
  // Formatta durata
  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours === 0) return `${mins}m`;
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}m`;
  },

  // Formatta orario
  formatTime(datetime: string): string {
    return new Date(datetime).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Formatta data
  formatDate(datetime: string): string {
    return new Date(datetime).toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Ottieni nome giorno
  getDayName(dayOfWeek: number): string {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[dayOfWeek] || 'Sconosciuto';
  },

  // Verifica se è giorno lavorativo
  isWorkingDay(date: Date): boolean {
    const day = date.getDay();
    return day >= 1 && day <= 5; // Lunedì-Venerdì
  },

  // Ottieni prossimo giorno lavorativo
  getNextWorkingDay(date: Date): Date {
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    while (!this.isWorkingDay(nextDay)) {
      nextDay.setDate(nextDay.getDate() + 1);
    }
    
    return nextDay;
  },

  // Genera slot per range di date
  generateDateRange(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const current = new Date(start);
    while (current <= end) {
      dates.push(current.toISOString().split('T')[0]);
      current.setDate(current.getDate() + 1);
    }
    
    return dates;
  }
};

// Istanza singleton
let availabilityManagerInstance: AvailabilityManager | null = null;

export function getAvailabilityManager(): AvailabilityManager {
  if (!availabilityManagerInstance) {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Configurazione Supabase mancante per la gestione disponibilità');
    }
    
    availabilityManagerInstance = new AvailabilityManager(supabaseUrl, supabaseKey);
  }
  
  return availabilityManagerInstance;
}

export type {
  AvailabilityRule,
  AvailabilityBlock,
  BookingSlot,
  AvailabilityQuery,
  SmartSuggestion,
  CalendarEvent,
  TimeSlot,
  AvailabilityStatus,
  RecurrenceType,
  BookingType
};

export { AvailabilityManager };