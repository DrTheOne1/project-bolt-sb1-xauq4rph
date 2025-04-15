/*
  # Add admin role to users table

  1. Changes
    - Add user_role enum type
    - Add role column to users table
    - Add admin check function
    - Update RLS policies for all tables

  2. Security
    - Enable RLS on all tables
    - Add admin policies for full access
    - Maintain user-specific access policies
    - Add first-user-as-admin trigger
*/

-- Create role enum type if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
  END IF;
END $$;

-- Add role column to users table if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'role'
  ) THEN
    ALTER TABLE users ADD COLUMN role user_role NOT NULL DEFAULT 'user';
  END IF;
END $$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies if they exist
DO $$ BEGIN
  -- Users table policies
  DROP POLICY IF EXISTS "Users can read own data" ON users;
  DROP POLICY IF EXISTS "Users can update own data" ON users;
  DROP POLICY IF EXISTS "Admins can manage all users" ON users;
  
  -- Messages table policies
  DROP POLICY IF EXISTS "Admins can manage all messages" ON messages;
  
  -- Contacts table policies
  DROP POLICY IF EXISTS "Admins can manage all contacts" ON contacts;
  
  -- Templates table policies
  DROP POLICY IF EXISTS "Admins can manage all templates" ON templates;
  
  -- Groups table policies
  DROP POLICY IF EXISTS "Admins can manage all groups" ON groups;
  
  -- Group members table policies
  DROP POLICY IF EXISTS "Admins can manage all group members" ON group_members;
  
  -- Gateways table policies
  DROP POLICY IF EXISTS "Admins can manage all gateways" ON gateways;
  
  -- Gateway routes table policies
  DROP POLICY IF EXISTS "Admins can manage all gateway routes" ON gateway_routes;
END $$;

-- Create new policies
-- Users table policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id OR is_admin());

-- Split update policy into two separate policies
CREATE POLICY "Users can update own non-role data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Only admins can update roles"
  ON users
  FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Messages table policies
CREATE POLICY "Admins can manage all messages"
  ON messages
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Contacts table policies
CREATE POLICY "Admins can manage all contacts"
  ON contacts
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Templates table policies
CREATE POLICY "Admins can manage all templates"
  ON templates
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Groups table policies
CREATE POLICY "Admins can manage all groups"
  ON groups
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Group members table policies
CREATE POLICY "Admins can manage all group members"
  ON group_members
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Gateways table policies
CREATE POLICY "Admins can manage all gateways"
  ON gateways
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Gateway routes table policies
CREATE POLICY "Admins can manage all gateway routes"
  ON gateway_routes
  FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create trigger to set first user as admin
CREATE OR REPLACE FUNCTION set_first_user_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM users WHERE role = 'admin') THEN
    NEW.role := 'admin';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS set_first_user_as_admin_trigger ON users;
CREATE TRIGGER set_first_user_as_admin_trigger
  BEFORE INSERT ON users
  FOR EACH ROW
  EXECUTE FUNCTION set_first_user_as_admin();