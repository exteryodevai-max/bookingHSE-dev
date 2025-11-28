import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserGroupIcon,
  EyeIcon,
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

export default function BookingsPage() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  const loadBookings = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const bookingsData = await db.getBookings(user.id, user.user_type as 'client' | 'provider');
      setBookings(bookingsData);
    } catch (error) {
      console.error('Error loading bookings:', error);
      toast.error('Errore nel caricamento delle prenotazioni');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadBookings();
    }
  }, [user, loadBookings]);

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
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      case 'in_progress':
        return <ExclamationTriangleIcon className="h-4 w-4" />;
      default:
        return <CalendarDaysIcon className="h-4 w-4" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (filter === 'all') return true;
    return booking.status === filter;
  });

  const statusCounts = bookings.reduce((acc, booking) => {
    acc[booking.status] = (acc[booking.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!user) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Accesso Richiesto</h1>
          <p className="text-gray-600">Devi effettuare l'accesso per visualizzare le prenotazioni.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {user.user_type === 'client' ? 'Le Mie Prenotazioni' : 'Prenotazioni Ricevute'}
          </h1>
          <p className="text-gray-600">
            {user.user_type === 'client' 
              ? 'Gestisci tutte le tue prenotazioni di servizi HSE'
              : 'Gestisci le prenotazioni ricevute per i tuoi servizi'
            }
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { key: 'all', label: 'Tutte', count: bookings.length },
                { key: 'pending', label: 'In Attesa', count: statusCounts.pending || 0 },
                { key: 'confirmed', label: 'Confermate', count: statusCounts.confirmed || 0 },
                { key: 'completed', label: 'Completate', count: statusCounts.completed || 0 },
                { key: 'cancelled', label: 'Cancellate', count: statusCounts.cancelled || 0 },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`py-2 px-1 border-b-2 font-medium text-sm ${
                    filter === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                <div className="flex space-x-4">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredBookings.length > 0 ? (
          <div className="space-y-4">
            {filteredBookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">{booking.service_title}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusIcon(booking.status)}
                        <span className="ml-1">{getStatusLabel(booking.status)}</span>
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <CalendarDaysIcon className="h-4 w-4 mr-2" />
                        {booking.requested_date && new Date(booking.requested_date).toLocaleDateString('it-IT')}
                      </div>
                      <div className="flex items-center">
                        <ClockIcon className="h-4 w-4 mr-2" />
                        {booking.requested_time}
                      </div>
                      <div className="flex items-center">
                        <UserGroupIcon className="h-4 w-4 mr-2" />
                        {booking.participants_count} partecipanti
                      </div>
                      <div className="font-medium text-gray-900">
                        €{booking.total_amount}
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">
                        {user.user_type === 'client' ? 'Fornitore: ' : 'Cliente: '}
                      </span>
                      {user.user_type === 'client'
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
                    
                    <div className="text-xs text-gray-500 mt-1">
                      Prenotazione #{booking.booking_number}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Link
                      to={`/bookings/${booking.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      Dettagli
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'Nessuna prenotazione' : `Nessuna prenotazione ${getStatusLabel(filter).toLowerCase()}`}
            </h3>
            <p className="text-gray-600 mb-4">
              {user.user_type === 'client' 
                ? 'Non hai ancora effettuato prenotazioni.'
                : 'Non hai ancora ricevuto prenotazioni.'
              }
            </p>
            {user.user_type === 'client' && (
              <Link
                to="/search"
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
              >
                Cerca Servizi
              </Link>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}