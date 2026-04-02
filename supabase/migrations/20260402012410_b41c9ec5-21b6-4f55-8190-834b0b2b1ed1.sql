
-- 1. Add company_id to user_roles for company-scoped roles
ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);

-- 2. Backfill existing admin/suporte users to Injediesel company
UPDATE public.user_roles
SET company_id = (SELECT id FROM public.companies WHERE slug = 'injediesel' LIMIT 1)
WHERE role IN ('admin', 'suporte')
  AND company_id IS NULL;

-- 3. Create get_user_company_id: resolves company for any role
CREATE OR REPLACE FUNCTION public.get_user_company_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- First try: direct company_id on user_roles (admin_empresa, suporte_empresa, admin, suporte)
  SELECT COALESCE(
    (SELECT ur.company_id FROM public.user_roles ur WHERE ur.user_id = _user_id AND ur.company_id IS NOT NULL LIMIT 1),
    -- Fallback: resolve via unit → company
    (SELECT u.company_id FROM public.units u
     JOIN public.profiles_franchisees pf ON pf.id = u.franchisee_id
     WHERE pf.user_id = _user_id
     LIMIT 1)
  )
$$;

-- 4. is_company_member: checks if user belongs to a specific company
CREATE OR REPLACE FUNCTION public.is_company_member(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (public.get_user_company_id(_user_id) = _company_id)
    OR public.is_master_level(_user_id)
$$;

-- 5. is_same_company: checks if two users belong to the same company
CREATE OR REPLACE FUNCTION public.is_same_company(_user_id_a uuid, _user_id_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.get_user_company_id(_user_id_a) = public.get_user_company_id(_user_id_b)
$$;

-- 6. Update is_company_admin to be company-scoped
CREATE OR REPLACE FUNCTION public.is_company_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'suporte', 'admin_empresa', 'suporte_empresa', 'master_admin', 'ceo')
  )
$$;

-- 7. Specific role checkers
CREATE OR REPLACE FUNCTION public.is_company_support(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('suporte', 'suporte_empresa', 'master_admin', 'ceo')
  )
$$;

CREATE OR REPLACE FUNCTION public.is_ceo(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role = 'ceo'
  )
$$;

-- 8. Helper: get units for a company (useful for RLS)
CREATE OR REPLACE FUNCTION public.get_company_unit_ids(_company_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.units WHERE company_id = _company_id
$$;

-- 9. RLS policy for user_roles: allow master_admin/ceo to manage
CREATE POLICY "Master admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.is_master_level(auth.uid()))
  WITH CHECK (public.is_master_level(auth.uid()));

-- Index for company_id lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_company_id ON public.user_roles(company_id);
