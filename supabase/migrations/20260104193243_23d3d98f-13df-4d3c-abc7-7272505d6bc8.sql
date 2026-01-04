-- Create contract_history table
CREATE TABLE public.contract_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franqueado_id UUID NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'Full',
  status TEXT NOT NULL DEFAULT 'expired',
  renewal_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.contract_history ENABLE ROW LEVEL SECURITY;

-- RLS: Franqueados can view their own contract history
CREATE POLICY "Franqueados can view their own contract history"
ON public.contract_history
FOR SELECT
USING (auth.uid() = franqueado_id);

-- RLS: Admins can view all contract history
CREATE POLICY "Admins can view all contract history"
ON public.contract_history
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'suporte'));

-- RLS: Admins can insert contract history
CREATE POLICY "Admins can insert contract history"
ON public.contract_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'suporte'));

-- RLS: Admins can update contract history
CREATE POLICY "Admins can update contract history"
ON public.contract_history
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'suporte'));

-- Create index for faster lookups
CREATE INDEX idx_contract_history_franqueado ON public.contract_history(franqueado_id);
CREATE INDEX idx_contract_history_dates ON public.contract_history(start_date, end_date);