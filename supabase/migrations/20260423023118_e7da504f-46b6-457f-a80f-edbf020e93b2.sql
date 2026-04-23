-- 1. Add adminco to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'adminco';

-- 2. Create company_modules table
CREATE TABLE IF NOT EXISTS public.company_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    module_key TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(company_id, module_key)
);

-- Enable RLS on company_modules
ALTER TABLE public.company_modules ENABLE ROW LEVEL SECURITY;

-- 3. Add company_id to core tables if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'company_id') THEN
        ALTER TABLE public.orders ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customers' AND column_name = 'company_id') THEN
        ALTER TABLE public.customers ADD COLUMN company_id UUID REFERENCES public.companies(id);
    END IF;
END $$;

-- 4. Helper functions for RLS
CREATE OR REPLACE FUNCTION public.is_global_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() 
        AND role IN ('master_admin', 'adminco', 'ceo')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
BEGIN
    RETURN (SELECT company_id FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS Policies for Companies
-- Ensure RLS is enabled
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global admins can view all companies" ON public.companies;
CREATE POLICY "Global admins can view all companies" ON public.companies
    FOR SELECT USING (is_global_admin());

DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (id = get_user_company_id());

-- 6. RLS Policies for Company Domains
ALTER TABLE public.company_domains ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Global admins can manage domains" ON public.company_domains;
CREATE POLICY "Global admins can manage domains" ON public.company_domains
    FOR ALL USING (is_global_admin());

DROP POLICY IF EXISTS "Users can view their company domains" ON public.company_domains;
CREATE POLICY "Users can view their company domains" ON public.company_domains
    FOR SELECT USING (company_id = get_user_company_id());

-- 7. RLS Policies for Company Modules
DROP POLICY IF EXISTS "Global admins can manage modules" ON public.company_modules;
CREATE POLICY "Global admins can manage modules" ON public.company_modules
    FOR ALL USING (is_global_admin());

DROP POLICY IF EXISTS "Users can view their company modules" ON public.company_modules;
CREATE POLICY "Users can view their company modules" ON public.company_modules
    FOR SELECT USING (company_id = get_user_company_id());

-- 8. Seed 3 companies (if they don't exist)
INSERT INTO public.companies (id, name, slug, trade_name, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'Empresa Alfa', 'alfa', 'Alfa Tech', true),
    ('22222222-2222-2222-2222-222222222222', 'Empresa Beta', 'beta', 'Beta Solutions', true),
    ('33333333-3333-3333-3333-333333333333', 'Empresa Gama', 'gama', 'Gama Group', true)
ON CONFLICT (id) DO NOTHING;

-- Seed domains for them
INSERT INTO public.company_domains (company_id, hostname, is_primary, environment, is_active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'alfa.localhost', true, 'development', true),
    ('22222222-2222-2222-2222-222222222222', 'beta.localhost', true, 'development', true),
    ('33333333-3333-3333-3333-333333333333', 'gama.localhost', true, 'development', true)
ON CONFLICT DO NOTHING;
