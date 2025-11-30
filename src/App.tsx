import React, { useEffect } from 'react';
import {
  createBrowserRouter,
  RouterProvider,
  Outlet
} from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import { SupabaseErrorBoundary } from './lib/errors/errorBoundary';

// Pages
import Home from './pages/Home';
import Search from './pages/Search';
import ServiceDetail from './pages/ServiceDetail';
import Booking from './pages/Booking';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';

// Auth Pages
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import AuthCallback from './pages/AuthCallback';
import EmailVerification from './pages/EmailVerification';
import EmailVerificationWait from './pages/Auth/EmailVerificationWait';
import EmailVerificationConfirm from './pages/Auth/EmailVerificationConfirm';
import EmailWaiting from './pages/Auth/EmailWaiting';

// Booking Pages
import BookingsPage from './pages/Bookings/BookingsPage';
import BookingDetailPage from './pages/Bookings/BookingDetailPage';

// Info Pages
import HowItWorksPage from './pages/Info/HowItWorksPage';
import ForProvidersPage from './pages/Info/ForProvidersPage';
import ContactPage from './pages/Info/ContactPage';

// Provider Pages
import ProviderDetailPage from './pages/Providers/ProviderDetailPage';

// Service Pages
import CreateServicePage from './pages/Services/CreateServicePage';
import ProviderServicesPage from './pages/Services/ProviderServicesPage';
import EditServicePage from './pages/Services/EditServicePage';
import BulkImportPage from './pages/Services/BulkImportPage';

// Provider Pages
import UserManagementPage from './pages/provider/UserManagementPage';

// Legal Pages
import TermsPage from './pages/Legal/TermsPage';
import PrivacyPage from './pages/Legal/PrivacyPage';
import CookiesPage from './pages/Legal/CookiesPage';

// Other Pages
import AnalyticsPage from './pages/AnalyticsPage';
import NotificationsPage from './pages/NotificationsPage';
import PlaceholderPage from './pages/Common/PlaceholderPage';
import NotFoundPage from './pages/NotFoundPage';
import { dbTests } from './utils/testDatabase';
import EmailCheckTest from './test/email-check-test';
import EmailDebugTest from './test/email-debug';

// Import debug utilities only in development
if (import.meta.env.DEV) {
  import('./utils/debugAuth');
}

// Layout wrapper per future flag
const RootLayout = () => {
  return (
    <>
      <Outlet />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </>
  );
};

// Crea il router con future flags corretti
const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    errorElement: <NotFoundPage />,
    children: [
      {
        index: true,
        element: <Home />
      },
      // Auth Routes
      {
        path: 'auth',
        children: [
          {
            path: 'login',
            element: <LoginPage />
          },
          {
            path: 'register',
            element: <RegisterPage />
          },
          {
            path: 'callback',
            element: <AuthCallback />
          }
        ]
      },
      {
        path: 'email-verification',
        element: <EmailVerification />
      },
      {
        path: 'email-verification-wait',
        element: <EmailVerificationWait />
      },
      {
        path: 'email-verification-confirm',
        element: <EmailVerificationConfirm />
      },
      {
        path: 'email-waiting',
        element: <EmailWaiting />
      },
      // Search and Services
      {
        path: 'search',
        element: <Search />
      },
      {
        path: 'services',
        children: [
          {
            index: true,
            element: <Search />
          },
          {
            path: 'create',
            element: <ProtectedRoute requiresUserType="provider"><CreateServicePage /></ProtectedRoute>
          },
          {
            path: 'bulk-import',
            element: <ProtectedRoute requiresUserType="provider"><BulkImportPage /></ProtectedRoute>
          },
          {
            path: ':id',
            element: <ServiceDetail />
          },
          {
            path: ':id/book',
            element: <Booking />
          },
          {
            path: ':id/edit',
            element: <ProtectedRoute requiresUserType="provider"><EditServicePage /></ProtectedRoute>
          }
        ]
      },
      {
        path: 'my-services',
        element: <ProtectedRoute requiresUserType="provider"><ProviderServicesPage /></ProtectedRoute>
      },
      // User Dashboard
      {
        path: 'dashboard',
        element: <ProtectedRoute><Dashboard /></ProtectedRoute>
      },
      {
        path: 'profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      // Specific profile routes for different user types
      {
        path: 'client/profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      {
        path: 'provider/profile',
        element: <ProtectedRoute><Profile /></ProtectedRoute>
      },
      // Provider User Management
      {
        path: 'provider/users',
        element: <ProtectedRoute requiresUserType="provider"><UserManagementPage /></ProtectedRoute>
      },
      // Bookings
      {
        path: 'bookings',
        children: [
          {
            index: true,
            element: <ProtectedRoute><BookingsPage /></ProtectedRoute>
          },
          {
            path: ':id',
            element: <ProtectedRoute><BookingDetailPage /></ProtectedRoute>
          }
        ]
      },
      // Providers
      {
        path: 'providers/:id',
        element: <ProviderDetailPage />
      },
      // Info Pages
      {
        path: 'how-it-works',
        element: <HowItWorksPage />
      },
      // Test Routes (only in development)
      ...(import.meta.env.DEV ? [
        {
          path: 'test/email-check',
          element: <EmailCheckTest />
        },
        {
          path: 'test/email-debug',
          element: <EmailDebugTest />
        }
      ] : []),
      {
        path: 'for-providers',
        element: <ForProvidersPage />
      },
      // Other Pages
      {
        path: 'analytics',
        element: <ProtectedRoute requiresUserType="provider"><AnalyticsPage /></ProtectedRoute>
      },
      {
        path: 'notifications',
        element: <ProtectedRoute><NotificationsPage /></ProtectedRoute>
      },
      // Placeholder Pages for Footer Links
      {
        path: 'about',
        element: <PlaceholderPage title="Chi Siamo" description="Scopri di più su BookingHSE e la nostra missione nel settore HSE." />
      },
      {
        path: 'contact',
        element: <ContactPage />
      },
      {
        path: 'help',
        element: <PlaceholderPage title="Centro Assistenza" description="Trova risposte alle domande più frequenti e guide utili." />
      },
      {
        path: 'faq',
        element: <PlaceholderPage title="FAQ" description="Le risposte alle domande più frequenti su BookingHSE." />
      },
      {
        path: 'terms',
        element: <TermsPage />
      },
      {
        path: 'privacy',
        element: <PrivacyPage />
      },
      {
        path: 'cookies',
        element: <CookiesPage />
      },
      {
        path: 'careers',
        element: <PlaceholderPage title="Carriere" description="Unisciti al team BookingHSE e aiutaci a rivoluzionare il settore HSE." />
      },
      {
        path: 'press',
        element: <PlaceholderPage title="Stampa" description="Risorse per la stampa e comunicati ufficiali di BookingHSE." />
      },
      {
        path: 'blog',
        element: <PlaceholderPage title="Blog" description="Articoli, guide e approfondimenti sul mondo HSE." />
      },
      {
        path: 'guides',
        element: <PlaceholderPage title="Guide HSE" description="Guide pratiche e risorse utili per la sicurezza sul lavoro." />
      },
      {
        path: 'regulations',
        element: <PlaceholderPage title="Normative" description="Aggiornamenti sulle normative HSE e compliance." />
      },
      {
        path: 'webinars',
        element: <PlaceholderPage title="Webinar" description="Webinar formativi e eventi online sul tema HSE." />
      },
      {
        path: 'api',
        element: <PlaceholderPage title="API" description="Documentazione API per sviluppatori e integrazioni." />
      },
      {
        path: 'forgot-password',
        element: <PlaceholderPage title="Password Dimenticata" description="Funzionalità di recupero password in fase di sviluppo." />
      },
      {
        path: '*',
        element: <NotFoundPage />
      }
    ]
  }
], {
  // FUTURE FLAGS - IMPORTANTE!
  future: {
    v7_relativeSplatPath: true,
    v7_fetcherPersist: true,
    v7_normalizeFormMethod: true,
    v7_partialHydration: true,
    v7_skipActionErrorRevalidation: true
  }
});

function App() {
  useEffect(() => {
    // Test database connection on app startup
    const testDb = async () => {
      try {
        console.log('🔌 Testing database connection...')
        const result = await dbTests.connection()
        if (result.success) {
          console.log('✅ Database connected successfully!')
          console.log('💡 Run dbTests.runAll() in console to test all database operations')
        } else {
          console.warn('⚠️ Database connection failed:', result.error)
          console.log('💡 The app will work with mock data. To fix this:')
          console.log('1. Check your .env file has correct Supabase credentials')
          console.log('2. Apply database schema from database/schema.sql in Supabase SQL Editor')
          console.log('3. See QUICK_FIX.md for detailed instructions')
        }
      } catch (error) {
        console.warn('⚠️ Database test failed:', error)
        console.log('💡 The app will continue with mock data')
      }
    }
    
    testDb()
  }, [])

  return (
    <SupabaseErrorBoundary>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </SupabaseErrorBoundary>
  );
}

export default App;
