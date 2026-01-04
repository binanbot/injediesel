-- Tabela de unidades (franquias)
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  franchisee_id uuid REFERENCES public.profiles_franchisees(id) ON DELETE CASCADE,
  name text NOT NULL,
  city text,
  state text,
  country text DEFAULT 'BR',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de clientes
CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
  full_name text NOT NULL,
  cpf text,
  cnpj text,
  email text,
  phone text,
  address_line text,
  address_city text,
  address_state text,
  address_country text DEFAULT 'BR',
  active_city text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customers_unit_id ON public.customers(unit_id);
CREATE INDEX IF NOT EXISTS idx_customers_cpf ON public.customers(cpf);
CREATE INDEX IF NOT EXISTS idx_customers_cnpj ON public.customers(cnpj);
CREATE INDEX IF NOT EXISTS idx_customers_full_name ON public.customers(full_name);

-- Tabela de veículos
CREATE TABLE IF NOT EXISTS public.vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  plate text,
  brand text,
  model text,
  year text,
  category text,
  engine text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_unit_id ON public.vehicles(unit_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON public.vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);

-- Tabela de serviços
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid NOT NULL REFERENCES public.units(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  vehicle_id uuid REFERENCES public.vehicles(id) ON DELETE SET NULL,
  service_type text NOT NULL,
  protocol text,
  status text DEFAULT 'pending',
  amount_brl numeric,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_services_unit_id ON public.services(unit_id);
CREATE INDEX IF NOT EXISTS idx_services_customer_id ON public.services(customer_id);
CREATE INDEX IF NOT EXISTS idx_services_protocol ON public.services(protocol);

-- Tabela de log de exportações (LGPD)
CREATE TABLE IF NOT EXISTS public.exports_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by_user_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id),
  export_type text NOT NULL,
  filters_used jsonb,
  accepted_privacy_terms boolean NOT NULL,
  accepted_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_exports_log_user_id ON public.exports_log(requested_by_user_id);
CREATE INDEX IF NOT EXISTS idx_exports_log_unit_id ON public.exports_log(unit_id);

-- Função helper para obter unit_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_unit_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.id 
  FROM public.units u
  JOIN public.profiles_franchisees pf ON pf.id = u.franchisee_id
  WHERE pf.user_id = _user_id
  LIMIT 1
$$;

-- Função para verificar se é admin/suporte (franqueadora)
CREATE OR REPLACE FUNCTION public.is_franchisor_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id
    AND role IN ('admin', 'suporte')
  )
$$;

-- RLS para units
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchisor can view all units" ON public.units
FOR SELECT USING (public.is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can view their own unit" ON public.units
FOR SELECT USING (
  franchisee_id IN (SELECT id FROM public.profiles_franchisees WHERE user_id = auth.uid())
);

CREATE POLICY "Franchisor can manage units" ON public.units
FOR ALL USING (public.is_franchisor_admin(auth.uid()))
WITH CHECK (public.is_franchisor_admin(auth.uid()));

-- RLS para customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchisor can view all customers" ON public.customers
FOR SELECT USING (public.is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can view their own customers" ON public.customers
FOR SELECT USING (unit_id = public.get_user_unit_id(auth.uid()));

CREATE POLICY "Franchisor can manage all customers" ON public.customers
FOR ALL USING (public.is_franchisor_admin(auth.uid()))
WITH CHECK (public.is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can manage their own customers" ON public.customers
FOR ALL USING (unit_id = public.get_user_unit_id(auth.uid()))
WITH CHECK (unit_id = public.get_user_unit_id(auth.uid()));

-- RLS para vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchisor can view all vehicles" ON public.vehicles
FOR SELECT USING (public.is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can view their own vehicles" ON public.vehicles
FOR SELECT USING (unit_id = public.get_user_unit_id(auth.uid()));

CREATE POLICY "Franchisor can manage all vehicles" ON public.vehicles
FOR ALL USING (public.is_franchisor_admin(auth.uid()))
WITH CHECK (public.is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can manage their own vehicles" ON public.vehicles
FOR ALL USING (unit_id = public.get_user_unit_id(auth.uid()))
WITH CHECK (unit_id = public.get_user_unit_id(auth.uid()));

-- RLS para services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchisor can view all services" ON public.services
FOR SELECT USING (public.is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can view their own services" ON public.services
FOR SELECT USING (unit_id = public.get_user_unit_id(auth.uid()));

CREATE POLICY "Franchisor can manage all services" ON public.services
FOR ALL USING (public.is_franchisor_admin(auth.uid()))
WITH CHECK (public.is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can manage their own services" ON public.services
FOR ALL USING (unit_id = public.get_user_unit_id(auth.uid()))
WITH CHECK (unit_id = public.get_user_unit_id(auth.uid()));

-- RLS para exports_log
ALTER TABLE public.exports_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Franchisor can view all exports" ON public.exports_log
FOR SELECT USING (public.is_franchisor_admin(auth.uid()));

CREATE POLICY "Users can view their own exports" ON public.exports_log
FOR SELECT USING (requested_by_user_id = auth.uid());

CREATE POLICY "Users can create exports" ON public.exports_log
FOR INSERT WITH CHECK (requested_by_user_id = auth.uid());

-- Trigger para updated_at em customers
CREATE TRIGGER update_customers_updated_at
BEFORE UPDATE ON public.customers
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();