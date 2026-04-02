CREATE OR REPLACE FUNCTION public.can_access_franchisee_profile(_user_id uuid, _profile_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _user_id IS NOT NULL
    AND (
      public.is_master_level(_user_id)
      OR public.has_role(_user_id, 'admin')
      OR public.has_role(_user_id, 'suporte')
      OR EXISTS (
        SELECT 1
        FROM public.profiles_franchisees pf
        WHERE pf.id = _profile_id
          AND pf.user_id = _user_id
      )
      OR EXISTS (
        SELECT 1
        FROM public.units u
        WHERE u.franchisee_id = _profile_id
          AND u.company_id IS NOT NULL
          AND public.can_access_company(_user_id, u.company_id)
      )
    )
$$;

DROP POLICY IF EXISTS "Company+ profiles" ON public.profiles_franchisees;
DROP POLICY IF EXISTS "Own profile" ON public.profiles_franchisees;

CREATE POLICY "Users can view accessible franchisee profiles"
ON public.profiles_franchisees
FOR SELECT
TO authenticated
USING (public.can_access_franchisee_profile(auth.uid(), id));

CREATE POLICY "Users can update accessible franchisee profiles"
ON public.profiles_franchisees
FOR UPDATE
TO authenticated
USING (public.can_access_franchisee_profile(auth.uid(), id))
WITH CHECK (
  auth.uid() = user_id
  OR public.is_master_level(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'suporte')
  OR public.can_access_franchisee_profile(auth.uid(), id)
);

CREATE POLICY "Global admins can create franchisee profiles"
ON public.profiles_franchisees
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_master_level(auth.uid())
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'suporte')
);