const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env file manually
const envPath = path.join(__dirname, '..', '.env');
let supabaseUrl, supabaseServiceKey;

try {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n');
  
  for (const line of envLines) {
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim();
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim();
    }
  }
} catch (error) {
  console.error('❌ Could not read .env file:', error.message);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addRegionColumn() {
  try {
    console.log('🔧 Adding region column to provider_profiles table...');
    console.log(`🌐 Using Supabase URL: ${supabaseUrl}`);
    
    // First, let's check the current table structure
    console.log('📊 Checking current table structure...');
    const { data: tableInfo, error: tableError } = await supabase
      .from('provider_profiles')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.error('❌ Error accessing provider_profiles table:', tableError);
      return;
    }
    
    console.log('✅ Table accessible, current structure:', Object.keys(tableInfo[0] || {}));
    
    // Try to use the SQL function if available
    console.log('🔧 Attempting to add region column via SQL...');
    
    try {
      // Try different SQL execution methods
      const { data: sqlResult, error: sqlError } = await supabase.rpc('exec_sql', {
        sql: "ALTER TABLE provider_profiles ADD COLUMN IF NOT EXISTS region VARCHAR(100);"
      });
      
      if (sqlError) {
        console.log('❌ exec_sql not available:', sqlError.message);
        throw sqlError;
      }
      
      console.log('✅ SQL executed successfully:', sqlResult);
      
    } catch (sqlError) {
      console.log('🔄 SQL execution failed, trying alternative approach...');
      
      // Alternative: Try to insert a test record with the region field
      // This will fail if the column doesn't exist, giving us confirmation
      console.log('🧪 Testing if region column exists by attempting insert...');
      
      const { data: insertResult, error: insertError } = await supabase
        .from('provider_profiles')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
          business_name: 'TEST_REGION_COLUMN',
          region: 'TEST'
        })
        .select();
      
      if (insertError) {
        if (insertError.message.includes('column "region" of relation "provider_profiles" does not exist')) {
          console.log('❌ Confirmed: region column does not exist');
          console.log('📝 Manual intervention required:');
          console.log('   1. Go to Supabase Dashboard > Table Editor');
          console.log('   2. Select provider_profiles table');
          console.log('   3. Click "Add Column" button');
          console.log('   4. Set Name: region');
          console.log('   5. Set Type: text (or varchar)');
          console.log('   6. Leave Default empty');
          console.log('   7. Click "Save"');
          console.log('');
          console.log('   OR use SQL Editor:');
          console.log('   1. Go to Supabase Dashboard > SQL Editor');
          console.log('   2. Run: ALTER TABLE provider_profiles ADD COLUMN region VARCHAR(100);');
          return;
        } else {
          console.error('❌ Unexpected insert error:', insertError);
          return;
        }
      } else {
        console.log('✅ Region column already exists! Insert successful:', insertResult);
        
        // Clean up the test record
        const { error: deleteError } = await supabase
          .from('provider_profiles')
          .delete()
          .eq('business_name', 'TEST_REGION_COLUMN');
        
        if (deleteError) {
          console.log('⚠️ Could not clean up test record:', deleteError);
        } else {
          console.log('🧹 Test record cleaned up');
        }
      }
    }
    
    // Final verification
    console.log('🔍 Final verification - checking table structure again...');
    const { data: finalCheck, error: finalError } = await supabase
      .from('provider_profiles')
      .select('*')
      .limit(1);
    
    if (finalError) {
      console.error('❌ Final check failed:', finalError);
    } else {
      const columns = Object.keys(finalCheck[0] || {});
      console.log('📋 Final table columns:', columns);
      
      if (columns.includes('region')) {
        console.log('✅ SUCCESS: region column is now available!');
      } else {
        console.log('❌ region column still not found in table structure');
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    console.log('📝 Please add the column manually in Supabase Dashboard');
  }
}

// Run the migration
addRegionColumn();