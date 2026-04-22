-- Update the hostname resolution function to handle 'www.' automatically
CREATE OR REPLACE FUNCTION public.get_company_by_hostname(_hostname text)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
    clean_hostname text;
    result jsonb;
BEGIN
    -- Remove 'www.' prefix if present for matching
    clean_hostname := CASE 
        WHEN lower(_hostname) LIKE 'www.%' THEN substr(lower(_hostname), 5)
        ELSE lower(_hostname)
    END;

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
    ) INTO result
    FROM public.companies c
    JOIN public.company_domains cd ON cd.company_id = c.id
    WHERE (lower(cd.hostname) = lower(_hostname) OR lower(cd.hostname) = clean_hostname)
      AND cd.is_active = true
      AND c.is_active = true
    ORDER BY cd.is_primary DESC
    LIMIT 1;

    RETURN result;
END;
$$;

-- Add 'www.' domains for existing production domains
INSERT INTO public.company_domains (company_id, hostname, channel_type, environment, is_active, is_primary)
SELECT company_id, 'www.' || hostname, channel_type, environment, is_active, false
FROM public.company_domains
WHERE environment = 'production' 
  AND hostname NOT LIKE 'www.%'
  AND hostname NOT LIKE '%.lovable.app'
ON CONFLICT (hostname) DO NOTHING;

-- Ensure RLS on companies allows viewing active companies for all
DROP POLICY IF EXISTS "Anon can view active companies" ON public.companies;
CREATE POLICY "Public can view active companies" 
ON public.companies 
FOR SELECT 
USING (is_active = true);
