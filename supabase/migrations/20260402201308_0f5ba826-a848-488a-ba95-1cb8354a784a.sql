
-- Permission profiles table
CREATE TABLE public.permission_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  permissions jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_system_default boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);

ALTER TABLE public.permission_profiles ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Authenticated can view active profiles"
  ON public.permission_profiles FOR SELECT TO authenticated
  USING (is_active = true AND (company_id IS NULL OR can_access_company(auth.uid(), company_id)));

CREATE POLICY "Company admins can manage own permission profiles"
  ON public.permission_profiles FOR ALL TO authenticated
  USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
  WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

CREATE POLICY "Master can manage permission profiles"
  ON public.permission_profiles FOR ALL TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

-- Link job_positions to default permission profile
ALTER TABLE public.job_positions
  ADD COLUMN default_permission_profile_id uuid REFERENCES public.permission_profiles(id) ON DELETE SET NULL;

-- Link employee_profiles to override permission profile
ALTER TABLE public.employee_profiles
  ADD COLUMN permission_profile_id uuid REFERENCES public.permission_profiles(id) ON DELETE SET NULL;
