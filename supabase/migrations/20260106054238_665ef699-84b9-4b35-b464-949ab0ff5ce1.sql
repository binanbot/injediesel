-- Create table for file status change history (audit log)
CREATE TABLE public.file_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arquivo_id TEXT NOT NULL,
  status_anterior TEXT,
  status_novo TEXT NOT NULL,
  alterado_por UUID NOT NULL,
  observacao TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.file_status_history ENABLE ROW LEVEL SECURITY;

-- Admins and support can view all status history
CREATE POLICY "Admins can view all file status history"
ON public.file_status_history
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'suporte'::app_role));

-- Admins and support can insert status history
CREATE POLICY "Admins can insert file status history"
ON public.file_status_history
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'suporte'::app_role));

-- Create index for faster queries by arquivo_id
CREATE INDEX idx_file_status_history_arquivo_id ON public.file_status_history(arquivo_id);

-- Create index for faster queries by date
CREATE INDEX idx_file_status_history_created_at ON public.file_status_history(created_at DESC);

-- Add comment to the table
COMMENT ON TABLE public.file_status_history IS 'Histórico de alterações de status de arquivos para auditoria';