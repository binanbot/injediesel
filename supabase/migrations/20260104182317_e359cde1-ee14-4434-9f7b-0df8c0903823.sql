-- Criar função para atualizar updated_at (se não existir)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Criar tabela de perfis de franqueados com data de vencimento do contrato
CREATE TABLE public.franchisee_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  telefone TEXT,
  empresa TEXT,
  contract_expiration_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.franchisee_profiles ENABLE ROW LEVEL SECURITY;

-- Franqueados podem ver seu próprio perfil
CREATE POLICY "Franqueados can view their own profile"
ON public.franchisee_profiles
FOR SELECT
USING (auth.uid() = user_id);

-- Franqueados podem atualizar seu próprio perfil
CREATE POLICY "Franqueados can update their own profile"
ON public.franchisee_profiles
FOR UPDATE
USING (auth.uid() = user_id);

-- Admins e suporte podem ver todos os perfis
CREATE POLICY "Admins can view all franchisee profiles"
ON public.franchisee_profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'suporte'));

-- Admins podem atualizar qualquer perfil (incluindo renovação de contrato)
CREATE POLICY "Admins can update all franchisee profiles"
ON public.franchisee_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'suporte'));

-- Admins podem inserir perfis
CREATE POLICY "Admins can insert franchisee profiles"
ON public.franchisee_profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'suporte'));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_franchisee_profiles_updated_at
BEFORE UPDATE ON public.franchisee_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Função para criar perfil automaticamente quando franqueado é registrado
CREATE OR REPLACE FUNCTION public.handle_new_franchisee()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.franchisee_profiles (user_id)
  VALUES (NEW.user_id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger para criar perfil quando role de franqueado é atribuída
CREATE TRIGGER on_franchisee_role_created
AFTER INSERT ON public.user_roles
FOR EACH ROW
WHEN (NEW.role = 'franqueado')
EXECUTE FUNCTION public.handle_new_franchisee();