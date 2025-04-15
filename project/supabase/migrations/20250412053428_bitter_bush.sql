/*
  # Add MessageBird Provider

  1. New Provider
    - Adds MessageBird as a new SMS gateway provider
    - Configures required credentials and validation rules
    - Sets up optional parameters

  2. Configuration
    - Required: API Key, Originator
    - Optional: Fallback URL, Report URL
    - Includes validation rules for all fields
*/

INSERT INTO gateway_providers (name, code, config_schema, is_active)
VALUES (
  'MessageBird',
  'messagebird',
  '{
    "required": [
      "api_key",
      "originator"
    ],
    "optional": [
      "fallback_url",
      "report_url"
    ],
    "validation": {
      "api_key": {
        "pattern": "^[A-Za-z0-9]{25}$",
        "message": "Invalid API Key format"
      },
      "originator": {
        "pattern": "^[A-Za-z0-9]{1,11}$",
        "message": "Originator must be alphanumeric and max 11 characters"
      }
    }
  }'::jsonb,
  true
)
ON CONFLICT (code) DO UPDATE
SET 
  config_schema = EXCLUDED.config_schema,
  is_active = EXCLUDED.is_active;