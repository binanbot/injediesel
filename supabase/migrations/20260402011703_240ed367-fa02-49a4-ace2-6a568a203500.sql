
-- ============================================
-- RBAC EXPANSION: Update helper functions for new roles
-- ============================================

-- 1. Update is_franchisor_admin to include master_admin and ceo
CREATE OR REPLACE FUNCTION public.is_franchisor_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'suporte', 'master_admin', 'ceo')
  )
$$;

-- 2. Create is_company_admin: checks if user is admin/suporte at company level
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

-- 3. Create is_master_level: checks top-tier access (master_admin + ceo)
CREATE OR REPLACE FUNCTION public.is_master_level(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('master_admin', 'ceo')
  )
$$;

-- 4. Create get_user_role: returns the user's role as text
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;
