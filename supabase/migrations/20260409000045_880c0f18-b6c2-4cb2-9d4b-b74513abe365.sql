
-- CRM Activities
CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  seller_profile_id UUID REFERENCES public.seller_profiles(id),
  opportunity_id UUID,
  activity_type TEXT NOT NULL DEFAULT 'contato',
  channel TEXT,
  summary TEXT,
  scheduled_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_crm_activities_company ON public.crm_activities(company_id);
CREATE INDEX idx_crm_activities_customer ON public.crm_activities(customer_id);
CREATE INDEX idx_crm_activities_seller ON public.crm_activities(seller_profile_id);
CREATE INDEX idx_crm_activities_status ON public.crm_activities(status);
CREATE INDEX idx_crm_activities_scheduled ON public.crm_activities(scheduled_at);

-- CRM Opportunities
CREATE TABLE public.crm_opportunities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id),
  customer_id UUID NOT NULL REFERENCES public.customers(id),
  seller_profile_id UUID REFERENCES public.seller_profiles(id),
  title TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'lead',
  estimated_value NUMERIC NOT NULL DEFAULT 0,
  sale_channel TEXT,
  order_id UUID REFERENCES public.orders(id),
  file_id UUID REFERENCES public.received_files(id),
  lost_reason TEXT,
  notes TEXT,
  closed_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_opportunities ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_crm_opportunities_company ON public.crm_opportunities(company_id);
CREATE INDEX idx_crm_opportunities_customer ON public.crm_opportunities(customer_id);
CREATE INDEX idx_crm_opportunities_seller ON public.crm_opportunities(seller_profile_id);
CREATE INDEX idx_crm_opportunities_stage ON public.crm_opportunities(stage);

-- FK from activities to opportunities
ALTER TABLE public.crm_activities
  ADD CONSTRAINT crm_activities_opportunity_id_fkey
  FOREIGN KEY (opportunity_id) REFERENCES public.crm_opportunities(id);

-- RLS: crm_activities
CREATE POLICY "Company admins manage own crm_activities"
  ON public.crm_activities FOR ALL TO authenticated
  USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
  WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

CREATE POLICY "Master manage all crm_activities"
  ON public.crm_activities FOR ALL TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

CREATE POLICY "Sellers view own crm_activities"
  ON public.crm_activities FOR SELECT TO authenticated
  USING (seller_profile_id IN (
    SELECT sp.id FROM seller_profiles sp
    JOIN employee_profiles ep ON ep.id = sp.employee_profile_id
    WHERE ep.user_id = auth.uid()
  ));

CREATE POLICY "Sellers manage own crm_activities"
  ON public.crm_activities FOR INSERT TO authenticated
  WITH CHECK (seller_profile_id IN (
    SELECT sp.id FROM seller_profiles sp
    JOIN employee_profiles ep ON ep.id = sp.employee_profile_id
    WHERE ep.user_id = auth.uid()
  ));

CREATE POLICY "Sellers update own crm_activities"
  ON public.crm_activities FOR UPDATE TO authenticated
  USING (seller_profile_id IN (
    SELECT sp.id FROM seller_profiles sp
    JOIN employee_profiles ep ON ep.id = sp.employee_profile_id
    WHERE ep.user_id = auth.uid()
  ));

-- RLS: crm_opportunities
CREATE POLICY "Company admins manage own crm_opportunities"
  ON public.crm_opportunities FOR ALL TO authenticated
  USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
  WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

CREATE POLICY "Master manage all crm_opportunities"
  ON public.crm_opportunities FOR ALL TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

CREATE POLICY "Sellers view own crm_opportunities"
  ON public.crm_opportunities FOR SELECT TO authenticated
  USING (seller_profile_id IN (
    SELECT sp.id FROM seller_profiles sp
    JOIN employee_profiles ep ON ep.id = sp.employee_profile_id
    WHERE ep.user_id = auth.uid()
  ));

CREATE POLICY "Sellers manage own crm_opportunities"
  ON public.crm_opportunities FOR INSERT TO authenticated
  WITH CHECK (seller_profile_id IN (
    SELECT sp.id FROM seller_profiles sp
    JOIN employee_profiles ep ON ep.id = sp.employee_profile_id
    WHERE ep.user_id = auth.uid()
  ));

CREATE POLICY "Sellers update own crm_opportunities"
  ON public.crm_opportunities FOR UPDATE TO authenticated
  USING (seller_profile_id IN (
    SELECT sp.id FROM seller_profiles sp
    JOIN employee_profiles ep ON ep.id = sp.employee_profile_id
    WHERE ep.user_id = auth.uid()
  ));

-- Triggers for updated_at
CREATE TRIGGER update_crm_activities_updated_at
  BEFORE UPDATE ON public.crm_activities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_opportunities_updated_at
  BEFORE UPDATE ON public.crm_opportunities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
