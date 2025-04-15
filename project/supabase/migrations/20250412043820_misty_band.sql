/*
  # Add Gateway ID to Messages Table

  1. Changes
    - Add gateway_id column to messages table
    - Add foreign key constraint to gateways table
    - Add index on gateway_id for better query performance

  2. Security
    - No changes to RLS policies needed
*/

-- Add gateway_id column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'messages' AND column_name = 'gateway_id'
  ) THEN
    ALTER TABLE messages 
    ADD COLUMN gateway_id uuid REFERENCES gateways(id) ON DELETE SET NULL;

    -- Create index for better query performance
    CREATE INDEX IF NOT EXISTS idx_messages_gateway_id ON messages(gateway_id);
  END IF;
END $$;