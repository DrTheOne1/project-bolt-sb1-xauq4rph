/*
  # Update User Gateway Policies

  1. Changes
    - Add gateway_id and sender_names columns to users table
    - Update RLS policies for gateway selection
    - Restrict gateway selection to admins only

  2. Security
    - Only admins can select and assign gateways to users
    - Users can only view active gateways
    - Admins maintain full control over gateways
*/

-- Add gateway_id and sender_names columns to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS gateway_id uuid REFERENCES gateways(id),
ADD COLUMN IF NOT EXISTS sender_names text[] DEFAULT '{}';

-- Drop existing gateway policies
DROP POLICY IF EXISTS "Admins can manage all gateways" ON gateways;
DROP POLICY IF EXISTS "Users can read gateways" ON gateways;

-- Create new gateway policies
CREATE POLICY "Users can view active gateways"
  ON gateways
  FOR SELECT
  TO authenticated
  USING (status = 'active');

CREATE POLICY "Admins can manage all gateways"
  ON gateways
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Add policy for admins to update user gateway selection
CREATE POLICY "Admins can update user gateway selection"
  ON users
  FOR UPDATE
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

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_users_gateway_id ON users(gateway_id); 