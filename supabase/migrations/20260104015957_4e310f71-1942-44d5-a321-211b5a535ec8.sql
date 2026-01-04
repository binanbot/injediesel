-- Adicionar coluna conversation_id na tabela correction_tickets
ALTER TABLE public.correction_tickets 
ADD COLUMN conversation_id UUID REFERENCES public.support_conversations(id) ON DELETE SET NULL;