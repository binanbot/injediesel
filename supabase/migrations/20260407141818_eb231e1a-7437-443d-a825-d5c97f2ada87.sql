
-- Add channel_type to company_domains
ALTER TABLE public.company_domains
ADD COLUMN channel_type text NOT NULL DEFAULT 'public';

-- Add comment for documentation
COMMENT ON COLUMN public.company_domains.channel_type IS 'Type of channel: public, app, admin, ceo_global, master_global';

-- Update the RPC to return channel_type
CREATE OR REPLACE FUNCTION public.get_company_by_hostname(_hostname text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
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
  WHERE cd.hostname = _hostname
    AND cd.is_active = true
    AND c.is_active = true
  LIMIT 1
$$;
