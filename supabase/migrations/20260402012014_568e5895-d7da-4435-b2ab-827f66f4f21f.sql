
-- Add missing columns to companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS brand_name text,
  ADD COLUMN IF NOT EXISTS settings jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Add is_active to company_domains
ALTER TABLE public.company_domains
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- Update existing Injediesel company with new fields
UPDATE public.companies
SET brand_name = 'Injediesel PowerChip',
    settings = jsonb_build_object(
      'currency', 'BRL',
      'locale', 'pt-BR',
      'timezone', 'America/Sao_Paulo'
    )
WHERE slug = 'injediesel';

-- Update get_company_by_hostname to include new fields and check domain active
CREATE OR REPLACE FUNCTION public.get_company_by_hostname(_hostname text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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
    'contacts', c.contacts
  )
  FROM public.companies c
  JOIN public.company_domains cd ON cd.company_id = c.id
  WHERE cd.hostname = _hostname
    AND cd.is_active = true
    AND c.is_active = true
  LIMIT 1
$$;
