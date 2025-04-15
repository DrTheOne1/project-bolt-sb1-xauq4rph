/*
  # Make specific user admin

  This migration updates the role of a specific user to 'admin'.
  
  1. Changes
    - Sets the role to 'admin' for user with email mahran.albaker@gmail.com
    
  2. Security
    - Only affects the specified user
    - Maintains existing RLS policies
*/

DO $$ 
BEGIN
  UPDATE users
  SET role = 'admin'
  WHERE id IN (
    SELECT id 
    FROM auth.users 
    WHERE email = 'mahran.albaker@gmail.com'
  );
END $$;