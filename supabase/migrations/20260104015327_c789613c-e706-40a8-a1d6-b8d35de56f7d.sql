-- Criar tabela de tickets de correção
CREATE TABLE public.correction_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  arquivo_id TEXT NOT NULL,
  franqueado_id UUID NOT NULL,
  motivo TEXT NOT NULL,
  arquivo_anexo_url TEXT,
  status TEXT NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.correction_tickets ENABLE ROW LEVEL SECURITY;

-- Políticas para franqueados
CREATE POLICY "Franqueados can create their own correction tickets"
ON public.correction_tickets
FOR INSERT
WITH CHECK (auth.uid() = franqueado_id);

CREATE POLICY "Franqueados can view their own correction tickets"
ON public.correction_tickets
FOR SELECT
USING (auth.uid() = franqueado_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_correction_tickets_updated_at
BEFORE UPDATE ON public.correction_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_support_conversation_updated_at();

-- Criar bucket para arquivos de correção
INSERT INTO storage.buckets (id, name, public)
VALUES ('correction-files', 'correction-files', false);

-- Políticas de storage para franqueados
CREATE POLICY "Franqueados can upload correction files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'correction-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Franqueados can view their own correction files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'correction-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Franqueados can delete their own correction files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'correction-files' AND auth.uid()::text = (storage.foldername(name))[1]);