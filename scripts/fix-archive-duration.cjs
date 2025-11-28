const { executeSQL } = require('./setup-database.cjs');

async function fixArchiveDuration() {
  try {
    console.log('Fixing archive_service function duration field issue...');
    
    // Drop and recreate the archive_service function with the correct field mapping
    const sql = `
      DROP FUNCTION IF EXISTS archive_service(UUID, UUID);
      
      CREATE OR REPLACE FUNCTION archive_service(p_service_id UUID, p_user_id UUID)
      RETURNS BOOLEAN AS $$
      DECLARE
        service_record RECORD;
      BEGIN
        -- Get service record
        SELECT * INTO service_record
        FROM services 
        WHERE id = p_service_id AND provider_id = p_user_id;
        
        IF NOT FOUND THEN
          RAISE EXCEPTION 'Service not found or unauthorized';
        END IF;
        
        -- Insert into archived_services
        INSERT INTO archived_services (
          id, provider_id, title, description, category, duration, price, 
          currency, location_type, location_address, requirements, images, 
          active, created_at, updated_at, metadata
        ) VALUES (
          service_record.id, service_record.provider_id, service_record.title, 
          service_record.description, service_record.category, 
          COALESCE(service_record.duration_hours, 0), -- Map duration_hours to duration
          service_record.base_price, -- Map base_price to price
          service_record.currency, service_record.location_type, 
          COALESCE(service_record.location_street, ''), -- Map location fields
          COALESCE(ARRAY_TO_STRING(service_record.requirements, ', '), ''), -- Map requirements array to text
          COALESCE(ARRAY_TO_STRING(service_record.images, ', '), ''), -- Map images array to text
          false, service_record.created_at, service_record.updated_at, 
          jsonb_build_object(
            'subcategory', service_record.subcategory,
            'service_type', service_record.service_type,
            'pricing_unit', service_record.pricing_unit,
            'duration_hours', service_record.duration_hours,
            'max_participants', service_record.max_participants,
            'min_participants', service_record.min_participants,
            'service_areas', service_record.service_areas,
            'deliverables', service_record.deliverables,
            'tags', service_record.tags,
            'documents', service_record.documents,
            'featured', service_record.featured,
            'slug', service_record.slug,
            'meta_description', service_record.meta_description
          )
        );
        
        -- Delete from services
        DELETE FROM services WHERE id = p_service_id;
        
        RETURN TRUE;
      END;
      $$ LANGUAGE plpgsql SECURITY DEFINER;
    `;
    
    await executeSQL(sql);
    console.log('✅ archive_service function fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing archive_service function:', error.message);
    console.log('\n💡 Manual fix required:');
    console.log('1. Go to Supabase SQL Editor');
    console.log('2. Run the SQL commands above manually');
    console.log('3. Make sure the function uses service_record.duration_hours instead of service_record.duration');
  }
}

// Run the fix
fixArchiveDuration();