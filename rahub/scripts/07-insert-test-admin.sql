-- This script adds admin role to an existing user
-- Before running: Sign up at /auth/investor-signup or /auth/advisor-signup first
-- Then update 'admin@test.com' below with the email you signed up with

-- Updated to include email field and join with auth.users table to fetch email automatically
INSERT INTO admins (user_id, email, role, created_at, updated_at)
SELECT 
  id,
  email,
  'admin',
  NOW(),
  NOW()
FROM auth.users
WHERE email = 'admin@test.com'
LIMIT 1
ON CONFLICT (user_id) DO UPDATE SET role = 'admin', updated_at = NOW();

-- Verify the admin was created
SELECT id, user_id, email, role, created_at FROM admins WHERE role = 'admin';
