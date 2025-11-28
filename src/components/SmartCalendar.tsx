// Componente calendario intelligente per gestione disponibilità BookingHSE
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, Users, CheckCircle, X, Plus, Edit, Trash2, Search, TrendingUp } from 'lucide-react';
import { getAvailabilityManager, AvailabilityHelpers } from '../lib/availability';
import type { 
  CalendarEvent, 
  AvailabilityRule, 
  BookingSlot, 
  SmartSuggestion,
  AvailabilityQuery 
} from '../lib/availability';

interface SmartCalendarProps {
  providerId: string;
  mode?: 'calendar' | 'availability' | 'booking' | 'analytics';
  onEventClick?: (event: CalendarEvent) => void;
  onSlotBook?: (slot: BookingSlot) => void;
  className?: string;
}

interface CalendarViewState {
  currentDate: Date;
  viewType: 'month' | 'week' | 'day';
  selectedDate?: Date;
  events: CalendarEvent[];
  loading: boolean;
}

interface AvailabilityFormData {
  title: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  validFrom: string;
  validUntil?: string;
  serviceTypes: string[];
  maxBookingsPerSlot: number;
  slotDuration: number;
  bufferTime: number;
  priority: number;
}

interface BlockFormData {
  startDateTime: string;
  endDateTime: string;
  reason: string;
  type: 'vacation' | 'sick' | 'maintenance' | 'personal' | 'other';
  isRecurring: boolean;
  recurrencePattern?: string;
}

const SmartCalendar: React.FC<SmartCalendarProps> = ({
  providerId,
  mode = 'calendar',
  onEventClick,
  onSlotBook,
  className = ''
}) => {
  const [viewState, setViewState] = useState<CalendarViewState>({
    currentDate: new Date(),
    viewType: 'month',
    events: [],
    loading: false
  });

  const [availabilityRules, setAvailabilityRules] = useState<AvailabilityRule[]>([]);

  const [smartSuggestions, setSmartSuggestions] = useState<SmartSuggestion[]>([]);
  const [availabilityStats, setAvailabilityStats] = useState<Record<string, unknown> | null>(null);
  
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);


  
  const [ruleForm, setRuleForm] = useState<AvailabilityFormData>({
    title: '',
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '17:00',
    recurrence: 'weekly',
    validFrom: new Date().toISOString().split('T')[0],
    serviceTypes: [],
    maxBookingsPerSlot: 1,
    slotDuration: 60,
    bufferTime: 15,
    priority: 1
  });

  const [blockForm, setBlockForm] = useState<BlockFormData>({
    startDateTime: '',
    endDateTime: '',
    reason: '',
    type: 'personal',
    isRecurring: false
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'available' | 'booked' | 'blocked'>('all');

  const availabilityManager = getAvailabilityManager();

  // Carica eventi calendario
  const loadCalendarEvents = useCallback(async () => {
    if (!providerId) return;
    
    setViewState(prev => ({ ...prev, loading: true }));
    
    try {
      const startDate = new Date(viewState.currentDate);
      startDate.setDate(1);
      const endDate = new Date(viewState.currentDate);
      endDate.setMonth(endDate.getMonth() + 1, 0);
      
      const events = await availabilityManager.getCalendarEvents(
        providerId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      setViewState(prev => ({ ...prev, events, loading: false }));
    } catch (error) {
      console.error('Errore caricamento eventi:', error);
      setViewState(prev => ({ ...prev, loading: false }));
    }
  }, [providerId, viewState.currentDate, availabilityManager]);

  // Carica statistiche
  const loadStats = useCallback(async () => {
    if (!providerId || mode !== 'analytics') return;
    
    try {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
      const endDate = new Date();
      
      const stats = await availabilityManager.getAvailabilityStats(
        providerId,
        startDate.toISOString(),
        endDate.toISOString()
      );
      
      setAvailabilityStats(stats);
    } catch (error) {
      console.error('Errore caricamento statistiche:', error);
    }
  }, [providerId, mode, availabilityManager]);

  // Carica suggerimenti intelligenti
  const loadSmartSuggestions = useCallback(async () => {
    if (!providerId || mode !== 'booking') return;
    
    try {
      const query: AvailabilityQuery = {
        providerId,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        duration: 60,
        excludeWeekends: false
      };
      
      const suggestions = await availabilityManager.getSmartSuggestions(query);
      setSmartSuggestions(suggestions);
    } catch (error) {
      console.error('Errore caricamento suggerimenti:', error);
    }
  }, [providerId, mode, availabilityManager]);

  useEffect(() => {
    loadCalendarEvents();
    loadStats();
    loadSmartSuggestions();
  }, [loadCalendarEvents, loadStats, loadSmartSuggestions]);

  // Crea regola disponibilità
  const handleCreateRule = async () => {
    try {
      const rule = await availabilityManager.createAvailabilityRule({
        providerId,
        ...ruleForm
      });
      
      if (rule) {
        setAvailabilityRules(prev => [...prev, rule]);
        setShowRuleForm(false);
        setRuleForm({
          title: '',
          dayOfWeek: 1,
          startTime: '09:00',
          endTime: '17:00',
          recurrence: 'weekly',
          validFrom: new Date().toISOString().split('T')[0],
          serviceTypes: [],
          maxBookingsPerSlot: 1,
          slotDuration: 60,
          bufferTime: 15,
          priority: 1
        });
        loadCalendarEvents();
      }
    } catch (error) {
      console.error('Errore creazione regola:', error);
    }
  };

  // Blocca disponibilità
  const handleCreateBlock = async () => {
    try {
      const success = await availabilityManager.blockAvailability({
        providerId,
        ...blockForm
      });
      
      if (success) {
        setShowBlockForm(false);
        setBlockForm({
          startDateTime: '',
          endDateTime: '',
          reason: '',
          type: 'personal',
          isRecurring: false
        });
        loadCalendarEvents();
      }
    } catch (error) {
      console.error('Errore blocco disponibilità:', error);
    }
  };

  // Prenota slot
  const handleBookSlot = async (slot: BookingSlot) => {
    if (onSlotBook) {
      onSlotBook(slot);
    } else {
      setSelectedSlot(slot);
      setShowBookingForm(true);
    }
  };

  // Filtra eventi
  const filteredEvents = viewState.events.filter(event => {
    if (filterType !== 'all' && event.type !== filterType) return false;
    if (searchQuery && !event.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  // Render calendario mensile
  const renderMonthView = () => {
    const startOfMonth = new Date(viewState.currentDate.getFullYear(), viewState.currentDate.getMonth(), 1);
    const startDate = new Date(startOfMonth);
    startDate.setDate(startDate.getDate() - startOfMonth.getDay());
    
    const days = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayEvents = filteredEvents.filter(event => {
        const eventDate = new Date(event.start).toDateString();
        return eventDate === current.toDateString();
      });
      
      days.push(
        <div
          key={current.toISOString()}
          className={`min-h-[100px] p-2 border border-gray-200 ${
            current.getMonth() !== viewState.currentDate.getMonth() ? 'bg-gray-50 text-gray-400' : 'bg-white'
          } ${
            current.toDateString() === new Date().toDateString() ? 'bg-blue-50 border-blue-300' : ''
          }`}
        >
          <div className="font-medium text-sm mb-1">{current.getDate()}</div>
          <div className="space-y-1">
            {dayEvents.slice(0, 3).map(event => (
              <div
                key={event.id}
                className={`text-xs p-1 rounded cursor-pointer truncate`}
                style={{ backgroundColor: event.color + '20', borderLeft: `3px solid ${event.color}` }}
                onClick={() => onEventClick?.(event)}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-gray-500">+{dayEvents.length - 3} altri</div>
            )}
          </div>
        </div>
      );
      
      current.setDate(current.getDate() + 1);
    }
    
    return (
      <div className="grid grid-cols-7 gap-0 border border-gray-200 rounded-lg overflow-hidden">
        {['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'].map(day => (
          <div key={day} className="bg-gray-100 p-3 text-center font-medium text-sm border-b border-gray-200">
            {day}
          </div>
        ))}
        {days}
      </div>
    );
  };

  // Render vista disponibilità
  const renderAvailabilityView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gestione Disponibilità</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setShowRuleForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            Nuova Regola
          </button>
          <button
            onClick={() => setShowBlockForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <X className="w-4 h-4" />
            Blocca Periodo
          </button>
        </div>
      </div>

      {/* Lista regole disponibilità */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium mb-4">Regole di Disponibilità</h4>
        <div className="space-y-3">
          {availabilityRules.map(rule => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <div className="font-medium">{rule.title}</div>
                <div className="text-sm text-gray-600">
                  {AvailabilityHelpers.getDayName(rule.dayOfWeek)} • {rule.startTime} - {rule.endTime}
                </div>
                <div className="text-xs text-gray-500">
                  Slot: {AvailabilityHelpers.formatDuration(rule.slotDuration)} • 
                  Buffer: {AvailabilityHelpers.formatDuration(rule.bufferTime)} • 
                  Max: {rule.maxBookingsPerSlot}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs ${
                  rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {rule.isActive ? 'Attiva' : 'Inattiva'}
                </span>
                <button className="p-1 text-gray-400 hover:text-gray-600">
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-1 text-gray-400 hover:text-red-600">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render vista prenotazioni
  const renderBookingView = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Suggerimenti Intelligenti</h3>
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Cerca slot..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid gap-4">
        {smartSuggestions.map((suggestion) => (
          <div key={suggestion.slot.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  suggestion.score >= 80 ? 'bg-green-500' :
                  suggestion.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div>
                  <div className="font-medium">
                    {AvailabilityHelpers.formatDate(suggestion.slot.startDateTime)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {AvailabilityHelpers.formatTime(suggestion.slot.startDateTime)} - 
                    {AvailabilityHelpers.formatTime(suggestion.slot.endDateTime)}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm font-medium">Score: {suggestion.score}/100</div>
                  <div className="text-xs text-gray-500">
                    {suggestion.slot.currentBookings}/{suggestion.slot.maxCapacity} prenotazioni
                  </div>
                </div>
                <button
                  onClick={() => handleBookSlot(suggestion.slot)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Prenota
                </button>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {suggestion.reasons.map((reason, idx) => (
                <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                  {reason}
                </span>
              ))}
            </div>
            
            {suggestion.alternativeSlots.length > 0 && (
              <div>
                <div className="text-sm font-medium mb-2">Slot alternativi:</div>
                <div className="flex gap-2">
                  {suggestion.alternativeSlots.map(altSlot => (
                    <button
                      key={altSlot.id}
                      onClick={() => handleBookSlot(altSlot)}
                      className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200"
                    >
                      {AvailabilityHelpers.formatTime(altSlot.startDateTime)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // Render vista analytics
  const renderAnalyticsView = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Analytics Disponibilità</h3>
      
      {availabilityStats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-medium">Slot Totali</span>
            </div>
            <div className="text-2xl font-bold">{availabilityStats.totalSlots}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium">Prenotati</span>
            </div>
            <div className="text-2xl font-bold">{availabilityStats.bookedSlots}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
              <span className="font-medium">Disponibili</span>
            </div>
            <div className="text-2xl font-bold">{availabilityStats.availableSlots}</div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-purple-600" />
              <span className="font-medium">Utilizzo</span>
            </div>
            <div className="text-2xl font-bold">{availabilityStats.utilizationRate}%</div>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium mb-4">Orari di Punta</h4>
          <div className="space-y-2">
            {availabilityStats?.peakHours.map((hour: number) => (
              <div key={hour} className="flex items-center justify-between">
                <span>{hour}:00 - {hour + 1}:00</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '80%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h4 className="font-medium mb-4">Giorni Popolari</h4>
          <div className="space-y-2">
            {availabilityStats?.peakDays.map((day: number) => (
              <div key={day} className="flex items-center justify-between">
                <span>{AvailabilityHelpers.getDayName(day)}</span>
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div className="bg-green-600 h-2 rounded-full" style={{ width: '70%' }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`bg-gray-50 rounded-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold">Calendario Intelligente</h2>
          <div className="flex bg-white rounded-lg border border-gray-200">
            {[
              { key: 'calendar', label: 'Calendario', icon: Calendar },
              { key: 'availability', label: 'Disponibilità', icon: Clock },
              { key: 'booking', label: 'Prenotazioni', icon: Users },
              { key: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setViewState(prev => ({ ...prev, viewType: key }))}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg ${
                  mode === key
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">Tutti gli eventi</option>
            <option value="available">Disponibili</option>
            <option value="booked">Prenotati</option>
            <option value="blocked">Bloccati</option>
          </select>
          
          <div className="flex bg-white rounded-lg border border-gray-200">
            {['month', 'week', 'day'].map(view => (
              <button
                key={view}
                onClick={() => setViewState(prev => ({ ...prev, viewType: view }))}
                className={`px-3 py-2 text-sm font-medium capitalize ${
                  viewState.viewType === view
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                } first:rounded-l-lg last:rounded-r-lg`}
              >
                {view === 'month' ? 'Mese' : view === 'week' ? 'Settimana' : 'Giorno'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Navigazione data */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const newDate = new Date(viewState.currentDate);
              newDate.setMonth(newDate.getMonth() - 1);
              setViewState(prev => ({ ...prev, currentDate: newDate }));
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            ←
          </button>
          <h3 className="text-lg font-semibold">
            {viewState.currentDate.toLocaleDateString('it-IT', { 
              month: 'long', 
              year: 'numeric' 
            })}
          </h3>
          <button
            onClick={() => {
              const newDate = new Date(viewState.currentDate);
              newDate.setMonth(newDate.getMonth() + 1);
              setViewState(prev => ({ ...prev, currentDate: newDate }));
            }}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            →
          </button>
          <button
            onClick={() => setViewState(prev => ({ ...prev, currentDate: new Date() }))}
            className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Oggi
          </button>
        </div>
        
        {viewState.loading && (
          <div className="flex items-center gap-2 text-gray-600">
            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
            Caricamento...
          </div>
        )}
      </div>

      {/* Contenuto principale */}
      <div className="min-h-[600px]">
        {mode === 'calendar' && renderMonthView()}
        {mode === 'availability' && renderAvailabilityView()}
        {mode === 'booking' && renderBookingView()}
        {mode === 'analytics' && renderAnalyticsView()}
      </div>

      {/* Modal form regola disponibilità */}
      {showRuleForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Nuova Regola Disponibilità</h3>
              <button
                onClick={() => setShowRuleForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titolo</label>
                <input
                  type="text"
                  value={ruleForm.title}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Es. Orario ufficio"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Giorno della settimana</label>
                <select
                  value={ruleForm.dayOfWeek}
                  onChange={(e) => setRuleForm(prev => ({ ...prev, dayOfWeek: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {[0, 1, 2, 3, 4, 5, 6].map(day => (
                    <option key={day} value={day}>
                      {AvailabilityHelpers.getDayName(day)}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Ora inizio</label>
                  <input
                    type="time"
                    value={ruleForm.startTime}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Ora fine</label>
                  <input
                    type="time"
                    value={ruleForm.endTime}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Durata slot (min)</label>
                  <input
                    type="number"
                    value={ruleForm.slotDuration}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, slotDuration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="15"
                    step="15"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Buffer (min)</label>
                  <input
                    type="number"
                    value={ruleForm.bufferTime}
                    onChange={(e) => setRuleForm(prev => ({ ...prev, bufferTime: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                    step="5"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRuleForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateRule}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Crea Regola
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal form blocco disponibilità */}
      {showBlockForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Blocca Disponibilità</h3>
              <button
                onClick={() => setShowBlockForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Motivo</label>
                <input
                  type="text"
                  value={blockForm.reason}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, reason: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Es. Ferie, Malattia, Manutenzione"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Tipo</label>
                <select
                  value={blockForm.type}
                  onChange={(e) => setBlockForm(prev => ({ ...prev, type: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="vacation">Ferie</option>
                  <option value="sick">Malattia</option>
                  <option value="maintenance">Manutenzione</option>
                  <option value="personal">Personale</option>
                  <option value="other">Altro</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Data/ora inizio</label>
                  <input
                    type="datetime-local"
                    value={blockForm.startDateTime}
                    onChange={(e) => setBlockForm(prev => ({ ...prev, startDateTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Data/ora fine</label>
                  <input
                    type="datetime-local"
                    value={blockForm.endDateTime}
                    onChange={(e) => setBlockForm(prev => ({ ...prev, endDateTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBlockForm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateBlock}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Blocca
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SmartCalendar;
export type { SmartCalendarProps, CalendarEvent };