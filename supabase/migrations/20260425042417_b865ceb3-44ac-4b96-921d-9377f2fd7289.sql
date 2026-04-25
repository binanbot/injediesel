UPDATE auth.users
SET 
  encrypted_password = crypt('web1009010@', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email = 'web72web@gmail.com';