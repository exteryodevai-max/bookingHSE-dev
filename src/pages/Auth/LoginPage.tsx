import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

const loginSchema = yup.object({
  email: yup.string().email('Email non valida').required('Email è richiesta'),
  password: yup.string().required('Password è richiesta'),
});

type LoginFormData = yup.InferType<typeof loginSchema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, user, loading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loginCompleted, setLoginCompleted] = useState(false);
  
  // IMPORTANTE: Previeni loop di redirect
  const from = location.state?.from?.pathname || '/dashboard';

  // Se l'utente è già loggato al caricamento della pagina, redirect
  useEffect(() => {
    console.log('🔍 LoginPage useEffect 1 - User check:', {
      user: !!user,
      userId: user?.id,
      loginCompleted,
      from
    });
    
    if (user && !loginCompleted) {
      console.log('👤 User already logged in, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [user, navigate, from, loginCompleted]);

  // Gestisci il redirect dopo login completato
  useEffect(() => {
    console.log('🔍 LoginPage useEffect 2 - Login completed check:', {
      loginCompleted,
      user: !!user,
      userId: user?.id,
      authLoading,
      from
    });
    
    if (loginCompleted && user && !authLoading) {
      console.log('✅ Login completed, user loaded, redirecting to:', from);
      navigate(from, { replace: true });
    }
  }, [loginCompleted, user, authLoading, navigate, from]);

  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<LoginFormData>({
    resolver: yupResolver(loginSchema)
  });

  const onSubmit = async (data: LoginFormData) => {
    console.log('🚀 Form submitted with data:', data);
    setLoading(true);
    setError(null);

    try {
      console.log('🔐 Attempting login for:', data.email);
      
      const result = await signIn(data.email, data.password);
      
      if (result.error) {
        console.error('❌ Login error:', result.error);
        setError(result.error.message);
        toast.error(result.error.message);
        setLoading(false);
        return;
      }

      console.log('✅ Login successful');
      toast.success('Accesso effettuato con successo!');
      setLoading(false);
      console.log('🏁 Setting loginCompleted to true');
      setLoginCompleted(true);
      
      // Il redirect sarà gestito dall'useEffect quando user sarà disponibile
      
    } catch (error: unknown) {
      console.error('❌ Unexpected error:', error);
      const errorMessage = (error as Error)?.message || 'Si è verificato un errore durante l\'accesso';
      setError(errorMessage);
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Accedi al tuo account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Non hai un account?{' '}
              <Link to="/auth/register" className="font-medium text-blue-600 hover:text-blue-500">
                Registrati qui
              </Link>
            </p>
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md" role="alert">
              {error}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)} role="form">
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  disabled={loading}
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50"
                  placeholder="Inserisci la tua email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{errors.email.message}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('password')}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    disabled={loading}
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm disabled:opacity-50"
                    placeholder="Inserisci la tua password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    aria-label={showPassword ? 'Nascondi password' : 'Mostra password'}
                    aria-pressed={showPassword}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600" role="alert" aria-live="polite">{errors.password.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                  Password dimenticata?
                </Link>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                onClick={() => console.log('🖱️ Submit button clicked!')}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                aria-describedby={loading ? 'login-status' : undefined}
              >
                {loading ? (
                  <>
                    <span aria-hidden="true">Accesso in corso...</span>
                    <span id="login-status" className="sr-only">Accesso in corso, attendere prego</span>
                  </>
                ) : (
                  'Accedi'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
