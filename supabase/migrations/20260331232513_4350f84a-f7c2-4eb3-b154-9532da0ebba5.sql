
-- ============================================================
-- DROPAR TABELAS ANTIGAS (ordem correta por dependência)
-- ============================================================
DROP TABLE IF EXISTS public.order_status_history CASCADE;
DROP TABLE IF EXISTS public.financial_entries CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;

-- ============================================================
-- 1. ORDERS
-- ============================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_profile_id UUID NOT NULL REFERENCES public.profiles_franchisees(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id),
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pedido_realizado',
  payment_status TEXT NOT NULL DEFAULT 'pendente',
  fulfillment_status TEXT NOT NULL DEFAULT 'pedido_realizado',
  items_count INTEGER NOT NULL DEFAULT 0,
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  delivery_address JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all orders"
  ON public.orders FOR ALL TO public
  USING (is_franchisor_admin(auth.uid()))
  WITH CHECK (is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can create orders"
  ON public.orders FOR INSERT TO public
  WITH CHECK (
    franchise_profile_id IN (
      SELECT id FROM public.profiles_franchisees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Franchisees can view their orders"
  ON public.orders FOR SELECT TO public
  USING (
    franchise_profile_id IN (
      SELECT id FROM public.profiles_franchisees WHERE user_id = auth.uid()
    )
  );

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 2. ORDER_ITEMS
-- ============================================================
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_sku TEXT,
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0,
  quantity INTEGER NOT NULL DEFAULT 1,
  line_total NUMERIC(12,2) NOT NULL DEFAULT 0,
  product_snapshot JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all order items"
  ON public.order_items FOR ALL TO public
  USING (is_franchisor_admin(auth.uid()))
  WITH CHECK (is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can create order items"
  ON public.order_items FOR INSERT TO public
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.franchise_profile_id IN (
        SELECT id FROM public.profiles_franchisees WHERE user_id = auth.uid()
      )
  ));

CREATE POLICY "Franchisees can view their order items"
  ON public.order_items FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
      AND orders.franchise_profile_id IN (
        SELECT id FROM public.profiles_franchisees WHERE user_id = auth.uid()
      )
  ));

-- ============================================================
-- 3. ORDER_STATUS_HISTORY
-- ============================================================
CREATE TABLE public.order_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID,
  internal_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage order status history"
  ON public.order_status_history FOR ALL TO public
  USING (is_franchisor_admin(auth.uid()))
  WITH CHECK (is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can view their order status history"
  ON public.order_status_history FOR SELECT TO public
  USING (EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status_history.order_id
      AND orders.franchise_profile_id IN (
        SELECT id FROM public.profiles_franchisees WHERE user_id = auth.uid()
      )
  ));

-- ============================================================
-- 4. FINANCIAL_ENTRIES
-- ============================================================
CREATE TABLE public.financial_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  franchise_profile_id UUID REFERENCES public.profiles_franchisees(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  scope TEXT NOT NULL,
  entry_type TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  competency_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage all financial entries"
  ON public.financial_entries FOR ALL TO public
  USING (is_franchisor_admin(auth.uid()))
  WITH CHECK (is_franchisor_admin(auth.uid()));

CREATE POLICY "Franchisees can view their financial entries"
  ON public.financial_entries FOR SELECT TO public
  USING (
    franchise_profile_id IN (
      SELECT id FROM public.profiles_franchisees WHERE user_id = auth.uid()
    )
  );

-- ============================================================
-- 5. TRIGGER: status change → history
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

DROP TRIGGER IF EXISTS on_order_status_change ON public.orders;
CREATE TRIGGER on_order_status_change
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.track_order_status_change();

-- ============================================================
-- 6. REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
