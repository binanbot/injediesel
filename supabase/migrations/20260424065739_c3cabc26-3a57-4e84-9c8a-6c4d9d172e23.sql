
DO $$
DECLARE
  _user_id uuid;
BEGIN
  SELECT id INTO _user_id FROM auth.users WHERE email = 'rogeriolimadesigner@gmail.com' LIMIT 1;

  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário rogeriolimadesigner@gmail.com não encontrado';
  END IF;

  UPDATE auth.users
  SET
    encrypted_password = crypt('Franqueado2026!', gen_salt('bf')),
    email_confirmed_at = COALESCE(email_confirmed_at, now()),
    updated_at = now()
  WHERE id = _user_id;

  UPDATE public.profiles_franchisees
  SET requires_password_reset = false, updated_at = now()
  WHERE user_id = _user_id;
END $$;
