
DROP VIEW IF EXISTS public.profiles_franchisees_safe;

CREATE VIEW public.profiles_franchisees_safe
WITH (security_invoker = true)
AS
SELECT
  id, user_id, email, display_name, first_name, last_name,
  phone, cpf, cnpj, cidade, state, district, street,
  address_number, complement, zip_code, delivery_address,
  service_areas, contract_expiration_date, contract_type,
  equipment_type, kess_serial, kess_expires_at, ktag_serial, ktag_expires_at,
  is_prepaid, rental_value_brl, start_date,
  allow_manual_credits, requires_password_reset,
  created_at, updated_at
FROM public.profiles_franchisees;
