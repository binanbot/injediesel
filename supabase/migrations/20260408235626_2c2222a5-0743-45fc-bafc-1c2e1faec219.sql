
-- Add new analytical dimensions to financial_entries
ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id),
  ADD COLUMN IF NOT EXISTS unit_id UUID REFERENCES public.units(id),
  ADD COLUMN IF NOT EXISTS employee_profile_id UUID REFERENCES public.employee_profiles(id),
  ADD COLUMN IF NOT EXISTS seller_profile_id UUID REFERENCES public.seller_profiles(id),
  ADD COLUMN IF NOT EXISTS subcategory TEXT,
  ADD COLUMN IF NOT EXISTS cost_center TEXT,
  ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reference_month DATE,
  ADD COLUMN IF NOT EXISTS created_by UUID;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_financial_entries_company ON public.financial_entries(company_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_employee ON public.financial_entries(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_seller ON public.financial_entries(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_financial_entries_category ON public.financial_entries(category);
CREATE INDEX IF NOT EXISTS idx_financial_entries_entry_type ON public.financial_entries(entry_type);
CREATE INDEX IF NOT EXISTS idx_financial_entries_competency ON public.financial_entries(competency_date);
CREATE INDEX IF NOT EXISTS idx_financial_entries_ref_month ON public.financial_entries(reference_month);

-- Add company-scoped RLS policy
CREATE POLICY "Company admins can manage own financial entries"
ON public.financial_entries FOR ALL
TO authenticated
USING (
  company_id IS NOT NULL
  AND can_access_company(auth.uid(), company_id)
  AND is_company_admin(auth.uid())
)
WITH CHECK (
  company_id IS NOT NULL
  AND can_access_company(auth.uid(), company_id)
  AND is_company_admin(auth.uid())
);

-- Master/CEO can manage all
CREATE POLICY "Master can manage all financial entries"
ON public.financial_entries FOR ALL
TO authenticated
USING (is_master_level(auth.uid()))
WITH CHECK (is_master_level(auth.uid()));
