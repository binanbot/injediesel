-- Replace function with hardened version (same return type, tighter access)
CREATE OR REPLACE FUNCTION public.get_company_by_hostname(_hostname text)
 RETURNS jsonb
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'id', c.id,
    'slug', c.slug,
    'name', c.name,
    'trade_name', c.trade_name,
    'brand_name', c.brand_name,
    'cnpj', c.cnpj,
    'branding', c.branding,
    'settings', c.settings,
    'enabled_modules', c.enabled_modules,
    'contacts', c.contacts,
    'channel_type', cd.channel_type
  )
  FROM public.companies c
  JOIN public.company_domains cd ON cd.company_id = c.id
  WHERE lower(cd.hostname) = lower(_hostname)
    AND cd.is_active = true
    AND c.is_active = true
  LIMIT 1
$$;

-- Revoke broad access, grant only to needed roles
REVOKE ALL ON FUNCTION public.get_company_by_hostname(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_company_by_hostname(text) TO anon, authenticated;