/*
  # Fix User Update Policies

  1. Changes
    - Add gateway_id and sender_names columns to users table
    - Drop conflicting policies
    - Create unified policy for admin user management
    - Ensure proper handling of gateway_id and sender_names

  2. Security
    - Only admins can update user data
    - Proper validation of gateway_id
    - Proper handling of sender_names
*/

-- Add columns if they don't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS gateway_id uuid REFERENCES gateways(id),
ADD COLUMN IF NOT EXISTS sender_names text[] DEFAULT '{}';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can update own non-role data" ON users;
DROP POLICY IF EXISTS "Only admins can update roles" ON users;
DROP POLICY IF EXISTS "Admins can update user gateway selection" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create unified policy for admin user management
CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (
    is_admin() AND
    (
      gateway_id IS NULL OR
      EXISTS (
        SELECT 1 FROM gateways
        WHERE id = gateway_id
        AND status = 'active'
      )
    )
  ); 