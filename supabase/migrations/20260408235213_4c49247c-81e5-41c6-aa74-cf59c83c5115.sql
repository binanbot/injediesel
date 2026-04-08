
-- Employee costs table
CREATE TABLE public.employee_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_profile_id UUID NOT NULL REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  cost_type TEXT NOT NULL DEFAULT 'outro',
  cost_category TEXT NOT NULL DEFAULT 'pessoal_fixo',
  label TEXT,
  amount_brl NUMERIC NOT NULL DEFAULT 0,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_until DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Operational costs table
CREATE TABLE public.operational_costs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  cost_category TEXT NOT NULL DEFAULT 'administrativo',
  description TEXT NOT NULL,
  amount_brl NUMERIC NOT NULL DEFAULT 0,
  is_recurring BOOLEAN NOT NULL DEFAULT true,
  competency_month DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_employee_costs_employee ON public.employee_costs(employee_profile_id);
CREATE INDEX idx_employee_costs_company ON public.employee_costs(company_id);
CREATE INDEX idx_employee_costs_type ON public.employee_costs(cost_type);
CREATE INDEX idx_operational_costs_company ON public.operational_costs(company_id);
CREATE INDEX idx_operational_costs_category ON public.operational_costs(cost_category);
CREATE INDEX idx_operational_costs_month ON public.operational_costs(competency_month);

-- RLS
ALTER TABLE public.employee_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operational_costs ENABLE ROW LEVEL SECURITY;

-- Employee costs policies
CREATE POLICY "Company admins can manage own employee costs"
ON public.employee_costs FOR ALL
TO authenticated
USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

CREATE POLICY "Master can manage all employee costs"
ON public.employee_costs FOR ALL
TO authenticated
USING (is_master_level(auth.uid()))
WITH CHECK (is_master_level(auth.uid()));

CREATE POLICY "Employees can view own costs"
ON public.employee_costs FOR SELECT
TO authenticated
USING (employee_profile_id IN (
  SELECT id FROM public.employee_profiles WHERE user_id = auth.uid()
));

-- Operational costs policies
CREATE POLICY "Company admins can manage own operational costs"
ON public.operational_costs FOR ALL
TO authenticated
USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

CREATE POLICY "Master can manage all operational costs"
ON public.operational_costs FOR ALL
TO authenticated
USING (is_master_level(auth.uid()))
WITH CHECK (is_master_level(auth.uid()));

-- Updated_at triggers
CREATE TRIGGER update_employee_costs_updated_at
BEFORE UPDATE ON public.employee_costs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_operational_costs_updated_at
BEFORE UPDATE ON public.operational_costs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
