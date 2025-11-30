/**
 * CreateUserModal Component
 * Modal per la creazione di un nuovo utente fornitore
 */

import React, { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  UserPlusIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import type { CreateUserFormData, ProviderUserRole } from '../../../types/providerUser';
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from '../../../types/providerUser';
import { checkEmailAvailability } from '../../../services/providerUsersService';

// Schema di validazione
const createUserSchema = yup.object({
  firstName: yup
    .string()
    .required('Nome obbligatorio')
    .min(2, 'Il nome deve avere almeno 2 caratteri')
    .max(50, 'Il nome non puo superare i 50 caratteri'),
  lastName: yup
    .string()
    .required('Cognome obbligatorio')
    .min(2, 'Il cognome deve avere almeno 2 caratteri')
    .max(50, 'Il cognome non puo superare i 50 caratteri'),
  email: yup
    .string()
    .required('Email obbligatoria')
    .email('Email non valida'),
  password: yup
    .string()
    .required('Password obbligatoria')
    .min(8, 'La password deve avere almeno 8 caratteri')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'La password deve contenere almeno una lettera maiuscola, una minuscola e un numero'
    ),
  confirmPassword: yup
    .string()
    .required('Conferma password obbligatoria')
    .oneOf([yup.ref('password')], 'Le password non coincidono'),
  role: yup
    .string()
    .oneOf(['admin', 'manager', 'operator'] as const, 'Ruolo non valido')
    .required('Ruolo obbligatorio')
});

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateUserFormData) => Promise<{ success: boolean; error?: string }>;
}

export default function CreateUserModal({
  isOpen,
  onClose,
  onSubmit
}: CreateUserModalProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isValid }
  } = useForm<CreateUserFormData>({
    resolver: yupResolver(createUserSchema),
    mode: 'onChange',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
      role: 'operator'
    }
  });

  const emailValue = watch('email');
  const selectedRole = watch('role');

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
      setSubmitError(null);
      setEmailError(null);
      setShowPassword(false);
      setShowConfirmPassword(false);
    }
  }, [isOpen, reset]);

  // Check email availability with debounce
  useEffect(() => {
    const checkEmail = async () => {
      if (!emailValue || errors.email) {
        setEmailError(null);
        return;
      }

      // Simple email regex check
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailValue)) {
        return;
      }

      setEmailChecking(true);
      try {
        const { available, error } = await checkEmailAvailability(emailValue);
        if (error) {
          setEmailError(error);
        } else if (!available) {
          setEmailError('Questa email e gia in uso');
        } else {
          setEmailError(null);
        }
      } catch {
        // Ignore errors during check
      } finally {
        setEmailChecking(false);
      }
    };

    const timeoutId = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeoutId);
  }, [emailValue, errors.email]);

  const handleFormSubmit = async (data: CreateUserFormData) => {
    if (emailError) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const result = await onSubmit(data);

      if (result.success) {
        onClose();
      } else {
        setSubmitError(result.error || 'Errore durante la creazione dell\'utente');
      }
    } catch (error) {
      setSubmitError(
        error instanceof Error
          ? error.message
          : 'Errore sconosciuto durante la creazione'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-semibold text-gray-900 flex items-center"
                  >
                    <UserPlusIcon className="h-6 w-6 mr-2 text-blue-600" />
                    Nuovo Utente
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Error Alert */}
                {submitError && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
                    <ExclamationCircleIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700">{submitError}</p>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        htmlFor="firstName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Nome *
                      </label>
                      <input
                        {...register('firstName')}
                        id="firstName"
                        type="text"
                        placeholder="Mario"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                          errors.firstName ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.firstName.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="lastName"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Cognome *
                      </label>
                      <input
                        {...register('lastName')}
                        id="lastName"
                        type="text"
                        placeholder="Rossi"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                          errors.lastName ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.lastName.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Email *
                    </label>
                    <div className="relative">
                      <input
                        {...register('email')}
                        id="email"
                        type="email"
                        placeholder="mario.rossi@azienda.it"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                          errors.email || emailError ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      {emailChecking && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        </div>
                      )}
                    </div>
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.email.message}
                      </p>
                    )}
                    {emailError && !errors.email && (
                      <p className="mt-1 text-sm text-red-600">{emailError}</p>
                    )}
                  </div>

                  {/* Role */}
                  <div>
                    <label
                      htmlFor="role"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Ruolo *
                    </label>
                    <select
                      {...register('role')}
                      id="role"
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                        errors.role ? 'border-red-300' : 'border-gray-300'
                      }`}
                    >
                      <option value="operator">{ROLE_LABELS.operator}</option>
                      <option value="manager">{ROLE_LABELS.manager}</option>
                      <option value="admin">{ROLE_LABELS.admin}</option>
                    </select>
                    {selectedRole && (
                      <p className="mt-1 text-xs text-gray-500">
                        {ROLE_DESCRIPTIONS[selectedRole as ProviderUserRole]}
                      </p>
                    )}
                    {errors.role && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.role.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="password"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Password *
                    </label>
                    <div className="relative">
                      <input
                        {...register('password')}
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Minimo 8 caratteri"
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.password.message}
                      </p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="confirmPassword"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Conferma Password *
                    </label>
                    <div className="relative">
                      <input
                        {...register('confirmPassword')}
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Ripeti la password"
                        className={`w-full px-3 py-2 pr-10 border rounded-lg focus:ring-blue-500 focus:border-blue-500 ${
                          errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                        }`}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      >
                        {showConfirmPassword ? (
                          <EyeSlashIcon className="h-5 w-5" />
                        ) : (
                          <EyeIcon className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    {errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {errors.confirmPassword.message}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={isSubmitting}
                      className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                      Annulla
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !isValid || !!emailError}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {isSubmitting ? (
                        <>
                          <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                          Creazione in corso...
                        </>
                      ) : (
                        <>
                          <UserPlusIcon className="h-5 w-5 mr-2" />
                          Crea Utente
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
