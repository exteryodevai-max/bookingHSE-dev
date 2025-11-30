import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDaysIcon,
  DocumentTextIcon,
  CurrencyEuroIcon,
  UserGroupIcon,
  ChartBarIcon,
  BellIcon,
  PlusIcon,
  EyeIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  ArchiveBoxIcon,
  DocumentArrowUpIcon,
  UsersIcon
} from '@heroicons/react/24/outline';
import Layout from '../components/Layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/supabase';
import { BookingWithDetails, Notification, BookingAnalytics } from '../types';
import { isClientProfile, isProviderProfile } from '../types';
import type { ClientProfile, ProviderProfile, AdminProfile } from '../types';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [analytics, setAnalytics] = useState<BookingAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  // Only load dashboard data when user is authenticated and available
  useEffect(() => {
    const loadDashboardData = async () => {
      // Don't load data if auth is still loading or user is not authenticated
      if (authLoading || !user) {
        return;
      }

      try {
        setLoading(true);
        console.log('📊 Loading dashboard data for user:', user.id);
        
        const [bookingsData, notificationsData, analyticsData] = await Promise.all([
          db.getBookings(user.id, user.user_type as 'client' | 'provider'),
          db.getUserNotifications(user.id),
          db.getBookingAnalytics(user.user_type === 'provider' ? user.id : undefined)
        ]);

        setBookings(bookingsData);
        setNotifications(notificationsData);
        setAnalytics(analyticsData);
        console.log('✅ Dashboard data loaded successfully');
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast.error('Errore nel caricamento dei dati');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [user, authLoading]); // Depend on both user and authLoading

  const statusConfig = useMemo(() => ({
    colors: {
      draft: 'bg-gray-100 text-gray-800',
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      in_progress: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      no_show: 'bg-gray-100 text-gray-800',
    },
    labels: {
      draft: 'Bozza',
      pending: 'In Attesa',
      confirmed: 'Confermata',
      in_progress: 'In Corso',
      completed: 'Completata',
      cancelled: 'Cancellata',
      no_show: 'Non Presentato',
    }
  }), []);

  const getStatusColor = (status: string) => {
    return statusConfig.colors[status as keyof typeof statusConfig.colors] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status: string) => {
    return statusConfig.labels[status as keyof typeof statusConfig.labels] || status;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircleIcon className="h-4 w-4" />;
      case 'pending':
        return <ClockIcon className="h-4 w-4" />;
      case 'cancelled':
        return <XCircleIcon className="h-4 w-4" />;
      default:
        return <DocumentTextIcon className="h-4 w-4" />;
    }
  };

  // Show loading while auth is loading or while data is loading
  if (authLoading || loading) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if user exists and has profile (only after auth loading is complete)
  if (!user || !user.profile) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Profilo non completato
            </h2>
            <p className="text-gray-600 mb-6">
              Completa il tuo profilo per accedere alla dashboard.
            </p>
            <Link
              to="/profile"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              Completa Profilo
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const recentBookings = bookings.slice(0, 5);
  const unreadNotifications = notifications.filter(n => !n.read).slice(0, 5);

  const getCompanyName = () => {
    const profile = user?.profile as ClientProfile | ProviderProfile | AdminProfile | undefined;
    if (user?.user_type === 'client' && profile && isClientProfile(profile)) {
      return profile.company_name || 'Azienda';
    }
    if (user?.user_type === 'provider' && profile && isProviderProfile(profile)) {
      return profile.business_name || 'Attività';
    }
    return 'Utente';
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Benvenuto, {getCompanyName()}
          </h1>
          <p className="text-gray-600 mt-2">
            {user.user_type === 'client' 
              ? 'Gestisci le tue prenotazioni e trova nuovi servizi HSE'
              : 'Monitora le tue prenotazioni e gestisci i tuoi servizi'
            }
          </p>
        </div>

        {/* Stats Cards */}
        {analytics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarDaysIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Prenotazioni Totali</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.total_bookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircleIcon className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Confermate</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.confirmed_bookings}</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <ChartBarIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Tasso Completamento</p>
                  <p className="text-2xl font-bold text-gray-900">{analytics.completion_rate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <CurrencyEuroIcon className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valore Medio</p>
                  <p className="text-2xl font-bold text-gray-900">€{analytics.average_booking_value.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Bookings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200">
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Prenotazioni Recenti</h2>
                  <div className="flex gap-2">
                    {user.user_type === 'client' && (
                      <Link
                        to="/search"
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center"
                      >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        Nuova Prenotazione
                      </Link>
                    )}
                    <Link
                      to="/bookings"
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Vedi Tutte
                    </Link>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-200">
                {recentBookings.length > 0 ? (
                  recentBookings.map((booking) => (
                    <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-medium text-gray-900">{booking.service_title}</h3>
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                              {getStatusIcon(booking.status)}
                              <span className="ml-1">{getStatusLabel(booking.status)}</span>
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <CalendarDaysIcon className="h-4 w-4 mr-1" />
                              {booking.requested_date && new Date(booking.requested_date).toLocaleDateString('it-IT')}
                            </div>
                            <div className="flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              {booking.requested_time}
                            </div>
                            <div className="flex items-center">
                              <UserGroupIcon className="h-4 w-4 mr-1" />
                              {booking.participants_count} partecipanti
                            </div>
                          </div>
                          
                          <div className="mt-2 text-sm text-gray-600">
                            {user.user_type === 'client'
                              ? (() => {
                                  const prof = booking.provider?.profile as ClientProfile | ProviderProfile | AdminProfile | undefined;
                                  return `Fornitore: ${prof && isProviderProfile(prof) ? prof.business_name : 'N/A'}`;
                                })()
                              : (() => {
                                  const prof = booking.client?.profile as ClientProfile | ProviderProfile | AdminProfile | undefined;
                                  return `Cliente: ${prof && isClientProfile(prof) ? prof.company_name : 'N/A'}`;
                                })()
                            }
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <div className="font-semibold text-gray-900">€{booking.total_amount}</div>
                            <div className="text-sm text-gray-500">{booking.booking_number}</div>
                          </div>
                          <Link
                            to={`/bookings/${booking.id}`}
                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          >
                            <EyeIcon className="h-5 w-5" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-12 text-center">
                    <CalendarDaysIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Nessuna prenotazione</h3>
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
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Azioni Rapide</h3>
              <div className="space-y-3">
                {user.user_type === 'client' ? (
                  <>
                    <Link
                      to="/search"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="font-medium text-gray-900">Cerca Servizi</span>
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <CalendarDaysIcon className="h-5 w-5 text-green-600 mr-3" />
                      <span className="font-medium text-gray-900">Le Mie Prenotazioni</span>
                    </Link>
                    <Link
                      to="/profile"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <UserGroupIcon className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="font-medium text-gray-900">Gestisci Profilo</span>
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/services/create"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <PlusIcon className="h-5 w-5 text-blue-600 mr-3" />
                      <span className="font-medium text-gray-900">Aggiungi Servizio</span>
                    </Link>
                    <Link
                      to="/bookings"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <CalendarDaysIcon className="h-5 w-5 text-green-600 mr-3" />
                      <span className="font-medium text-gray-900">Gestisci Prenotazioni</span>
                    </Link>
                    <Link
                      to="/my-services"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <DocumentTextIcon className="h-5 w-5 text-orange-600 mr-3" />
                      <span className="font-medium text-gray-900">I Miei Servizi</span>
                    </Link>
                    <Link
                      to="/my-services?archived=true"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ArchiveBoxIcon className="h-5 w-5 text-gray-600 mr-3" />
                      <span className="font-medium text-gray-900">Servizi Archiviati</span>
                    </Link>
                    <Link
                      to="/analytics"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <ChartBarIcon className="h-5 w-5 text-purple-600 mr-3" />
                      <span className="font-medium text-gray-900">Analytics</span>
                    </Link>
                    <Link
                      to="/services/bulk-import"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <DocumentArrowUpIcon className="h-5 w-5 text-indigo-600 mr-3" />
                      <span className="font-medium text-gray-900">Caricamento Servizi</span>
                    </Link>
                    <Link
                      to="/provider/users"
                      className="flex items-center w-full text-left p-3 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <UsersIcon className="h-5 w-5 text-teal-600 mr-3" />
                      <span className="font-medium text-gray-900">Gestione Utenti</span>
                    </Link>
                  </>
                )}
              </div>
            </div>

            {/* Notifications */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Notifiche</h3>
                {unreadNotifications.length > 0 && (
                  <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {unreadNotifications.length} nuove
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {unreadNotifications.length > 0 ? (
                  unreadNotifications.map((notification) => (
                    <div key={notification.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start">
                        <BellIcon className="h-5 w-5 text-blue-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <h4 className="font-medium text-blue-900 text-sm">{notification.title}</h4>
                          <p className="text-blue-700 text-sm mt-1">{notification.message}</p>
                          <p className="text-blue-600 text-xs mt-2">
                            {new Date(notification.created_at).toLocaleDateString('it-IT')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <BellIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Nessuna notifica</p>
                  </div>
                )}
              </div>

              {notifications.length > 5 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <Link
                    to="/notifications"
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Vedi tutte le notifiche
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}