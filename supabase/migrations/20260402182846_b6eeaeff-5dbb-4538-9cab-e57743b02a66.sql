
-- Sales targets table for seller/team/company goals
CREATE TABLE public.sales_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  sale_type text NOT NULL DEFAULT 'total', -- 'ecu', 'parts', 'total'
  metric_key text NOT NULL DEFAULT 'revenue', -- 'revenue', 'quantity', 'orders'
  target_value numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.sales_targets ENABLE ROW LEVEL SECURITY;

-- Master/CEO can manage all
CREATE POLICY "Master can manage sales targets"
  ON public.sales_targets FOR ALL TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

-- Company admins can manage their company targets
CREATE POLICY "Company admins can manage own targets"
  ON public.sales_targets FOR ALL TO authenticated
  USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
  WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

-- Sellers can view their own targets
CREATE POLICY "Sellers can view own targets"
  ON public.sales_targets FOR SELECT TO authenticated
  USING (
    seller_profile_id IN (
      SELECT sp.id FROM public.seller_profiles sp
      JOIN public.employee_profiles ep ON ep.id = sp.employee_profile_id
      WHERE ep.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_sales_targets_seller ON public.sales_targets(seller_profile_id);
CREATE INDEX idx_sales_targets_company ON public.sales_targets(company_id);
CREATE INDEX idx_sales_targets_period ON public.sales_targets(period_start, period_end);
