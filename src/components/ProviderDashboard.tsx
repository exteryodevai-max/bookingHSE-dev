// Dashboard Analytics per Provider - BookingHSE
import React, { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, TrendingDown, Users, Calendar, Star, DollarSign,
  Eye, Clock, Target, BarChart3,
  Activity, Download, RefreshCw
} from 'lucide-react';
import { getReviewManager } from '../lib/reviews';

interface ProviderDashboardProps {
  providerId: string;
  timeRange?: '7d' | '30d' | '90d' | '1y';
}

interface DashboardMetrics {
  // Metriche principali
  totalBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  responseRate: number;
  completionRate: number;
  
  // Trend (variazione percentuale)
  bookingsTrend: number;
  revenueTrend: number;
  ratingTrend: number;
  
  // Metriche dettagliate
  activeServices: number;
  totalViews: number;
  conversionRate: number;
  averageBookingValue: number;
  repeatCustomers: number;
  
  // Dati per grafici
  revenueChart: Array<{ date: string; revenue: number; bookings: number }>;
  servicePerformance: Array<{ service: string; bookings: number; revenue: number; rating: number }>;
  customerSegments: Array<{ segment: string; count: number; value: number }>;
  geographicData: Array<{ location: string; bookings: number; revenue: number }>;
  
  // Analisi temporale
  hourlyDistribution: Array<{ hour: number; bookings: number }>;
  weeklyDistribution: Array<{ day: string; bookings: number }>;
  monthlyTrends: Array<{ month: string; bookings: number; revenue: number }>;
}

interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  unit: string;
  deadline: string;
  category: 'revenue' | 'bookings' | 'rating' | 'growth';
}

const ProviderDashboard: React.FC<ProviderDashboardProps> = ({
  providerId,
  timeRange = '30d'
}) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);

  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState(timeRange);
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'services' | 'customers' | 'goals'>('overview');

  const reviewManager = getReviewManager();


  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      // Carica analytics recensioni
      const reviewData = await reviewManager.getReviewAnalytics(providerId);
      setReviewAnalytics(reviewData);

      // Simula caricamento metriche (in produzione verrebbero da API)
      const mockMetrics = await generateMockMetrics();
      setMetrics(mockMetrics);

      // Carica obiettivi
      const mockGoals = generateMockGoals();
      setGoals(mockGoals);
    } catch (error) {
      console.error('Errore caricamento dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [providerId, reviewManager, generateMockMetrics]);

  const generateMockMetrics = useCallback(async (): Promise<DashboardMetrics> => {
    // Simula dati realistici per la dashboard
    const baseBookings = Math.floor(Math.random() * 100) + 50;
    const baseRevenue = baseBookings * (Math.random() * 200 + 100);
    
    return {
      totalBookings: baseBookings,
      totalRevenue: Math.round(baseRevenue),
      averageRating: 4.2 + Math.random() * 0.7,
      totalReviews: Math.floor(baseBookings * 0.7),
      responseRate: 85 + Math.random() * 10,
      completionRate: 92 + Math.random() * 6,
      
      bookingsTrend: (Math.random() - 0.5) * 30,
      revenueTrend: (Math.random() - 0.5) * 25,
      ratingTrend: (Math.random() - 0.5) * 10,
      
      activeServices: Math.floor(Math.random() * 10) + 5,
      totalViews: baseBookings * (Math.floor(Math.random() * 10) + 15),
      conversionRate: 8 + Math.random() * 7,
      averageBookingValue: Math.round(baseRevenue / baseBookings),
      repeatCustomers: Math.floor(baseBookings * (0.2 + Math.random() * 0.3)),
      
      revenueChart: generateTimeSeriesData(30),
      servicePerformance: generateServiceData(),
      customerSegments: generateCustomerSegments(),
      geographicData: generateGeographicData(),
      
      hourlyDistribution: generateHourlyData(),
      weeklyDistribution: generateWeeklyData(),
      monthlyTrends: generateMonthlyData()
    };
  }, []);

  const generateTimeSeriesData = (days: number) => {
    const data = [];
    const today = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        revenue: Math.floor(Math.random() * 1000) + 200,
        bookings: Math.floor(Math.random() * 10) + 2
      });
    }
    
    return data;
  };

  const generateServiceData = () => [
    { service: 'Consulenza Sicurezza', bookings: 45, revenue: 9000, rating: 4.8 },
    { service: 'Formazione HACCP', bookings: 32, revenue: 4800, rating: 4.6 },
    { service: 'Audit Ambientale', bookings: 28, revenue: 8400, rating: 4.7 },
    { service: 'Certificazione ISO', bookings: 15, revenue: 7500, rating: 4.9 },
    { service: 'Valutazione Rischi', bookings: 38, revenue: 5700, rating: 4.5 }
  ];

  const generateCustomerSegments = () => [
    { segment: 'PMI Manifatturiere', count: 45, value: 15000 },
    { segment: 'Ristoranti/Bar', count: 32, value: 8500 },
    { segment: 'Aziende Edili', count: 28, value: 12000 },
    { segment: 'Studi Professionali', count: 15, value: 4500 },
    { segment: 'Altri', count: 22, value: 6000 }
  ];

  const generateGeographicData = () => [
    { location: 'Milano', bookings: 35, revenue: 12000 },
    { location: 'Roma', bookings: 28, revenue: 9500 },
    { location: 'Torino', bookings: 22, revenue: 7800 },
    { location: 'Napoli', bookings: 18, revenue: 6200 },
    { location: 'Bologna', bookings: 15, revenue: 5500 }
  ];

  const generateHourlyData = () => {
    const hours = [];
    for (let i = 0; i < 24; i++) {
      hours.push({
        hour: i,
        bookings: i >= 8 && i <= 18 ? Math.floor(Math.random() * 8) + 2 : Math.floor(Math.random() * 3)
      });
    }
    return hours;
  };

  const generateWeeklyData = () => [
    { day: 'Lun', bookings: 15 },
    { day: 'Mar', bookings: 18 },
    { day: 'Mer', bookings: 22 },
    { day: 'Gio', bookings: 20 },
    { day: 'Ven', bookings: 16 },
    { day: 'Sab', bookings: 8 },
    { day: 'Dom', bookings: 5 }
  ];

  const generateMonthlyData = () => {
    const months = ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu'];
    return months.map(month => ({
      month,
      bookings: Math.floor(Math.random() * 50) + 30,
      revenue: Math.floor(Math.random() * 15000) + 8000
    }));
  };

  const generateMockGoals = (): Goal[] => [
    {
      id: '1',
      title: 'Fatturato Mensile',
      target: 25000,
      current: 18500,
      unit: '€',
      deadline: '2024-02-29',
      category: 'revenue'
    },
    {
      id: '2',
      title: 'Nuovi Clienti',
      target: 50,
      current: 32,
      unit: 'clienti',
      deadline: '2024-02-29',
      category: 'growth'
    },
    {
      id: '3',
      title: 'Rating Medio',
      target: 4.8,
      current: 4.6,
      unit: '⭐',
      deadline: '2024-03-31',
      category: 'rating'
    },
    {
      id: '4',
      title: 'Prenotazioni Mensili',
      target: 100,
      current: 78,
      unit: 'prenotazioni',
      deadline: '2024-02-29',
      category: 'bookings'
    }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('it-IT', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const getTrendIcon = (trend: number) => {
    return trend >= 0 ? 
      <TrendingUp className="w-4 h-4 text-green-500" /> : 
      <TrendingDown className="w-4 h-4 text-red-500" />;
  };

  const getTrendColor = (trend: number) => {
    return trend >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const renderMetricCard = (title: string, value: string, trend?: number, icon?: React.ReactNode) => (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {trend !== undefined && (
            <div className={`flex items-center mt-1 ${getTrendColor(trend)}`}>
              {getTrendIcon(trend)}
              <span className="text-sm ml-1">{formatPercentage(trend)}</span>
            </div>
          )}
        </div>
        {icon && (
          <div className="p-3 bg-blue-100 rounded-full">
            {icon}
          </div>
        )}
      </div>
    </div>
  );

  const renderOverviewTab = () => {
    if (!metrics) return null;

    return (
      <div className="space-y-6">
        {/* Metriche principali */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {renderMetricCard(
            'Prenotazioni Totali',
            metrics.totalBookings.toString(),
            metrics.bookingsTrend,
            <Calendar className="w-6 h-6 text-blue-600" />
          )}
          {renderMetricCard(
            'Fatturato Totale',
            formatCurrency(metrics.totalRevenue),
            metrics.revenueTrend,
            <DollarSign className="w-6 h-6 text-green-600" />
          )}
          {renderMetricCard(
            'Rating Medio',
            metrics.averageRating.toFixed(1),
            metrics.ratingTrend,
            <Star className="w-6 h-6 text-yellow-600" />
          )}
          {renderMetricCard(
            'Tasso Completamento',
            `${metrics.completionRate.toFixed(1)}%`,
            undefined,
            <Target className="w-6 h-6 text-purple-600" />
          )}
        </div>

        {/* Metriche secondarie */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {renderMetricCard('Servizi Attivi', metrics.activeServices.toString(), undefined, <Activity className="w-5 h-5 text-blue-500" />)}
          {renderMetricCard('Visualizzazioni', metrics.totalViews.toString(), undefined, <Eye className="w-5 h-5 text-gray-500" />)}
          {renderMetricCard('Tasso Conversione', `${metrics.conversionRate.toFixed(1)}%`, undefined, <TrendingUp className="w-5 h-5 text-green-500" />)}
          {renderMetricCard('Valore Medio', formatCurrency(metrics.averageBookingValue), undefined, <DollarSign className="w-5 h-5 text-green-500" />)}
          {renderMetricCard('Clienti Ricorrenti', metrics.repeatCustomers.toString(), undefined, <Users className="w-5 h-5 text-purple-500" />)}
        </div>

        {/* Grafici */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafico fatturato */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              Trend Fatturato (30 giorni)
            </h3>
            <div className="h-64 flex items-end justify-between space-x-1">
              {metrics.revenueChart.slice(-14).map((item, index) => {
                const maxRevenue = Math.max(...metrics.revenueChart.map(d => d.revenue));
                const height = (item.revenue / maxRevenue) * 100;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-blue-500 rounded-t w-full min-h-[4px] transition-all hover:bg-blue-600"
                      style={{ height: `${height}%` }}
                      title={`${item.date}: ${formatCurrency(item.revenue)}`}
                    />
                    <span className="text-xs text-gray-500 mt-1 transform rotate-45 origin-left">
                      {new Date(item.date).getDate()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Distribuzione oraria */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Distribuzione Oraria Prenotazioni
            </h3>
            <div className="h-64 flex items-end justify-between space-x-1">
              {metrics.hourlyDistribution.filter((_, i) => i % 2 === 0).map((item, index) => {
                const maxBookings = Math.max(...metrics.hourlyDistribution.map(d => d.bookings));
                const height = maxBookings > 0 ? (item.bookings / maxBookings) * 100 : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center flex-1">
                    <div
                      className="bg-purple-500 rounded-t w-full min-h-[4px] transition-all hover:bg-purple-600"
                      style={{ height: `${height}%` }}
                      title={`${item.hour}:00 - ${item.bookings} prenotazioni`}
                    />
                    <span className="text-xs text-gray-500 mt-1">
                      {item.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRevenueTab = () => {
    if (!metrics) return null;

    return (
      <div className="space-y-6">
        {/* Metriche fatturato */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {renderMetricCard('Fatturato Totale', formatCurrency(metrics.totalRevenue), metrics.revenueTrend)}
          {renderMetricCard('Valore Medio Prenotazione', formatCurrency(metrics.averageBookingValue))}
          {renderMetricCard('Fatturato/Giorno', formatCurrency(Math.round(metrics.totalRevenue / 30)))}
          {renderMetricCard('Proiezione Mensile', formatCurrency(Math.round(metrics.totalRevenue * 1.15)))}
        </div>

        {/* Performance servizi */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Performance per Servizio</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Servizio</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Prenotazioni</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Fatturato</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Valore Medio</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Rating</th>
                </tr>
              </thead>
              <tbody>
                {metrics.servicePerformance.map((service, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{service.service}</td>
                    <td className="py-3 px-4 text-right">{service.bookings}</td>
                    <td className="py-3 px-4 text-right font-medium text-green-600">
                      {formatCurrency(service.revenue)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {formatCurrency(Math.round(service.revenue / service.bookings))}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end">
                        <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                        {service.rating.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trend mensili */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold mb-4">Trend Mensili</h3>
          <div className="h-64 flex items-end justify-between space-x-4">
            {metrics.monthlyTrends.map((month, index) => {
              const maxRevenue = Math.max(...metrics.monthlyTrends.map(m => m.revenue));
              const height = (month.revenue / maxRevenue) * 100;
              
              return (
                <div key={index} className="flex flex-col items-center flex-1">
                  <div className="text-xs text-gray-600 mb-2">
                    {formatCurrency(month.revenue)}
                  </div>
                  <div
                    className="bg-gradient-to-t from-green-500 to-green-400 rounded-t w-full min-h-[8px]"
                    style={{ height: `${height}%` }}
                  />
                  <span className="text-sm font-medium text-gray-700 mt-2">
                    {month.month}
                  </span>
                  <span className="text-xs text-gray-500">
                    {month.bookings} prenotazioni
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderGoalsTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Obiettivi</h2>
        <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Nuovo Obiettivo
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {goals.map((goal) => {
          const progress = (goal.current / goal.target) * 100;
          const isCompleted = progress >= 100;
          const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          
          return (
            <div key={goal.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900">{goal.title}</h3>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  isCompleted ? 'bg-green-100 text-green-800' :
                  daysLeft < 7 ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {isCompleted ? 'Completato' : `${daysLeft} giorni`}
                </span>
              </div>
              
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{goal.current} {goal.unit}</span>
                  <span>{goal.target} {goal.unit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      isCompleted ? 'bg-green-500' :
                      progress > 75 ? 'bg-blue-500' :
                      progress > 50 ? 'bg-yellow-500' :
                      'bg-red-500'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
                <div className="text-right text-sm text-gray-600 mt-1">
                  {progress.toFixed(1)}%
                </div>
              </div>
              
              <div className="text-sm text-gray-500">
                Scadenza: {new Date(goal.deadline).toLocaleDateString('it-IT')}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Analytics</h1>
          <p className="text-gray-600 mt-1">Monitora le performance del tuo business</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <select
            value={selectedTimeRange}
            onChange={(e) => setSelectedTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Ultimi 7 giorni</option>
            <option value="30d">Ultimi 30 giorni</option>
            <option value="90d">Ultimi 90 giorni</option>
            <option value="1y">Ultimo anno</option>
          </select>
          
          <button
            onClick={loadDashboardData}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Aggiorna</span>
          </button>
          
          <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="w-4 h-4" />
            <span>Esporta</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {[
            { id: 'overview', label: 'Panoramica', icon: BarChart3 },
            { id: 'revenue', label: 'Fatturato', icon: DollarSign },
            { id: 'services', label: 'Servizi', icon: Activity },
            { id: 'customers', label: 'Clienti', icon: Users },
            { id: 'goals', label: 'Obiettivi', icon: Target }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="min-h-[600px]">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'revenue' && renderRevenueTab()}
        {activeTab === 'goals' && renderGoalsTab()}
        {activeTab === 'services' && (
          <div className="text-center py-12 text-gray-500">
            Sezione Servizi in sviluppo
          </div>
        )}
        {activeTab === 'customers' && (
          <div className="text-center py-12 text-gray-500">
            Sezione Clienti in sviluppo
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDashboard;
export type { ProviderDashboardProps, DashboardMetrics, Goal };