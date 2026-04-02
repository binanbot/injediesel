
CREATE TABLE public.executive_goals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  metric_key TEXT NOT NULL,
  target_value NUMERIC NOT NULL DEFAULT 0,
  objective_label TEXT NOT NULL DEFAULT 'Geral',
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.executive_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CEO and master can manage goals"
  ON public.executive_goals
  FOR ALL
  TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

CREATE POLICY "Company admins can view their goals"
  ON public.executive_goals
  FOR SELECT
  TO authenticated
  USING (
    company_id IS NULL
    OR can_access_company(auth.uid(), company_id)
  );
