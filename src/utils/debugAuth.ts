// Debug utility to check authentication and database state
import { supabase } from '../lib/supabase';
import type { Session, AuthError } from '@supabase/supabase-js';

interface SessionResponse {
  data: { session: Session | null };
  error: AuthError | null;
}

interface DatabaseResponse<T> {
  data: T | null;
  error: Error | null;
}

export async function checkAuthState() {
  try {
    console.log('🔍 Checking authentication state...\n');
    
    // Check if supabase is configured
    if (!supabase) {
      console.error('❌ Supabase client not configured');
      return;
    }
    
    // 1. Check current session
    console.log('1. Current Session:');
    const { data: { session }, error: sessionError } = await Promise.race([
      supabase.auth.getSession(),
      new Promise<SessionResponse>((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000))
    ]);
    
    if (sessionError) {
      console.error('   ❌ Error getting session:', sessionError);
    } else if (session) {
      console.log('   ✅ Session found');
      console.log('   User ID:', session.user.id);
      console.log('   Email:', session.user.email);
      console.log('   User Type:', session.user.user_metadata?.user_type);
      console.log('   Company:', session.user.user_metadata?.company_name);
    } else {
      console.log('   ⚠️ No active session');
    }
    
    // 2. Check user in database
    if (session?.user) {
      console.log('\n2. Database User Record:');
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (userError) {
        console.error('   ❌ Error fetching user:', userError);
      } else if (userData) {
        console.log('   ✅ User record found');
        console.log('   User Type:', userData.user_type);
        console.log('   Created:', userData.created_at);
      } else {
        console.log('   ⚠️ User record NOT found - needs to be created');
      }
      
      // 3. Check profile based on user type
      const userType = session.user.user_metadata?.user_type || userData?.user_type;
      if (userType) {
        console.log(`\n3. ${userType} Profile:`);
        const profileTable = userType === 'client' ? 'client_profiles' : 'provider_profiles';
        
        const { data: profileData, error: profileError } = await supabase
          .from(profileTable)
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (profileError) {
          console.error(`   ❌ Error fetching ${userType} profile:`, profileError);
        } else if (profileData) {
          console.log(`   ✅ ${userType} profile found`);
          if (userType === 'provider') {
            console.log('   Business Name:', profileData.business_name);
            console.log('   Active:', profileData.active);
          } else {
            console.log('   Company Name:', profileData.company_name);
          }
        } else {
          console.log('   ⚠️ Profile NOT found - needs to be created');
        }
      }
    }
    
    console.log('\n📋 Summary:');
    if (session) {
      console.log('✅ User is authenticated');
      console.log('Next steps:');
      console.log('1. Check if user record exists in users table');
      console.log('2. Check if profile exists');
      console.log('3. If missing, AuthContext should create them automatically');
    } else {
      console.log('❌ User is not authenticated');
      console.log('User needs to login or register first');
    }
  } catch (error) {
    console.error('🚨 Error in checkAuthState:', error);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check if .env file exists with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
    console.log('2. Verify Supabase project is running');
    console.log('3. Check network connection');
    console.log('4. Verify database tables exist (users, client_profiles, provider_profiles)');
  }
}

// Simple connection test function
export async function testSupabaseConnection() {
  try {
    console.log('🔌 Testing Supabase connection...');
    
    if (!supabase) {
      console.error('❌ Supabase client not configured');
      return false;
    }
    
    // Simple test query with timeout
    const { error } = await Promise.race([
      supabase.from('users').select('count').limit(1),
      new Promise<DatabaseResponse<unknown>>((_, reject) => setTimeout(() => reject(new Error('Connection timeout')), 5000))
    ]);
    
    if (error) {
      console.error('❌ Connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Supabase connection successful');
    return true;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
}

// Add to window for easy console access
if (typeof window !== 'undefined') {
  (window as Window & { checkAuthState?: typeof checkAuthState; testSupabaseConnection?: typeof testSupabaseConnection }).checkAuthState = checkAuthState;
  (window as Window & { checkAuthState?: typeof checkAuthState; testSupabaseConnection?: typeof testSupabaseConnection }).testSupabaseConnection = testSupabaseConnection;
  console.log('💡 Available debug functions:');
  console.log('  - checkAuthState() - Full authentication debug');
  console.log('  - testSupabaseConnection() - Quick connection test');
}