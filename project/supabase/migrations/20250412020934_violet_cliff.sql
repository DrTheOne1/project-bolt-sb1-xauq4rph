/*
  # Create user trigger

  1. Changes
    - Create function to handle user creation
    - Create trigger to automatically create user record
    
  2. Details
    - Creates a new user record in public.users table when a user signs up
    - Sets default values:
      - role = 'user'
      - credits = 0
    - Uses the auth.users id as the user id
*/

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, credits)
  VALUES (new.id, new.email, 'user', 0);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();