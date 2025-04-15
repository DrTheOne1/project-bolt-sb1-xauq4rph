/*
  # Create get_twilio_credits function

  1. New Function
    - Creates a PostgreSQL function to fetch Twilio credits
    - Takes gateway_id as input
    - Returns balance and currency information
    
  2. Security
    - Function is accessible to authenticated users
    - Users can only access credits for gateways they own
*/

CREATE OR REPLACE FUNCTION get_twilio_credits(gateway_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  gateway_record RECORD;
  twilio_response json;
BEGIN
  -- Get gateway details and verify ownership
  SELECT g.* INTO gateway_record
  FROM gateways g
  WHERE g.id = gateway_id
    AND (g.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM users u 
      WHERE u.id = auth.uid() 
      AND u.role = 'admin'
    ));

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Gateway not found or access denied';
  END IF;

  IF gateway_record.provider != 'twilio' THEN
    RAISE EXCEPTION 'Invalid gateway provider';
  END IF;

  -- Call Twilio API using pg_net extension
  SELECT content::json INTO twilio_response
  FROM net.http_get(
    format(
      'https://api.twilio.com/2010-04-01/Accounts/%s/Balance.json',
      gateway_record.credentials->>'account_sid'
    ),
    headers := jsonb_build_object(
      'Authorization', 
      format(
        'Basic %s',
        encode(
          (gateway_record.credentials->>'account_sid' || ':' || gateway_record.credentials->>'auth_token')::bytea,
          'base64'
        )
      )
    )
  );

  RETURN json_build_object(
    'balance', twilio_response->>'balance',
    'currency', twilio_response->>'currency'
  );
END;
$$;