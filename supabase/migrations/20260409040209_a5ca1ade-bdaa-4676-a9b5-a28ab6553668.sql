
-- BLOCO 1: user_roles - make SELECT policy use authenticated role instead of public
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;

CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- BLOCO 3: company_domains - restrict authenticated SELECT
DROP POLICY IF EXISTS "Authenticated can read domains" ON public.company_domains;

CREATE POLICY "Authenticated can read own company domains"
ON public.company_domains
FOR SELECT
TO authenticated
USING (
  is_master_level(auth.uid())
  OR can_access_company(auth.uid(), company_id)
  OR is_active = true
);
