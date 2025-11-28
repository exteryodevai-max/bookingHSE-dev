import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Layout from '../../components/Layout/Layout';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';
import { debouncedEmailCheck } from '../../utils/emailCheck';

const registerSchema = yup.object({
  email: yup.string().email('Email non valida').required('Email obbligatoria'),
  password: yup.string().min(8, 'Password deve essere di almeno 8 caratteri').required('Password obbligatoria'),
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Le password non coincidono').required('Conferma password obbligatoria'),
  userType: yup.string().oneOf(['client', 'provider']).required('Tipo utente obbligatorio'),
  companyName: yup.string().required('Nome azienda obbligatorio'),
  firstName: yup.string().optional(),
  lastName: yup.string().optional(),
  phone: yup.string().optional(),
  acceptTerms: yup.boolean().oneOf([true], 'Devi accettare i termini e condizioni').required(),
});

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'client' | 'provider';
  companyName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  acceptTerms: boolean;
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const defaultUserType = searchParams.get('type') === 'provider' ? 'provider' : 'client';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<RegisterFormData>({
    resolver: yupResolver(registerSchema),
    defaultValues: {
      userType: defaultUserType
    }
  });

  const userType = watch('userType');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      
      const result = await signUp({
        email: data.email,
        password: data.password,
        userType: data.userType,
        companyName: data.companyName,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        acceptTerms: data.acceptTerms
      });

      if (result.error) {
        console.error('Registration error:', result.error);
        toast.error(result.error.message);
      } else {
        toast.success('Registrazione completata! Benvenuto nella piattaforma.');
        // Redirect directly to profile page based on user type
        if (data.userType === 'client') {
          navigate('/client/profile');
        } else {
          navigate('/provider/profile');
        }
      }
    } catch (error) {
      console.error('Registration catch error:', error);
      toast.error('Errore durante la registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout showFooter={false}>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
              Crea il tuo account
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Hai già un account?{' '}
              <Link to="/auth/login" className="font-medium text-blue-600 hover:text-blue-500">
                Accedi qui
              </Link>
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-4">
              {/* User Type Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo di Account
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="relative">
                    <input
                      {...register('userType')}
                      type="radio"
                      value="client"
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      userType === 'client' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">Cliente</div>
                        <div className="text-sm text-gray-500">Cerco servizi HSE</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="relative">
                    <input
                      {...register('userType')}
                      type="radio"
                      value="provider"
                      className="sr-only"
                    />
                    <div className={`p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                      userType === 'provider' 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-300 hover:border-gray-400'
                    }`}>
                      <div className="text-center">
                        <div className="font-medium text-gray-900">Fornitore</div>
                        <div className="text-sm text-gray-500">Offro servizi HSE</div>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.userType && (
                  <p className="mt-1 text-sm text-red-600">{errors.userType.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                  {userType === 'client' ? 'Nome Azienda' : 'Nome Attività'}
                </label>
                <input
                  {...register('companyName')}
                  id="companyName"
                  type="text"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder={userType === 'client' ? 'Es. Acme S.r.l.' : 'Es. Studio Sicurezza HSE'}
                />
                {errors.companyName && (
                  <p className="mt-1 text-sm text-red-600">{errors.companyName.message}</p>
                )}
              </div>

              {/* Optional personal info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    Nome (opzionale)
                  </label>
                  <input
                    {...register('firstName')}
                    id="firstName"
                    type="text"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Mario"
                  />
                </div>
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Cognome (opzionale)
                  </label>
                  <input
                    {...register('lastName')}
                    id="lastName"
                    type="text"
                    className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Rossi"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefono (opzionale)
                </label>
                <input
                  {...register('phone')}
                  id="phone"
                  type="tel"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="+39 123 456 7890"
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Inserisci la tua email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
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
                    autoComplete="new-password"
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Crea una password sicura"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Conferma Password
                </label>
                <div className="mt-1 relative">
                  <input
                    {...register('confirmPassword')}
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                    placeholder="Ripeti la password"
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                    ) : (
                      <EyeIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>

            <div className="flex items-center">
              <input
                {...register('acceptTerms')}
                id="acceptTerms"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-900">
                Accetto i{' '}
                <Link to="/terms" className="text-blue-600 hover:text-blue-500">
                  Termini e Condizioni
                </Link>{' '}
                e la{' '}
                <Link to="/privacy" className="text-blue-600 hover:text-blue-500">
                  Privacy Policy
                </Link>
              </label>
            </div>
            {errors.acceptTerms && (
              <p className="text-sm text-red-600">{errors.acceptTerms.message}</p>
            )}

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Registrazione in corso...' : 'Registrati'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}