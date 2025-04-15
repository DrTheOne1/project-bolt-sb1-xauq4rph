/*
  # Add Twilio Gateway Provider

  1. Changes
    - Adds Twilio as a new gateway provider with required configuration fields
    - Sets up the config schema for Twilio credentials

  2. Configuration Schema
    - Account SID
    - Auth Token
    - Sender Number
    - Sub-account SID (optional)
    - Route Type (SMS/WhatsApp)
*/

INSERT INTO gateway_providers (name, code, config_schema, is_active)
VALUES (
  'Twilio',
  'twilio',
  '{
    "required": [
      "account_sid",
      "auth_token",
      "sender_number"
    ],
    "optional": [
      "subaccount_sid",
      "route_type"
    ],
    "defaults": {
      "route_type": "SMS"
    },
    "validation": {
      "account_sid": {
        "pattern": "^AC[0-9a-fA-F]{32}$",
        "message": "Invalid Account SID format"
      },
      "auth_token": {
        "pattern": "^[0-9a-fA-F]{32}$",
        "message": "Invalid Auth Token format"
      },
      "route_type": {
        "enum": ["SMS", "WhatsApp"],
        "message": "Route type must be either SMS or WhatsApp"
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (code) DO UPDATE
SET 
  config_schema = EXCLUDED.config_schema,
  is_active = EXCLUDED.is_active;