-- 1) Ensure RLS is enabled
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 2) Drop ALL existing policies (clean slate)
DROP POLICY IF EXISTS "Public can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated can delete user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "users_view_own_role" ON public.user_roles;
DROP POLICY IF EXISTS "master_select_all_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master_insert_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master_update_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master_delete_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master can read user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master can insert user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master can update user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "master can delete user_roles" ON public.user_roles;

-- 3) SELECT: user can read own role (required for auth/login flow)
CREATE POLICY "users_view_own_role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- 4) SELECT: master can read all roles
CREATE POLICY "master_select_all_roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (is_master_level(auth.uid()));

-- 5) INSERT: only master
CREATE POLICY "master_insert_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (is_master_level(auth.uid()));

-- 6) UPDATE: only master
CREATE POLICY "master_update_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (is_master_level(auth.uid()))
WITH CHECK (is_master_level(auth.uid()));

-- 7) DELETE: only master
CREATE POLICY "master_delete_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (is_master_level(auth.uid()));