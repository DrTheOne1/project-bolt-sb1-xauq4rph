/*
  # Gateway Management System

  1. New Tables
    - `gateway_providers`
      - Stores supported SMS gateway providers and their configurations
    - `gateways`
      - Stores configured gateway instances
    - `gateway_routes`
      - Manages routing rules for messages
    - `gateway_logs`
      - Tracks gateway performance and issues

  2. Security
    - Enable RLS on all tables
    - Add policies for admin-only access
*/

-- Create is_admin() function if it doesn't exist
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Gateway Providers table
CREATE TABLE IF NOT EXISTS gateway_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  config_schema jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gateway_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage gateway providers"
  ON gateway_providers
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Gateways table
CREATE TABLE IF NOT EXISTS gateways (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL REFERENCES gateway_providers(code),
  credentials jsonb NOT NULL,
  status text DEFAULT 'inactive',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gateways ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage gateways"
  ON gateways
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Gateway Routes table
CREATE TABLE IF NOT EXISTS gateway_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid REFERENCES gateways(id) ON DELETE CASCADE,
  country_codes text[] NOT NULL,
  priority integer DEFAULT 1,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gateway_routes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage gateway routes"
  ON gateway_routes
  FOR ALL
  TO authenticated
  USING (is_admin());

-- Gateway Logs table
CREATE TABLE IF NOT EXISTS gateway_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway_id uuid REFERENCES gateways(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  details jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE gateway_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view gateway logs"
  ON gateway_logs
  FOR SELECT
  TO authenticated
  USING (is_admin());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_gateway_providers_code ON gateway_providers(code);
CREATE INDEX IF NOT EXISTS idx_gateways_provider ON gateways(provider);
CREATE INDEX IF NOT EXISTS idx_gateway_routes_gateway_id ON gateway_routes(gateway_id);
CREATE INDEX IF NOT EXISTS idx_gateway_logs_gateway_id ON gateway_logs(gateway_id);
CREATE INDEX IF NOT EXISTS idx_gateway_logs_event_type ON gateway_logs(event_type);

-- Insert default gateway providers
INSERT INTO gateway_providers (name, code, config_schema) VALUES
  ('Twilio', 'twilio', '{"required": ["account_sid", "auth_token", "from_number"]}'),
  ('MessageBird', 'messagebird', '{"required": ["api_key", "originator"]}'),
  ('Vonage', 'vonage', '{"required": ["api_key", "api_secret", "from_number"]}'),
  ('AWS SNS', 'aws_sns', '{"required": ["access_key_id", "secret_access_key", "region"]}')
ON CONFLICT DO NOTHING;