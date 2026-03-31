
-- ============================================================
-- 1. EXPANDIR TABELA orders (adicionar campos faltantes)
-- ============================================================
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS order_number SERIAL,
  ADD COLUMN IF NOT EXISTS franchisee_profile_id UUID REFERENCES public.profiles_franchisees(id),
  ADD COLUMN IF NOT EXISTS delivery_snapshot JSONB,
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS whatsapp_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'loja';

-- ============================================================
-- 2. EXPANDIR TABELA order_items (adicionar sku e image_url)
-- ============================================================
ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS image_url TEXT;

-- ============================================================
-- 3. CRIAR TABELA order_status_history
-- ============================================================
CREATE TABLE IF NOT EXISTS public.order_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

-- Admins podem ver e inserir todo histórico
CREATE POLICY "Admins can manage order status history"
  ON public.order_status_history FOR ALL
  TO public
  USING (is_franchisor_admin(auth.uid()))
  WITH CHECK (is_franchisor_admin(auth.uid()));

-- Franqueados podem ver histórico dos seus pedidos
CREATE POLICY "Franchisees can view their order status history"
  ON public.order_status_history FOR SELECT
  TO public
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status_history.order_id
      AND orders.unit_id = get_user_unit_id(auth.uid())
  ));

-- ============================================================
-- 4. CRIAR TABELA financial_entries
-- ============================================================
CREATE TABLE IF NOT EXISTS public.financial_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID REFERENCES public.units(id),
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  entry_type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'pecas_acessorios',
  description TEXT,
  amount_brl NUMERIC NOT NULL DEFAULT 0,
  direction TEXT NOT NULL DEFAULT 'debit',
  reference_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

-- Admins podem gerenciar todas as entradas financeiras
CREATE POLICY "Admins can manage all financial entries"
  ON public.financial_entries FOR ALL
  TO public
  USING (is_franchisor_admin(auth.uid()))
  WITH CHECK (is_franchisor_admin(auth.uid()));

-- Franqueados podem ver suas próprias entradas
CREATE POLICY "Franchisees can view their financial entries"
  ON public.financial_entries FOR SELECT
  TO public
  USING (unit_id = get_user_unit_id(auth.uid()));

-- ============================================================
-- 5. TRIGGER: ao mudar status do pedido, inserir histórico
-- ============================================================
CREATE OR REPLACE FUNCTION public.track_order_status_change()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_history (order_id, previous_status, new_status, changed_by)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid());
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.track_order_status_change();

-- ============================================================
-- 6. TRIGGER: updated_at em financial_entries
-- ============================================================
CREATE TRIGGER update_financial_entries_updated_at
  BEFORE UPDATE ON public.financial_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 7. Habilitar realtime para orders (acompanhamento de status)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
