/*
  # Update Subscription Plans Schema

  1. Changes
    - Add currency field
    - Add overage_cost field
    - Add features array field
    - Update constraints and validation

  2. Security
    - Maintain existing RLS policies
*/

-- Add new columns to subscription_plans table
ALTER TABLE subscription_plans
ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'SEK')),
ADD COLUMN IF NOT EXISTS overage_cost decimal(10,3),
ADD COLUMN IF NOT EXISTS features text[] NOT NULL DEFAULT '{}';

-- Add constraint for overage_cost
ALTER TABLE subscription_plans
ADD CONSTRAINT subscription_plans_overage_cost_check CHECK (overage_cost >= 0);