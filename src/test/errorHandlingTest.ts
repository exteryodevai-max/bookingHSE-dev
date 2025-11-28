// Test file per verificare la gestione errori Supabase
import { handleSupabaseError, getErrorMessage, SupabaseError, isNotFoundError } from '../lib/errors/supabaseErrors';

// Test per errori PostgreSQL comuni
export const testPostgreSQLErrors = () => {
  console.log('🧪 Testing PostgreSQL error handling...');

  // Test errore di violazione unique constraint
  const uniqueViolationError = {
    code: '23505',
    message: 'duplicate key value violates unique constraint "users_email_key"',
    details: 'Key (email)=(test@example.com) already exists.'
  };

  const handledUniqueError = handleSupabaseError(uniqueViolationError);
  console.log('✅ Unique violation error:', getErrorMessage(handledUniqueError));

  // Test errore di foreign key constraint
  const foreignKeyError = {
    code: '23503',
    message: 'insert or update on table "bookings" violates foreign key constraint',
    details: 'Key (service_id)=(123) is not present in table "services".'
  };

  const handledForeignKeyError = handleSupabaseError(foreignKeyError);
  console.log('✅ Foreign key error:', getErrorMessage(handledForeignKeyError));

  // Test errore not null constraint
  const notNullError = {
    code: '23502',
    message: 'null value in column "email" violates not-null constraint',
    details: 'Failing row contains (123, null, ...).'
  };

  const handledNotNullError = handleSupabaseError(notNullError);
  console.log('✅ Not null error:', getErrorMessage(handledNotNullError));
};

// Test per errori PostgREST
export const testPostgRESTErrors = () => {
  console.log('🧪 Testing PostgREST error handling...');

  // Test errore 404 (record not found)
  const notFoundError = {
    code: 'PGRST116',
    message: 'JSON object requested, multiple (or no) rows returned',
    details: null,
    hint: null
  };

  const handledNotFoundError = handleSupabaseError(notFoundError);
  console.log('✅ Not found error:', getErrorMessage(handledNotFoundError));
  console.log('✅ Is not found error:', isNotFoundError(notFoundError));

  // Test errore di permessi RLS
  const rlsError = {
    code: '42501',
    message: 'permission denied for table users',
    details: null,
    hint: null
  };

  const handledRlsError = handleSupabaseError(rlsError);
  console.log('✅ RLS permission error:', getErrorMessage(handledRlsError));
};

// Test per errori Auth
export const testAuthErrors = () => {
  console.log('🧪 Testing Auth error handling...');

  // Test errore di credenziali invalide
  const invalidCredentialsError = {
    message: 'Invalid login credentials',
    status: 400
  };

  const handledAuthError = SupabaseError.fromError(invalidCredentialsError);
  console.log('✅ Invalid credentials error:', getErrorMessage(handledAuthError));

  // Test errore email già registrata
  const emailExistsError = {
    message: 'User already registered',
    status: 422
  };

  const handledEmailError = SupabaseError.fromError(emailExistsError);
  console.log('✅ Email exists error:', getErrorMessage(handledEmailError));
};

// Test per errori generici
export const testGenericErrors = () => {
  console.log('🧪 Testing generic error handling...');

  // Test errore di rete
  const networkError = new Error('Network request failed');
  const handledNetworkError = SupabaseError.fromError(networkError);
  console.log('✅ Network error:', getErrorMessage(handledNetworkError));

  // Test errore sconosciuto
  const unknownError = { message: 'Something went wrong' };
  const handledUnknownError = SupabaseError.fromError(unknownError);
  console.log('✅ Unknown error:', getErrorMessage(handledUnknownError));
};

// Esegui tutti i test
export const runAllErrorTests = () => {
  console.log('🚀 Starting Supabase error handling tests...\n');
  
  testPostgreSQLErrors();
  console.log('');
  
  testPostgRESTErrors();
  console.log('');
  
  testAuthErrors();
  console.log('');
  
  testGenericErrors();
  
  console.log('\n✅ All error handling tests completed!');
};

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Uncomment the line below to run tests automatically
  // runAllErrorTests();
}