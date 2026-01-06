-- Create a default unit for each franchisee that doesn't have one
INSERT INTO public.units (name, franchisee_id, city, state, country, is_active)
SELECT 
  COALESCE(pf.display_name, pf.email) as name,
  pf.id as franchisee_id,
  pf.cidade as city,
  'BR' as state,
  'Brasil' as country,
  true as is_active
FROM public.profiles_franchisees pf
WHERE pf.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.units u WHERE u.franchisee_id = pf.id
  );