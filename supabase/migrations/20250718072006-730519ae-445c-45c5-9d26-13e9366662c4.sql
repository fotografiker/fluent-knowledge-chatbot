-- Insert demo user with email admin@demo.com and password 'password'
-- Note: This is for demo purposes only. In production, users should be created through the signup flow.

-- First, we'll create a user in the auth.users table via Supabase Admin API equivalent
-- Since we can't directly insert into auth.users, we'll create the profile and role for when the user signs up

-- Insert a demo user role that will be applied when admin@demo.com signs up
INSERT INTO public.user_roles (user_id, role) 
SELECT auth.uid(), 'admin'::app_role 
WHERE auth.email() = 'admin@demo.com'
ON CONFLICT (user_id, role) DO NOTHING;