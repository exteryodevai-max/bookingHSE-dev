import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyEuroIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout/Layout';
import { db } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useSupabaseError } from '../lib/errors';
import { ServiceWithProvider, Booking as BookingType, Participant, isClientProfile } from '../types';
import toast from 'react-hot-toast';

// Validation schema
const bookingSchema = yup.object({
  requested_date: yup.string().required('Data richiesta obbligatoria'),
  requested_time: yup.string().required('Orario richiesto obbligatorio'),
  participants_count: yup.number().min(1, 'Almeno 1 partecipante').required('Numero partecipanti obbligatorio'),
  client_notes: yup.string().optional(),
  special_requirements: yup.array().of(yup.string()).optional(),
  participants: yup.array().of(
    yup.object({
      first_name: yup.string().required('Nome obbligatorio'),
      last_name: yup.string().required('Cognome obbligatorio'),
      email: yup.string().email('Email non valida').optional(),
      phone: yup.string().optional(),
      role: yup.string().optional(),
      department: yup.string().optional(),
      employee_id: yup.string().optional(),
      special_needs: yup.string().optional()
    })
  ).optional()
});

type BookingFormData = yup.InferType<typeof bookingSchema>;

export default function Booking() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { handleError, logError } = useSupabaseError();
  const [service, setService] = useState<ServiceWithProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [calculatedTotal, setCalculatedTotal] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<BookingFormData>({
    resolver: yupResolver(bookingSchema),
    defaultValues: {
      participants_count: 1,
      participants: [{}],
      special_requirements: []
    }
  });

  const watchedValues = watch();
  const participantsCount = watch('participants_count');

  useEffect(() => {
    if (!user) {
      toast.error('Devi effettuare l\'accesso per prenotare');
      navigate('/auth/login');
      return;
    }

    if (id) {
      loadService();
    }
  }, [id, user, navigate, loadService]);

  useEffect(() => {
    // Update participants array when count changes
    if (participantsCount) {
      const currentParticipants = watchedValues.participants || [];
      const newParticipants = Array.from({ length: participantsCount }, (_, index) => 
        currentParticipants[index] || {}
      );
      setValue('participants', newParticipants);
    }
  }, [participantsCount, setValue, watchedValues.participants]);

  useEffect(() => {
    // Update calculated total when dependencies change
    if (service && participantsCount) {
      setCalculatedTotal(totalWithTax);
    }
  }, [service, participantsCount, totalWithTax]);

  const loadService = useCallback(async () => {
    try {
      setLoading(true);
      const serviceData = await db.getServiceById(id!);
      setService(serviceData);
    } catch (error) {
      logError(error, 'Error loading service');
      handleError(error, 'Errore nel caricamento del servizio');
      navigate('/search');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, handleError, logError]);

  const calculateTotal = useCallback(() => {
    if (!service) return 0;

    let total = service.pricing.base_price;

    // Apply pricing unit
    switch (service.pricing.pricing_unit) {
      case 'per_participant':
        total *= participantsCount;
        break;
      case 'per_employee':
        total *= participantsCount;
        break;
      // For fixed, per_hour, per_day, the base price remains the same
    }

    // Add additional costs
    service.pricing.additional_costs.forEach(cost => {
      if (cost.type === 'fixed') {
        total += cost.amount;
      } else if (cost.type === 'percentage') {
        total += (total * cost.amount) / 100;
      }
    });

    // Apply discounts
    service.pricing.discounts.forEach(discount => {
      if (discount.type === 'fixed') {
        total -= discount.value;
      } else if (discount.type === 'percentage') {
        total -= (total * discount.value) / 100;
      }
    });

    return total;
  }, [service, participantsCount]);

  const totalWithTax = useMemo(() => {
    const baseTotal = calculateTotal();
    // Add tax (assuming 22% IVA)
    const taxAmount = baseTotal * 0.22;
    const totalWithTaxes = baseTotal + taxAmount;

    return Math.max(0, totalWithTaxes);
  }, [calculateTotal]);

  const onSubmit = useCallback(async (data: BookingFormData) => {
    if (!service || !user) return;

    try {
      setSubmitting(true);

      // Generate booking number
      const bookingNumber = `BH${Date.now()}`;

      const bookingData: Partial<BookingType> = {
        booking_number: bookingNumber,
        client_id: user.id,
        provider_id: service.provider_id,
        service_id: service.id,
        status: service.service_type === 'instant' ? 'confirmed' : 'pending',
        booking_type: service.service_type,
        service_title: service.title,
        service_category: service.category,
        requested_date: data.requested_date,
        requested_time: data.requested_time,
        duration_hours: service.duration_hours || 1,
        participants_count: data.participants_count,
        participants: data.participants as Participant[],
        base_amount: service.pricing.base_price,
        additional_costs: service.pricing.additional_costs.map(cost => ({
          name: cost.name,
          amount: cost.amount,
          type: cost.type,
          description: cost.description
        })),
        discount_amount: 0, // Calculate based on applied discounts
        tax_amount: calculatedTotal * 0.22 / 1.22, // Extract tax from total
        total_amount: calculatedTotal,
        currency: 'EUR',
        payment_status: 'pending',
        client_notes: data.client_notes,
        special_requirements: data.special_requirements,
        location: {
          type: service.location_type === 'on_site' ? 'client_site' : 'provider_site',
          address: user.user_type === 'client' && isClientProfile(user.profile) ? user.profile.legal_address?.street : undefined
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const booking = await db.createBooking(bookingData);

      // Create notification for provider
      await db.createNotification({
        user_id: service.provider_id,
        type: 'booking_confirmed',
        title: 'Nuova Prenotazione',
        message: `Hai ricevuto una nuova prenotazione per ${service.title}`,
        data: { booking_id: booking.id },
        read: false,
        created_at: new Date().toISOString()
      });

      toast.success(
        service.service_type === 'instant' 
          ? 'Prenotazione confermata!' 
          : 'Richiesta inviata! Riceverai una risposta entro 24h'
      );

      navigate(`/bookings/${booking.id}`);
    } catch (error) {
      logError(error, 'Error creating booking');
      handleError(error, 'Errore durante la prenotazione');
    } finally {
      setSubmitting(false);
    }
  }, [service, user, navigate, calculatedTotal, handleError, logError]);

  const pricingUnitLabels = useMemo(() => ({
    fixed: 'fisso',
    per_hour: '/ora',
    per_day: '/giorno',
    per_participant: '/partecipante',
    per_employee: '/dipendente',
  }), []);

  const getPricingUnitLabel = useCallback((unit: string) => {
    return pricingUnitLabels[unit] || '';
  }, [pricingUnitLabels]);

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-6"></div>
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!service) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Servizio non trovato</h1>
          <p className="text-gray-600">Il servizio che stai cercando di prenotare non esiste.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {service.service_type === 'instant' ? 'Prenota Servizio' : 'Richiedi Preventivo'}
          </h1>
          <p className="text-gray-600">
            {service.title} - {service.provider.provider_profile?.business_name || 'Fornitore'}
          </p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center">
            {[1, 2, 3].map((stepNumber) => (
              <React.Fragment key={stepNumber}>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step >= stepNumber 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNumber}
                </div>
                {stepNumber < 3 && (
                  <div className={`flex-1 h-1 mx-4 ${
                    step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-sm text-gray-600">
            <span>Dettagli</span>
            <span>Partecipanti</span>
            <span>Conferma</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Form */}
            <div className="lg:col-span-2">
              {/* Step 1: Service Details */}
              {step === 1 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Dettagli Prenotazione</h2>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Data Richiesta *
                      </label>
                      <div className="relative">
                        <CalendarDaysIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="date"
                          {...register('requested_date')}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {errors.requested_date && (
                        <p className="mt-1 text-sm text-red-600">{errors.requested_date.message}</p>
                      )}
                    </div>

                    {/* Time */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Orario Richiesto *
                      </label>
                      <div className="relative">
                        <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="time"
                          {...register('requested_time')}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {errors.requested_time && (
                        <p className="mt-1 text-sm text-red-600">{errors.requested_time.message}</p>
                      )}
                    </div>

                    {/* Participants Count */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Numero Partecipanti *
                      </label>
                      <div className="relative">
                        <UserGroupIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="number"
                          min="1"
                          max={service.max_participants || 100}
                          {...register('participants_count', { valueAsNumber: true })}
                          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      {service.max_participants && (
                        <p className="mt-1 text-sm text-gray-500">
                          Massimo {service.max_participants} partecipanti
                        </p>
                      )}
                      {errors.participants_count && (
                        <p className="mt-1 text-sm text-red-600">{errors.participants_count.message}</p>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Note Aggiuntive
                    </label>
                    <textarea
                      {...register('client_notes')}
                      rows={4}
                      placeholder="Descrivi eventuali esigenze specifiche o informazioni utili per il fornitore..."
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Special Requirements */}
                  {service.requirements.length > 0 && (
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Requisiti Speciali
                      </label>
                      <div className="space-y-3">
                        {service.requirements.map((requirement, index) => (
                          <div key={index} className="flex items-start">
                            <input
                              type="checkbox"
                              value={requirement.name}
                              {...register('special_requirements')}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                            />
                            <div className="ml-3">
                              <label className="text-sm text-gray-700">
                                {requirement.name}
                                {requirement.mandatory && (
                                  <span className="text-red-500 ml-1">*</span>
                                )}
                              </label>
                              {requirement.description && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {requirement.description}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                      Continua
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Participants */}
              {step === 2 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">
                    Informazioni Partecipanti ({participantsCount})
                  </h2>
                  
                  <div className="space-y-6">
                    {Array.from({ length: participantsCount }, (_, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <h3 className="font-medium text-gray-900 mb-4">
                          Partecipante {index + 1}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Nome *
                            </label>
                            <input
                              type="text"
                              {...register(`participants.${index}.first_name`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Cognome *
                            </label>
                            <input
                              type="text"
                              {...register(`participants.${index}.last_name`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              {...register(`participants.${index}.email`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Telefono
                            </label>
                            <input
                              type="tel"
                              {...register(`participants.${index}.phone`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Ruolo
                            </label>
                            <input
                              type="text"
                              {...register(`participants.${index}.role`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Dipartimento
                            </label>
                            <input
                              type="text"
                              {...register(`participants.${index}.department`)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                        
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Esigenze Speciali
                          </label>
                          <textarea
                            {...register(`participants.${index}.special_needs`)}
                            rows={2}
                            placeholder="Eventuali esigenze particolari (allergie, disabilità, etc.)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between mt-8">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                      Indietro
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                      Continua
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Confirmation */}
              {step === 3 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Conferma Prenotazione</h2>
                  
                  {/* Service Summary */}
                  <div className="border border-gray-200 rounded-lg p-4 mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Riepilogo Servizio</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Servizio:</span>
                        <span className="text-gray-900">{service.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fornitore:</span>
                        <span className="text-gray-900">{service.provider.provider_profile?.business_name || 'Fornitore'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Data:</span>
                        <span className="text-gray-900">
                          {watchedValues.requested_date && new Date(watchedValues.requested_date).toLocaleDateString('it-IT')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Orario:</span>
                        <span className="text-gray-900">{watchedValues.requested_time}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Partecipanti:</span>
                        <span className="text-gray-900">{participantsCount}</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                    <div className="flex">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
                      <div className="text-sm">
                        <h4 className="font-medium text-yellow-800 mb-2">Termini e Condizioni</h4>
                        <ul className="text-yellow-700 space-y-1">
                          <li>• La prenotazione è soggetta alla conferma del fornitore</li>
                          <li>• Le cancellazioni devono essere effettuate almeno 24h prima</li>
                          <li>• Il pagamento sarà richiesto alla conferma del servizio</li>
                          <li>• Tutti i dati personali saranno trattati secondo la privacy policy</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold px-6 py-3 rounded-lg transition-colors"
                    >
                      Indietro
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-semibold px-8 py-3 rounded-lg transition-colors flex items-center"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Invio in corso...
                        </>
                      ) : (
                        <>
                          <CheckCircleIcon className="h-5 w-5 mr-2" />
                          {service.service_type === 'instant' ? 'Conferma Prenotazione' : 'Invia Richiesta'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-8">
                {/* Price Summary */}
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo Costi</h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Prezzo base:</span>
                      <span className="text-gray-900">
                        €{service.pricing.base_price} {getPricingUnitLabel(service.pricing.pricing_unit)}
                      </span>
                    </div>
                    
                    {service.pricing.pricing_unit === 'per_participant' && participantsCount > 1 && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">× {participantsCount} partecipanti:</span>
                        <span className="text-gray-900">€{service.pricing.base_price * participantsCount}</span>
                      </div>
                    )}
                    
                    {service.pricing.additional_costs.map((cost, index) => (
                      <div key={index} className="flex justify-between">
                        <span className="text-gray-600">{cost.name}:</span>
                        <span className="text-gray-900">
                          {cost.type === 'percentage' ? `${cost.amount}%` : `€${cost.amount}`}
                        </span>
                      </div>
                    ))}
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">IVA (22%):</span>
                        <span className="text-gray-900">€{(calculatedTotal * 0.22 / 1.22).toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <div className="border-t border-gray-200 pt-3">
                      <div className="flex justify-between text-lg font-semibold">
                        <span className="text-gray-900">Totale:</span>
                        <span className="text-gray-900">€{calculatedTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <div className="flex items-center text-sm text-blue-700">
                      <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                      {service.service_type === 'instant' 
                        ? 'Pagamento richiesto alla conferma' 
                        : 'Prezzo indicativo, soggetto a conferma'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </Layout>
  );
}