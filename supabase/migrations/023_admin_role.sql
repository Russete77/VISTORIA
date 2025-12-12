-- ====================================================
-- Migration: 023_admin_role.sql
-- Description: Add role column to users table for admin access
-- ====================================================

-- Add role column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' 
  CHECK (role IN ('user', 'admin', 'super_admin'));

-- Create index for role lookups
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Set super_admin role for specified emails
UPDATE users SET role = 'super_admin' 
WHERE email IN ('erickrussomat@gmail.com', 'fkoen@live.com');

-- Add comment for documentation
COMMENT ON COLUMN users.role IS 'User role: user, admin, or super_admin';

-- RLS policy for admins to view all users
CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.clerk_id = auth.jwt() ->> 'sub' 
      AND u.role IN ('admin', 'super_admin')
    )
  );

-- RLS policy for super_admins to update any user
CREATE POLICY "Super admins can update any user"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users u 
      WHERE u.clerk_id = auth.jwt() ->> 'sub' 
      AND u.role = 'super_admin'
    )
  );
