-- Verify the deletion of Pippo srl services
-- This query will check:
-- 1. How many services remain for Pippo srl (should be 0)
-- 2. Total number of services in the database
-- 3. Confirm that the Pippo srl provider profile still exists

-- Check if Pippo srl provider still exists
SELECT 
  id,
  company_name,
  user_type,
  created_at
FROM users 
WHERE company_name = 'Pippo srl' 
  AND user_type = 'provider';

-- Count services for Pippo srl (should be 0)
SELECT COUNT(*) as pippo_services_count
FROM services s
JOIN users u ON s.provider_id = u.id
WHERE u.company_name = 'Pippo srl' 
  AND u.user_type = 'provider';

-- Total services count in database
SELECT COUNT(*) as total_services_count FROM services;

-- Show all remaining providers and their service counts
SELECT 
  u.company_name,
  u.user_type,
  COUNT(s.id) as services_count
FROM users u
LEFT JOIN services s ON u.id = s.provider_id
WHERE u.user_type = 'provider'
GROUP BY u.id, u.company_name, u.user_type
ORDER BY services_count DESC;