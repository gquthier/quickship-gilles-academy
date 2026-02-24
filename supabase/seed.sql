-- ============================================
-- QuickShip App — Seed Data
-- ============================================
-- Run this AFTER running the migration.
--
-- To create the first admin user, use the Supabase Dashboard:
-- 1. Go to Authentication > Users > Add User
-- 2. Create user with email + password
-- 3. Then run this SQL to make them admin:

-- UPDATE profiles SET role = 'admin' WHERE email = 'admin@quickship.fr';

-- ============================================
-- Example: Create a demo client and project
-- (Uncomment to use)
-- ============================================

-- INSERT INTO profiles (id, email, full_name, company, role) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'demo@client.com', 'Marie Demo', 'Demo Corp', 'client');

-- INSERT INTO projects (client_id, name, description, domain, status, tech_stack) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'Demo Website', 'Site vitrine pour Demo Corp', 'democorp.com', 'deployed', ARRAY['Next.js', 'Tailwind', 'Vercel']);

-- INSERT INTO subscriptions (client_id, plan, status, price_monthly) VALUES
--   ('00000000-0000-0000-0000-000000000001', 'pro', 'active', 49.00);
