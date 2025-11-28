// Configurazione centralizzata degli URL
export const APP_CONFIG = {
  // Domini
  PRODUCTION_URL: 'https://bookinghse.com',
  STAGING_URL: 'https://booking-hse.netlify.app',
  LOCAL_URL: 'http://localhost:5173',
  
  // URL corrente basato su environment
  APP_URL: import.meta.env.VITE_APP_URL || 'https://bookinghse.com',
  
  // Auth URLs
  AUTH_CALLBACK_URL: '/auth/callback',
  PASSWORD_RESET_URL: '/auth/reset-password',
  EMAIL_VERIFY_URL: '/auth/verify',
  EMAIL_CONFIRMATION_URL: '/email-verification-confirm',
  
  // API Endpoints
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  
  // Costruttori URL completi
  getFullUrl: (path: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || 'https://bookinghse.com';
    return `${baseUrl}${path}`;
  },
  
  // URL per email templates
  getAuthUrl: (type: 'callback' | 'reset' | 'verify', token?: string) => {
    const baseUrl = import.meta.env.VITE_APP_URL || 'https://bookinghse.com';
    const paths = {
      callback: '/auth/callback',
      reset: '/auth/reset-password',
      verify: '/auth/verify'
    };
    const url = `${baseUrl}${paths[type]}`;
    return token ? `${url}?token=${token}` : url;
  }
};

// Export per compatibilità
export const PASSWORD_RESET_URL = APP_CONFIG.getFullUrl('/auth/reset-password');
export const EMAIL_CONFIRMATION_URL = APP_CONFIG.getFullUrl('/email-verification-confirm');
export const AUTH_CALLBACK_URL = APP_CONFIG.getFullUrl('/auth/callback');