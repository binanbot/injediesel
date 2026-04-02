
-- 1. Departments (company-scoped)
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage departments" ON public.departments
  FOR ALL TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

CREATE POLICY "Company admins can manage own departments" ON public.departments
  FOR ALL TO authenticated
  USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
  WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

CREATE POLICY "Authenticated can view active departments" ON public.departments
  FOR SELECT TO authenticated
  USING (is_active = true AND can_access_company(auth.uid(), company_id));

-- 2. Job positions (company-scoped, linked to department)
CREATE TABLE public.job_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text NOT NULL,
  scope text NOT NULL DEFAULT 'company' CHECK (scope IN ('group', 'company')),
  hierarchy_level int NOT NULL DEFAULT 100,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, slug)
);

ALTER TABLE public.job_positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage positions" ON public.job_positions
  FOR ALL TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

CREATE POLICY "Company admins can manage own positions" ON public.job_positions
  FOR ALL TO authenticated
  USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
  WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

CREATE POLICY "Authenticated can view active positions" ON public.job_positions
  FOR SELECT TO authenticated
  USING (is_active = true AND can_access_company(auth.uid(), company_id));

-- 3. Employee profiles (links user → company + position + department)
CREATE TABLE public.employee_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  job_position_id uuid REFERENCES public.job_positions(id) ON DELETE SET NULL,
  display_name text,
  phone text,
  is_active boolean NOT NULL DEFAULT true,
  hired_at date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id)
);

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage employee profiles" ON public.employee_profiles
  FOR ALL TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

CREATE POLICY "Company admins can manage own employees" ON public.employee_profiles
  FOR ALL TO authenticated
  USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
  WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

CREATE POLICY "Users can view own employee profile" ON public.employee_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 4. Seller profiles (extends employee for commercial rules)
CREATE TABLE public.seller_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_profile_id uuid NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE UNIQUE,
  seller_mode text NOT NULL DEFAULT 'both' CHECK (seller_mode IN ('ecu', 'parts', 'both')),
  commission_type text NOT NULL DEFAULT 'percentage' CHECK (commission_type IN ('percentage', 'fixed', 'tiered')),
  commission_value numeric NOT NULL DEFAULT 0,
  can_sell_ecu boolean NOT NULL DEFAULT true,
  can_sell_parts boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  target_monthly numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Master can manage seller profiles" ON public.seller_profiles
  FOR ALL TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

CREATE POLICY "Company admins can manage sellers via employee" ON public.seller_profiles
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employee_profiles ep
    WHERE ep.id = seller_profiles.employee_profile_id
      AND can_access_company(auth.uid(), ep.company_id)
      AND is_company_admin(auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.employee_profiles ep
    WHERE ep.id = seller_profiles.employee_profile_id
      AND can_access_company(auth.uid(), ep.company_id)
      AND is_company_admin(auth.uid())
  ));

CREATE POLICY "Users can view own seller profile" ON public.seller_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.employee_profiles ep
    WHERE ep.id = seller_profiles.employee_profile_id
      AND ep.user_id = auth.uid()
  ));
