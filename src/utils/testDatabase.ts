// Database connection and CRUD operations test utility
import { supabase } from '../lib/supabase'

// Test database connection
export const testConnection = async () => {
  try {
    // Check if Supabase is configured
    if (!supabase) {
      return { 
        success: false, 
        error: 'Supabase not configured. Please check your .env file.' 
      }
    }

    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)

    if (error) {
      console.error('Database connection failed:', error)
      return { 
        success: false, 
        error: `Database error: ${error.message}. Please ensure the database schema is applied.` 
      }
    }

    console.log('✅ Database connection successful')
    return { success: true, data }
  } catch (error) {
    console.error('Database connection error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    
    if (errorMessage.includes('Failed to fetch')) {
      return { 
        success: false, 
        error: 'Cannot connect to Supabase. Please check your VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file.' 
      }
    }
    
    return { success: false, error: errorMessage }
  }
}

// Test user creation
export const testUserCreation = async () => {
  try {
    const testUser = {
      id: 'test-user-' + Date.now(),
      email: `test${Date.now()}@example.com`,
      user_type: 'client' as const,
      first_name: 'Test',
      last_name: 'User',
      phone: '+39 123 456 7890',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('users')
      .insert([testUser])
      .select()
      .maybeSingle()

    if (error) {
      console.error('User creation failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ User creation successful:', data)
    return { success: true, data }
  } catch (error) {
    console.error('User creation error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Test service creation
export const testServiceCreation = async (providerId: string) => {
  try {
    const testService = {
      provider_id: providerId,
      title: 'Test Service - Formazione Sicurezza',
      description: 'Servizio di test per la formazione sulla sicurezza sul lavoro',
      category: 'training_education',
      subcategory: 'Formazione Base',
      service_type: 'instant',
      location_type: 'flexible',
      base_price: 150.00,
      pricing_unit: 'per_participant',
      duration_hours: 8.0,
      max_participants: 20,
      min_participants: 5,
      service_areas: ['Milano', 'Lombardia'],
      requirements: ['Aula attrezzata', 'Proiettore'],
      deliverables: ['Attestato di formazione', 'Materiale didattico'],
      tags: ['Test', 'Formazione', 'Sicurezza'],
      active: true,
      featured: false,
      slug: `test-service-${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('services')
      .insert([testService])
      .select()
      .maybeSingle()

    if (error) {
      console.error('Service creation failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Service creation successful:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Service creation error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Test booking creation
export const testBookingCreation = async (serviceId: string, clientId: string, providerId: string) => {
  try {
    const testBooking = {
      service_id: serviceId,
      client_id: clientId,
      provider_id: providerId,
      status: 'pending',
      booking_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      start_time: '09:00',
      end_time: '17:00',
      duration_hours: 8.0,
      location_type: 'on_site',
      location_street: 'Via Test 123',
      location_city: 'Milano',
      location_province: 'MI',
      location_postal_code: '20121',
      participants_count: 10,
      base_amount: 1500.00,
      tax_amount: 330.00,
      total_amount: 1830.00,
      payment_status: 'pending',
      client_notes: 'Test booking per verifica funzionalità',
      special_requirements: ['Test requirement'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([testBooking])
      .select()
      .maybeSingle()

    if (error) {
      console.error('Booking creation failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Booking creation successful:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Booking creation error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Test data retrieval
export const testDataRetrieval = async () => {
  try {
    // Test services retrieval
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select(`
        *,
        provider:provider_profiles!services_provider_id_fkey(
          business_name,
          rating_average,
          reviews_count,
          verified
        )
      `)
      .eq('active', true)
      .limit(5)

    if (servicesError) {
      console.error('Services retrieval failed:', servicesError)
      return { success: false, error: servicesError.message }
    }

    console.log('✅ Services retrieval successful:', services?.length, 'services found')

    // Test providers retrieval
    const { data: providers, error: providersError } = await supabase
      .from('provider_profiles')
      .select('*')
      .eq('verified', true)
      .limit(5)

    if (providersError) {
      console.error('Providers retrieval failed:', providersError)
      return { success: false, error: providersError.message }
    }

    console.log('✅ Providers retrieval successful:', providers?.length, 'providers found')

    return { 
      success: true, 
      data: { 
        services: services?.length || 0, 
        providers: providers?.length || 0 
      } 
    }
  } catch (error) {
    console.error('Data retrieval error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Test update operations
export const testUpdateOperations = async (userId: string) => {
  try {
    const updateData = {
      phone: '+39 987 654 3210',
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .maybeSingle()

    if (error) {
      console.error('Update operation failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Update operation successful:', data)
    return { success: true, data }
  } catch (error) {
    console.error('Update operation error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Test delete operations
export const testDeleteOperations = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (error) {
      console.error('Delete operation failed:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Delete operation successful')
    return { success: true }
  } catch (error) {
    console.error('Delete operation error:', error)
    return { success: false, error: (error as Error).message }
  }
}

// Run all tests
export const runAllTests = async () => {
  console.log('🚀 Starting database tests...')
  
  const results = {
    connection: await testConnection(),
    userCreation: await testUserCreation(),
    dataRetrieval: await testDataRetrieval()
  }

  // Test update and delete with the created user
  if (results.userCreation.success && results.userCreation.data) {
    const userId = results.userCreation.data.id
    results.updateOperations = await testUpdateOperations(userId)
    results.deleteOperations = await testDeleteOperations(userId)
  }

  console.log('📊 Test Results Summary:')
  Object.entries(results).forEach(([test, result]) => {
    const status = result.success ? '✅' : '❌'
    console.log(`${status} ${test}: ${result.success ? 'PASSED' : 'FAILED'}`)
    if (!result.success && result.error) {
      console.log(`   Error: ${result.error}`)
    }
  })

  const allPassed = Object.values(results).every(result => result.success)
  console.log(`\n${allPassed ? '🎉' : '⚠️'} Overall: ${allPassed ? 'ALL TESTS PASSED' : 'SOME TESTS FAILED'}`)

  return results
}

// Export individual test functions for manual testing
export const dbTests = {
  connection: testConnection,
  userCreation: testUserCreation,
  serviceCreation: testServiceCreation,
  bookingCreation: testBookingCreation,
  dataRetrieval: testDataRetrieval,
  updateOperations: testUpdateOperations,
  deleteOperations: testDeleteOperations,
  runAll: runAllTests
}

// Make tests available globally for browser console testing
if (typeof window !== 'undefined') {
  (window as typeof window & { dbTests: typeof dbTests }).dbTests = dbTests
  console.log('🔧 Database tests available globally as window.dbTests')
  console.log('💡 Run window.dbTests.runAll() to test all database operations')
}