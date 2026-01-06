-- Adicionar campos de auditoria para busca de placas na tabela received_files
ALTER TABLE public.received_files
ADD COLUMN IF NOT EXISTS plate_lookup_success BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS manual_vehicle_data BOOLEAN DEFAULT NULL,
ADD COLUMN IF NOT EXISTS plate_lookup_payload JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS plate_lookup_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN IF NOT EXISTS plate_lookup_user_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS plate_lookup_unit_id UUID DEFAULT NULL;

-- Criar tabela de cache para consultas de placas
CREATE TABLE IF NOT EXISTS public.plate_lookup_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plate VARCHAR(10) NOT NULL,
  country VARCHAR(2) DEFAULT 'BR',
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(plate, country)
);

-- Índice para busca rápida por placa
CREATE INDEX IF NOT EXISTS idx_plate_lookup_cache_plate ON public.plate_lookup_cache(plate, country);
CREATE INDEX IF NOT EXISTS idx_plate_lookup_cache_expires ON public.plate_lookup_cache(expires_at);

-- Enable RLS (mas permitir leitura/escrita via edge function service_role)
ALTER TABLE public.plate_lookup_cache ENABLE ROW LEVEL SECURITY;

-- Política para franqueados autenticados lerem o cache
CREATE POLICY "Authenticated users can read plate cache"
ON public.plate_lookup_cache
FOR SELECT
TO authenticated
USING (true);

-- Política para inserção via service_role (edge function)
CREATE POLICY "Service role can insert plate cache"
ON public.plate_lookup_cache
FOR INSERT
TO service_role
WITH CHECK (true);

-- Comentários para documentação
COMMENT ON TABLE public.plate_lookup_cache IS 'Cache de consultas de placas da API externa - validade de 7 dias';
COMMENT ON COLUMN public.received_files.plate_lookup_success IS 'Indica se a placa foi encontrada via API';
COMMENT ON COLUMN public.received_files.manual_vehicle_data IS 'Indica se os dados foram inseridos manualmente';
COMMENT ON COLUMN public.received_files.plate_lookup_payload IS 'Payload bruto retornado pela API de placas';
COMMENT ON COLUMN public.received_files.plate_lookup_at IS 'Data/hora da consulta da placa';
COMMENT ON COLUMN public.received_files.plate_lookup_user_id IS 'ID do usuário que fez a consulta';
COMMENT ON COLUMN public.received_files.plate_lookup_unit_id IS 'ID da unidade do franqueado';