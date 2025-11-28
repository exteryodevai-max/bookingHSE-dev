import { supabase } from '../lib/supabase';

/**
 * Check if an email is already registered in the system
 * @param email - Email to check
 * @returns Promise<boolean> - true if email is available, false if already registered
 */
export async function checkEmailAvailability(email: string): Promise<boolean> {
  try {
    console.log('Checking email availability for:', email);
    
    // First try the direct query approach
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .limit(1);

    console.log('Email check result:', { data, error, email });

    if (error) {
      console.error('Error checking email availability:', error);
      
      // Handle specific error codes
      if (error.code === '406' || error.message?.includes('406')) {
        console.warn('406 error detected - trying database function fallback');
        
        // Fallback: use database function to avoid RLS issues
        try {
          const { data: funcData, error: funcError } = await supabase
            .rpc('check_email_availability', { email_input: email });
          
          if (funcError) {
            console.error('Database function also failed:', funcError);
            return true; // Assume available if both methods fail
          }
          
          console.log('Database function result:', funcData);
          return funcData;
        } catch (funcError) {
          console.error('Database function exception:', funcError);
          return true; // Assume available on error
        }
      }
      
      if (error.code === 'PGRST116') {
        // No rows found - email is available
        return true;
      }
      
      // For other errors, assume available to allow registration
      return true;
    }

    // If we found data, email is not available
    const isAvailable = !data || data.length === 0;
    console.log('Email availability result:', isAvailable, 'Data found:', data);
    return isAvailable;
  } catch (error) {
    console.error('Exception checking email availability:', error);
    return true; // Assume available on error to allow registration
  }
}

/**
 * Debounced email availability check
 * @param email - Email to check
 * @param delay - Debounce delay in milliseconds
 * @returns Promise<boolean>
 */
export function debouncedEmailCheck(email: string, delay: number = 500): Promise<boolean> {
  return new Promise((resolve) => {
    setTimeout(async () => {
      const isAvailable = await checkEmailAvailability(email);
      resolve(isAvailable);
    }, delay);
  });
}