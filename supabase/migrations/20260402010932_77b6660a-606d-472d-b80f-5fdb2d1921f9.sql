
-- Tabela companies
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  trade_name text,
  cnpj text,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabled_modules text[] NOT NULL DEFAULT ARRAY[
    'dashboard','enviar','arquivos','clientes','loja','pedidos',
    'suporte','mensagens','relatorios','tutoriais','cursos','materiais','atualizacoes'
  ],
  contacts jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Tabela company_domains
CREATE TABLE public.company_domains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  hostname text NOT NULL UNIQUE,
  is_primary boolean NOT NULL DEFAULT false,
  environment text NOT NULL DEFAULT 'production',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_company_domains_hostname ON public.company_domains(hostname);
CREATE INDEX idx_company_domains_company_id ON public.company_domains(company_id);

-- company_id em units e products
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_units_company_id ON public.units(company_id);

ALTER TABLE public.products ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
CREATE INDEX IF NOT EXISTS idx_products_company_id ON public.products(company_id);

-- RLS companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view active companies"
  ON public.companies FOR SELECT TO authenticated
  USING (is_active = true);

CREATE POLICY "Master admins can manage companies"
  ON public.companies FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master_admin') OR has_role(auth.uid(), 'ceo'))
  WITH CHECK (has_role(auth.uid(), 'master_admin') OR has_role(auth.uid(), 'ceo'));

-- RLS company_domains
ALTER TABLE public.company_domains ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read domains"
  ON public.company_domains FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Master admins can manage domains"
  ON public.company_domains FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'master_admin') OR has_role(auth.uid(), 'ceo'))
  WITH CHECK (has_role(auth.uid(), 'master_admin') OR has_role(auth.uid(), 'ceo'));

-- Função resolver company por hostname
CREATE OR REPLACE FUNCTION public.get_company_by_hostname(_hostname text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', c.id,
    'slug', c.slug,
    'name', c.name,
    'trade_name', c.trade_name,
    'branding', c.branding,
    'enabled_modules', c.enabled_modules,
    'contacts', c.contacts
  )
  FROM public.companies c
  JOIN public.company_domains cd ON cd.company_id = c.id
  WHERE cd.hostname = _hostname
    AND c.is_active = true
  LIMIT 1
$$;

-- Trigger updated_at
CREATE TRIGGER trg_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill Injediesel
DO $$
DECLARE
  _company_id uuid;
BEGIN
  INSERT INTO public.companies (slug, name, trade_name, branding, contacts)
  VALUES (
    'injediesel',
    'Injediesel PowerChip',
    'Injediesel',
    jsonb_build_object(
      'logo_url', '/assets/logo-injediesel.svg',
      'favicon_url', '/favicon.ico',
      'platform_name', 'Injediesel PowerChip',
      'store_name', 'PROMAX Store',
      'primary_color', '217 91% 60%',
      'secondary_color', '222 47% 11%',
      'accent_color', '199 89% 48%'
    ),
    jsonb_build_object(
      'whatsapp', '',
      'email', '',
      'instagram', '',
      'website', ''
    )
  )
  RETURNING id INTO _company_id;

  INSERT INTO public.company_domains (company_id, hostname, is_primary, environment) VALUES
    (_company_id, 'injediesel.lovable.app', true, 'production'),
    (_company_id, 'localhost', false, 'development'),
    (_company_id, 'id-preview--d18eeae5-09bb-4db1-a12e-5bc75eb2aeb8.lovable.app', false, 'preview');

  UPDATE public.units SET company_id = _company_id WHERE company_id IS NULL;
  UPDATE public.products SET company_id = _company_id WHERE company_id IS NULL;
END $$;
