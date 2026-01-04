-- Criar enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'suporte', 'franqueado');

-- Criar tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Função para verificar role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Políticas para user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Políticas para admins visualizarem tickets de correção
CREATE POLICY "Admins can view all correction tickets"
ON public.correction_tickets
FOR SELECT
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'suporte'));

CREATE POLICY "Admins can update correction tickets"
ON public.correction_tickets
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'suporte'));

-- Políticas de storage para admins
CREATE POLICY "Admins can view all correction files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'correction-files' 
  AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'suporte'))
);