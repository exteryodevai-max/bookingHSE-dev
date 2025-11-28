import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  MapPinIcon,
  CurrencyEuroIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../lib/supabase';
import { BookingWithDetails, isClientProfile, isProviderProfile } from '../../types';
import type { ClientProfile, ProviderProfile, AdminProfile } from '../../types';
import toast from 'react-hot-toast';

export default function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  const loadBooking = useCallback(async () => {
    try {
      setLoading(true);
      const bookingData = await db.getBookingById(id!);
      setBooking(bookingData);
    } catch (error) {
      console.error('Error loading booking:', error);
      toast.error('Errore nel caricamento della prenotazione');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadBooking();
    }
  }, [id, loadBooking]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: 'Bozza',
      pending: 'In Attesa',
      confirmed: 'Confermata',
      in_progress: 'In Corso',
      completed: 'Completata',
      cancelled: 'Cancellata',
      no_show: 'Non Presentato',
    };
    return labels[status] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-5 w-5" />;
      case 'pending':
        return <ClockIcon className="h-5 w-5" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5" />;
      case 'in_progress':
        return <ExclamationTriangleIcon className="h-5 w-5" />;
      default:
        return <CalendarDaysIcon className="h-5 w-5" />;
    }
  };

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

  if (!booking) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Prenotazione non trovata</h1>
          <p className="text-gray-600 mb-8">La prenotazione che stai cercando non esiste o non hai i permessi per visualizzarla.</p>
          <Link
            to="/bookings"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
          >
            Torna alle Prenotazioni
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <nav className="flex mb-4" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <Link to="/bookings" className="text-gray-500 hover:text-gray-700">Prenotazioni</Link>
              </li>
              <li>
                <span className="text-gray-400">/</span>
              </li>
              <li>
                <span className="text-gray-900 font-medium">#{booking.booking_number}</span>
              </li>
            </ol>
          </nav>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{booking.service_title}</h1>
              <p className="text-gray-600 mt-1">Prenotazione #{booking.booking_number}</p>
            </div>
            
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
              {getStatusIcon(booking.status)}
              <span className="ml-2">{getStatusLabel(booking.status)}</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Service Details */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Dettagli Servizio</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Data</div>
                    <div className="font-medium">
                      {booking.requested_date && new Date(booking.requested_date).toLocaleDateString('it-IT')}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <ClockIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Orario</div>
                    <div className="font-medium">{booking.requested_time}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <UserGroupIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Partecipanti</div>
                    <div className="font-medium">{booking.participants_count}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm text-gray-500">Modalità</div>
                    <div className="font-medium">
                      {booking.location?.type === 'client_site' ? 'Presso cliente' : 'Presso fornitore'}
                    </div>
                  </div>
                </div>
              </div>

              {booking.client_notes && (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Note del Cliente</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">{booking.client_notes}</p>
                </div>
              )}
            </div>

            {/* Participants */}
            {booking.participants && booking.participants.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Partecipanti</h2>
                
                <div className="space-y-4">
                  {booking.participants.map((participant, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {participant.first_name} {participant.last_name}
                          </div>
                          {participant.role && (
                            <div className="text-sm text-gray-500">{participant.role}</div>
                          )}
                        </div>
                        
                        <div className="text-sm text-gray-600">
                          {participant.email && <div>Email: {participant.email}</div>}
                          {participant.phone && <div>Tel: {participant.phone}</div>}
                          {participant.department && <div>Dipartimento: {participant.department}</div>}
                        </div>
                      </div>
                      
                      {participant.special_needs && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded text-sm">
                          <strong>Esigenze speciali:</strong> {participant.special_needs}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documents */}
            {booking.documents && booking.documents.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Documenti</h2>
                
                <div className="space-y-3">
                  {booking.documents.map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-3" />
                        <div>
                          <div className="font-medium text-gray-900">{document.name}</div>
                          <div className="text-sm text-gray-500">
                            {(document.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      
                      <a
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      >
                        Scarica
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Contact Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {user?.user_type === 'client' ? 'Fornitore' : 'Cliente'}
              </h3>
              
              <div className="space-y-3">
                <div>
                  <div className="font-medium text-gray-900">
                    {user?.user_type === 'client'
                      ? (() => {
                          const prof = booking.provider?.profile as ClientProfile | ProviderProfile | AdminProfile | undefined;
                          return prof && isProviderProfile(prof) ? prof.business_name : 'N/A';
                        })()
                      : (() => {
                          const prof = booking.client?.profile as ClientProfile | ProviderProfile | AdminProfile | undefined;
                          return prof && isClientProfile(prof) ? prof.company_name : 'N/A';
                        })()
                    }
                  </div>
                </div>
                
                <div className="text-sm text-gray-600">
                  <div>Email: {user?.user_type === 'client' 
                    ? booking.provider?.email || 'N/A'
                    : booking.client?.email || 'N/A'
                  }</div>
                  <div>Tel: {user?.user_type === 'client'
                    ? (() => {
                        const prof = booking.provider?.profile as ClientProfile | ProviderProfile | AdminProfile | undefined;
                        return prof && isProviderProfile(prof) ? prof.phone ?? 'N/A' : 'N/A';
                      })()
                    : (() => {
                        const prof = booking.client?.profile as ClientProfile | ProviderProfile | AdminProfile | undefined;
                        return prof && isClientProfile(prof) ? prof.phone ?? 'N/A' : 'N/A';
                      })()
                  }</div>
                </div>
              </div>
            </div>

            {/* Price Summary */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Riepilogo Costi</h3>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Prezzo base:</span>
                  <span className="text-gray-900">€{booking.base_amount}</span>
                </div>
                
                {booking.additional_costs && booking.additional_costs.map((cost, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-gray-600">{cost.name}:</span>
                    <span className="text-gray-900">€{cost.amount}</span>
                  </div>
                ))}
                
                {booking.discount_amount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Sconto:</span>
                    <span>-€{booking.discount_amount}</span>
                  </div>
                )}
                
                <div className="flex justify-between">
                  <span className="text-gray-600">IVA:</span>
                  <span className="text-gray-900">€{booking.tax_amount}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-900">Totale:</span>
                    <span className="text-gray-900">€{booking.total_amount}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center text-sm text-blue-700">
                  <CurrencyEuroIcon className="h-4 w-4 mr-2" />
                  Stato pagamento: {booking.payment_status === 'pending' ? 'In attesa' : 'Completato'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni</h3>
              
              <div className="space-y-3">
                {booking.status === 'pending' && user?.user_type === 'provider' && (
                  <>
                    <button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                      Conferma Prenotazione
                    </button>
                    <button className="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                      Rifiuta Prenotazione
                    </button>
                  </>
                )}
                
                {booking.status === 'confirmed' && (
                  <button className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-medium py-2 px-4 rounded-lg transition-colors">
                    Cancella Prenotazione
                  </button>
                )}
                
                <button className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors">
                  Contatta {user?.user_type === 'client' ? 'Fornitore' : 'Cliente'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}