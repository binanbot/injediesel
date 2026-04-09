
-- Remove existing policies
DROP POLICY IF EXISTS "Master admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
DROP POLICY IF EXISTS "authenticated insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "authenticated update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "authenticated delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master can select user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master can delete user_roles" ON public.user_roles;

-- Users can view their own role (required for auth flow)
CREATE POLICY "users_view_own_role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Master can view all roles
CREATE POLICY "master_select_all_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_master_level(auth.uid()));

-- Only master can insert roles
CREATE POLICY "master_insert_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (is_master_level(auth.uid()));

-- Only master can update roles
CREATE POLICY "master_update_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (is_master_level(auth.uid()))
WITH CHECK (is_master_level(auth.uid()));

-- Only master can delete roles
CREATE POLICY "master_delete_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_master_level(auth.uid()));
