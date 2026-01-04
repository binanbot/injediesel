-- Criar tabela profiles_franchisees com todos os campos do CSV
CREATE TABLE IF NOT EXISTS public.profiles_franchisees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  display_name text,
  first_name text,
  last_name text,
  cpf text,
  cnpj text,
  start_date date,
  equipment_type text,
  is_prepaid boolean DEFAULT false,
  rental_value_brl numeric,
  allow_manual_credits boolean DEFAULT false,
  kess_serial text,
  kess_expires_at date,
  ktag_serial text,
  ktag_expires_at date,
  legacy_user_login text,
  legacy_source_user_id text UNIQUE,
  legacy_role text,
  legacy_user_registered_at text,
  legacy_user_pass_hash text,
  requires_password_reset boolean DEFAULT true,
  contract_type text DEFAULT 'Full',
  contract_expiration_date date DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_profiles_franchisees_email ON public.profiles_franchisees(email);
CREATE INDEX IF NOT EXISTS idx_profiles_franchisees_user_id ON public.profiles_franchisees(user_id);

-- Habilitar RLS
ALTER TABLE public.profiles_franchisees ENABLE ROW LEVEL SECURITY;

-- Política: Franqueados podem ver apenas seu próprio perfil
CREATE POLICY "Franqueados can view their own profile"
ON public.profiles_franchisees
FOR SELECT
USING (auth.uid() = user_id);

-- Política: Franqueados podem atualizar campos básicos do próprio perfil
CREATE POLICY "Franqueados can update basic info"
ON public.profiles_franchisees
FOR UPDATE
USING (auth.uid() = user_id);

-- Política: Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles_franchisees
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'suporte'::app_role));

-- Política: Admins podem inserir perfis
CREATE POLICY "Admins can insert profiles"
ON public.profiles_franchisees
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'suporte'::app_role));

-- Política: Admins podem atualizar qualquer perfil
CREATE POLICY "Admins can update all profiles"
ON public.profiles_franchisees
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'suporte'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_profiles_franchisees_updated_at
BEFORE UPDATE ON public.profiles_franchisees
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();