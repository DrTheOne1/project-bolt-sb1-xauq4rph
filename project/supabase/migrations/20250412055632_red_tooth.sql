/*
  # Add WhatsApp Provider

  1. New Provider
    - Adds WhatsApp (via Twilio) as a new messaging provider
    - Configures required credentials and validation rules
    - Sets up template message support

  2. Configuration
    - Required: Account SID, Auth Token, WhatsApp Number
    - Optional: Template SID
    - Includes validation rules for all fields
*/

INSERT INTO gateway_providers (name, code, config_schema, is_active)
VALUES (
  'WhatsApp (Twilio)',
  'whatsapp_twilio',
  '{
    "required": [
      "account_sid",
      "auth_token",
      "whatsapp_number"
    ],
    "optional": [
      "template_sid"
    ],
    "validation": {
      "account_sid": {
        "pattern": "^AC[0-9a-fA-F]{32}$",
        "message": "Invalid Account SID format"
      },
      "auth_token": {
        "pattern": "^[0-9a-fA-F]{32}$",
        "message": "Invalid Auth Token format"
      },
      "whatsapp_number": {
        "pattern": "^\\+[1-9]\\d{1,14}$",
        "message": "Invalid WhatsApp number format. Must start with + and contain only digits"
      },
      "template_sid": {
        "pattern": "^H[0-9a-fA-F]{32}$",
        "message": "Invalid Template SID format"
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (code) DO UPDATE
SET 
  config_schema = EXCLUDED.config_schema,
  is_active = EXCLUDED.is_active;