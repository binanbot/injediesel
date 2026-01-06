-- Create table for received files (arquivos recebidos)
CREATE TABLE public.received_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
  
  -- Vehicle info (can be stored directly if vehicle not in system yet)
  placa TEXT NOT NULL,
  marca TEXT,
  modelo TEXT,
  horas_km TEXT,
  
  -- Service info
  servico TEXT NOT NULL,
  categorias TEXT[] DEFAULT '{}',
  descricao TEXT,
  valor_brl NUMERIC,
  
  -- File info
  arquivo_original_url TEXT,
  arquivo_original_nome TEXT,
  arquivo_modificado_url TEXT,
  arquivo_modificado_nome TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.received_files ENABLE ROW LEVEL SECURITY;

-- Franchisor (admin/suporte) can view all files
CREATE POLICY "Franchisor can view all received files"
ON public.received_files
FOR SELECT
USING (is_franchisor_admin(auth.uid()));

-- Franchisor can manage all files
CREATE POLICY "Franchisor can manage all received files"
ON public.received_files
FOR ALL
USING (is_franchisor_admin(auth.uid()))
WITH CHECK (is_franchisor_admin(auth.uid()));

-- Franchisees can view files from their own unit
CREATE POLICY "Franchisees can view their own unit files"
ON public.received_files
FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()));

-- Franchisees can create files for their own unit
CREATE POLICY "Franchisees can create files for their unit"
ON public.received_files
FOR INSERT
WITH CHECK (unit_id = get_user_unit_id(auth.uid()));

-- Franchisees can update their own unit files
CREATE POLICY "Franchisees can update their own unit files"
ON public.received_files
FOR UPDATE
USING (unit_id = get_user_unit_id(auth.uid()));

-- Create indexes for better performance
CREATE INDEX idx_received_files_unit_id ON public.received_files(unit_id);
CREATE INDEX idx_received_files_status ON public.received_files(status);
CREATE INDEX idx_received_files_created_at ON public.received_files(created_at DESC);
CREATE INDEX idx_received_files_placa ON public.received_files(placa);

-- Create trigger for updated_at
CREATE TRIGGER update_received_files_updated_at
BEFORE UPDATE ON public.received_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.received_files IS 'Arquivos recebidos dos franqueados para processamento';

-- Create storage bucket for files
INSERT INTO storage.buckets (id, name, public) VALUES ('received-files', 'received-files', false);

-- Storage policies for received files
CREATE POLICY "Admins can view all received files"
ON storage.objects FOR SELECT
USING (bucket_id = 'received-files' AND is_franchisor_admin(auth.uid()));

CREATE POLICY "Admins can upload received files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'received-files' AND is_franchisor_admin(auth.uid()));

CREATE POLICY "Admins can update received files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'received-files' AND is_franchisor_admin(auth.uid()));

CREATE POLICY "Admins can delete received files"
ON storage.objects FOR DELETE
USING (bucket_id = 'received-files' AND is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can view their files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'received-files' 
  AND (storage.foldername(name))[1] = get_user_unit_id(auth.uid())::text
);

CREATE POLICY "Franchisees can upload their files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'received-files' 
  AND (storage.foldername(name))[1] = get_user_unit_id(auth.uid())::text
);