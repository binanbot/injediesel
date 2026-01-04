-- Add RLS policies for admin/suporte to access all conversations
CREATE POLICY "Admins and support can view all conversations"
ON public.support_conversations
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'suporte'::app_role));

-- Allow admin/suporte to update any conversation
CREATE POLICY "Admins and support can update all conversations"
ON public.support_conversations
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'suporte'::app_role));

-- Add RLS policies for admin/suporte to access all messages
CREATE POLICY "Admins and support can view all messages"
ON public.support_messages
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'suporte'::app_role));

-- Allow admin/suporte to send messages to any conversation
CREATE POLICY "Admins and support can send messages"
ON public.support_messages
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'suporte'::app_role));