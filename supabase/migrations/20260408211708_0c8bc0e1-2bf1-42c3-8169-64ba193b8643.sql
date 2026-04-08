
-- Create commission_closings table
CREATE TABLE public.commission_closings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_profile_id UUID NOT NULL REFERENCES public.seller_profiles(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  orders_revenue NUMERIC NOT NULL DEFAULT 0,
  files_revenue NUMERIC NOT NULL DEFAULT 0,
  total_revenue NUMERIC NOT NULL DEFAULT 0,
  orders_count INTEGER NOT NULL DEFAULT 0,
  files_count INTEGER NOT NULL DEFAULT 0,
  commission_type TEXT NOT NULL DEFAULT 'percentage',
  commission_value NUMERIC NOT NULL DEFAULT 0,
  estimated_commission NUMERIC NOT NULL DEFAULT 0,
  realized_commission NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'apurada',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(seller_profile_id, period_start, period_end)
);

-- Enable RLS
ALTER TABLE public.commission_closings ENABLE ROW LEVEL SECURITY;

-- Company admins can manage their own company closings
CREATE POLICY "Company admins can manage own closings"
  ON public.commission_closings FOR ALL
  TO authenticated
  USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
  WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

-- Master/CEO can manage all
CREATE POLICY "Master can manage all closings"
  ON public.commission_closings FOR ALL
  TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

-- Sellers can view own closings
CREATE POLICY "Sellers can view own closings"
  ON public.commission_closings FOR SELECT
  TO authenticated
  USING (seller_profile_id IN (
    SELECT sp.id FROM seller_profiles sp
    JOIN employee_profiles ep ON ep.id = sp.employee_profile_id
    WHERE ep.user_id = auth.uid()
  ));

-- Timestamp trigger
CREATE TRIGGER update_commission_closings_updated_at
  BEFORE UPDATE ON public.commission_closings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for common queries
CREATE INDEX idx_commission_closings_seller ON public.commission_closings(seller_profile_id);
CREATE INDEX idx_commission_closings_company_period ON public.commission_closings(company_id, period_start, period_end);
