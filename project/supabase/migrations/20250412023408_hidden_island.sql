/*
  # Update User Role to Admin

  1. Changes
    - Updates the specified user's role to 'admin'
    
  2. Security
    - No changes to RLS policies
    - Maintains existing security rules
*/

DO $$ 
BEGIN
  UPDATE users
  SET role = 'admin'
  WHERE id = auth.uid();
END $$;