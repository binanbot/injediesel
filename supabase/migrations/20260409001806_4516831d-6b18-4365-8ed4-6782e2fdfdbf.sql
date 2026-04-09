
-- Bloco 1: Endurecimento financeiro

-- Adicionar colunas de status e aprovação em financial_entries
ALTER TABLE public.financial_entries
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'lancado',
  ADD COLUMN IF NOT EXISTS approved_by uuid NULL,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS attachment_url text NULL;

-- Criar tabela de fechamento mensal
CREATE TABLE IF NOT EXISTS public.financial_closing_periods (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  reference_month date NOT NULL,
  status text NOT NULL DEFAULT 'aberto',
  closed_by uuid NULL,
  closed_at timestamptz NULL,
  notes text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, reference_month)
);

ALTER TABLE public.financial_closing_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Company admins can manage own closing periods"
  ON public.financial_closing_periods FOR ALL
  TO authenticated
  USING (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()))
  WITH CHECK (can_access_company(auth.uid(), company_id) AND is_company_admin(auth.uid()));

CREATE POLICY "Master can manage all closing periods"
  ON public.financial_closing_periods FOR ALL
  TO authenticated
  USING (is_master_level(auth.uid()))
  WITH CHECK (is_master_level(auth.uid()));

-- Bloco 2: CRM operacional

-- Adicionar prioridade e due_date em crm_activities
ALTER TABLE public.crm_activities
  ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS due_date timestamptz NULL,
  ADD COLUMN IF NOT EXISTS reminder_at timestamptz NULL;

-- Adicionar wallet_status em customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS wallet_status text NOT NULL DEFAULT 'ativa';
