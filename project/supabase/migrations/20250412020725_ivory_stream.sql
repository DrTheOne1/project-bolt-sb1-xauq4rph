/*
  # Initial Schema Setup for SMS Platform

  1. Tables Created
    - users
      - Extended user profile data
    - messages
      - SMS message records
    - templates
      - Message templates
    - contacts
      - Contact information
    - groups
      - Contact groups
    - group_members
      - Group membership
    - gateways
      - SMS gateway configurations
    - gateway_routes
      - Gateway routing rules

  2. Security
    - RLS enabled on all tables
    - Policies for user data isolation
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  role text NOT NULL DEFAULT 'user',
  credits integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  recipient text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create contacts table
CREATE TABLE IF NOT EXISTS contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  phone_number text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create groups table
CREATE TABLE IF NOT EXISTS groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid REFERENCES groups(id),
  phone_number text NOT NULL,
  country_code text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create gateways table
CREATE TABLE IF NOT EXISTS gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id),
  name text NOT NULL,
  provider text NOT NULL,
  credentials jsonb NOT NULL,
  status text NOT NULL DEFAULT 'inactive',
  created_at timestamptz DEFAULT now()
);

-- Create gateway_routes table
CREATE TABLE IF NOT EXISTS gateway_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid REFERENCES gateways(id),
  country_codes text[] NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateways ENABLE ROW LEVEL SECURITY;
ALTER TABLE gateway_routes ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can read own messages" ON messages
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own messages" ON messages
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own templates" ON templates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own templates" ON templates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own contacts" ON contacts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own contacts" ON contacts
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read own groups" ON groups
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own groups" ON groups
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can read group members" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage group members" ON group_members
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM groups
      WHERE groups.id = group_members.group_id
      AND groups.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage gateways" ON gateways
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can read gateways" ON gateways
  FOR SELECT USING (true);

CREATE POLICY "Admin can manage gateway routes" ON gateway_routes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can read gateway routes" ON gateway_routes
  FOR SELECT USING (true);