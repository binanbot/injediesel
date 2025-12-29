-- Create table for support chat conversations
CREATE TABLE public.support_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  franqueado_id UUID NOT NULL,
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chat messages
CREATE TABLE public.support_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.support_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('franqueado', 'suporte')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.support_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversations
CREATE POLICY "Franqueados can view their own conversations"
ON public.support_conversations
FOR SELECT
USING (auth.uid() = franqueado_id);

CREATE POLICY "Franqueados can create their own conversations"
ON public.support_conversations
FOR INSERT
WITH CHECK (auth.uid() = franqueado_id);

CREATE POLICY "Franqueados can update their own conversations"
ON public.support_conversations
FOR UPDATE
USING (auth.uid() = franqueado_id);

-- RLS Policies for messages
CREATE POLICY "Users can view messages in their conversations"
ON public.support_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = conversation_id
    AND (franqueado_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.support_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.support_conversations
    WHERE id = conversation_id
    AND (franqueado_id = auth.uid())
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_messages;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_support_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.support_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates on new messages
CREATE TRIGGER update_conversation_on_message
AFTER INSERT ON public.support_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_support_conversation_updated_at();