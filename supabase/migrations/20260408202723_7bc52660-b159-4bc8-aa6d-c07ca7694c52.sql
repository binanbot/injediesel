
-- Create audit_logs table (append-only)
CREATE TABLE public.audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id),
  user_id uuid NOT NULL,
  user_email text,
  action text NOT NULL,
  module text NOT NULL,
  target_type text,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can INSERT audit events
CREATE POLICY "Authenticated can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Company admins can view their own company logs
CREATE POLICY "Company admins can view own audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (
    can_access_company(auth.uid(), company_id)
    AND is_company_admin(auth.uid())
  );

-- Master/CEO can view all audit logs
CREATE POLICY "Master can view all audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (is_master_level(auth.uid()));

-- Indexes for filtering
CREATE INDEX idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_module ON public.audit_logs(module);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);
