
-- ============================================================
-- COMPANY-SCOPED RLS - FASE COMPLETA
-- ============================================================

-- 1. Helper: can user access a specific unit (via unit ownership OR company admin OR master)
CREATE OR REPLACE FUNCTION public.can_access_unit(_user_id uuid, _unit_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    -- Master/CEO: access everything
    public.is_master_level(_user_id)
    -- Franchisee: own unit
    OR (public.get_user_unit_id(_user_id) = _unit_id)
    -- Company admin/support: any unit in their company
    OR (
      public.is_company_admin(_user_id)
      AND EXISTS (
        SELECT 1 FROM public.units u
        WHERE u.id = _unit_id
          AND u.company_id = public.get_user_company_id(_user_id)
      )
    )
$$;

-- 2. Helper: can user access a specific company
CREATE OR REPLACE FUNCTION public.can_access_company(_user_id uuid, _company_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_master_level(_user_id)
    OR (public.get_user_company_id(_user_id) = _company_id)
$$;

-- ============================================================
-- UNITS
-- ============================================================
DROP POLICY IF EXISTS "Franchisees can view their own unit" ON public.units;
DROP POLICY IF EXISTS "Franchisor can manage units" ON public.units;
DROP POLICY IF EXISTS "Franchisor can view all units" ON public.units;

CREATE POLICY "Own unit read" ON public.units FOR SELECT TO authenticated
  USING (public.can_access_unit(auth.uid(), id));

CREATE POLICY "Company+ manage units" ON public.units FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid()) AND public.can_access_company(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid()) AND public.can_access_company(auth.uid(), company_id));

-- ============================================================
-- PRODUCTS
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage products" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can view products" ON public.products;

CREATE POLICY "View company products" ON public.products FOR SELECT TO authenticated
  USING (
    public.is_master_level(auth.uid())
    OR company_id = public.get_user_company_id(auth.uid())
    OR company_id IS NULL
  );

CREATE POLICY "Company+ manage products" ON public.products FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid()) AND public.can_access_company(auth.uid(), company_id))
  WITH CHECK (public.is_company_admin(auth.uid()) AND public.can_access_company(auth.uid(), company_id));

-- ============================================================
-- CUSTOMERS
-- ============================================================
DROP POLICY IF EXISTS "Franchisees can manage their own customers" ON public.customers;
DROP POLICY IF EXISTS "Franchisees can view their own customers" ON public.customers;
DROP POLICY IF EXISTS "Franchisor can manage all customers" ON public.customers;
DROP POLICY IF EXISTS "Franchisor can view all customers" ON public.customers;

CREATE POLICY "Unit-scoped customer access" ON public.customers FOR ALL TO authenticated
  USING (public.can_access_unit(auth.uid(), unit_id))
  WITH CHECK (public.can_access_unit(auth.uid(), unit_id));

-- ============================================================
-- VEHICLES
-- ============================================================
DROP POLICY IF EXISTS "Franchisees can manage their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Franchisees can view their own vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Franchisor can manage all vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Franchisor can view all vehicles" ON public.vehicles;

CREATE POLICY "Unit-scoped vehicle access" ON public.vehicles FOR ALL TO authenticated
  USING (public.can_access_unit(auth.uid(), unit_id))
  WITH CHECK (public.can_access_unit(auth.uid(), unit_id));

-- ============================================================
-- RECEIVED_FILES
-- ============================================================
DROP POLICY IF EXISTS "Franchisees can create files for their unit" ON public.received_files;
DROP POLICY IF EXISTS "Franchisees can update their own unit files" ON public.received_files;
DROP POLICY IF EXISTS "Franchisees can view their own unit files" ON public.received_files;
DROP POLICY IF EXISTS "Franchisor can manage all received files" ON public.received_files;
DROP POLICY IF EXISTS "Franchisor can view all received files" ON public.received_files;

CREATE POLICY "Unit-scoped file access" ON public.received_files FOR ALL TO authenticated
  USING (public.can_access_unit(auth.uid(), unit_id))
  WITH CHECK (public.can_access_unit(auth.uid(), unit_id));

-- ============================================================
-- SERVICES
-- ============================================================
DROP POLICY IF EXISTS "Franchisees can manage their own services" ON public.services;
DROP POLICY IF EXISTS "Franchisees can view their own services" ON public.services;
DROP POLICY IF EXISTS "Franchisor can manage all services" ON public.services;
DROP POLICY IF EXISTS "Franchisor can view all services" ON public.services;

CREATE POLICY "Unit-scoped service access" ON public.services FOR ALL TO authenticated
  USING (public.can_access_unit(auth.uid(), unit_id))
  WITH CHECK (public.can_access_unit(auth.uid(), unit_id));

-- ============================================================
-- ORDERS
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all orders" ON public.orders;
DROP POLICY IF EXISTS "Franchisees can create orders" ON public.orders;
DROP POLICY IF EXISTS "Franchisees can view their orders" ON public.orders;

CREATE POLICY "Franchisee order access" ON public.orders FOR ALL TO authenticated
  USING (
    franchise_profile_id IN (
      SELECT id FROM profiles_franchisees WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    franchise_profile_id IN (
      SELECT id FROM profiles_franchisees WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Company+ order access" ON public.orders FOR ALL TO authenticated
  USING (
    public.is_company_admin(auth.uid())
    AND (
      public.is_master_level(auth.uid())
      OR unit_id IN (SELECT public.get_company_unit_ids(public.get_user_company_id(auth.uid())))
      OR franchise_profile_id IN (
        SELECT pf.id FROM profiles_franchisees pf
        JOIN units u ON u.franchisee_id = pf.id
        WHERE u.company_id = public.get_user_company_id(auth.uid())
      )
    )
  )
  WITH CHECK (
    public.is_company_admin(auth.uid())
    AND (
      public.is_master_level(auth.uid())
      OR unit_id IN (SELECT public.get_company_unit_ids(public.get_user_company_id(auth.uid())))
    )
  );

-- ============================================================
-- ORDER_ITEMS
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all order items" ON public.order_items;
DROP POLICY IF EXISTS "Franchisees can create order items" ON public.order_items;
DROP POLICY IF EXISTS "Franchisees can view their order items" ON public.order_items;

CREATE POLICY "Order items via order access" ON public.order_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_items.order_id
      AND (
        o.franchise_profile_id IN (SELECT id FROM profiles_franchisees WHERE user_id = auth.uid())
        OR public.is_company_admin(auth.uid())
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_items.order_id
      AND (
        o.franchise_profile_id IN (SELECT id FROM profiles_franchisees WHERE user_id = auth.uid())
        OR public.is_company_admin(auth.uid())
      )
    )
  );

-- ============================================================
-- ORDER_STATUS_HISTORY
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage order status history" ON public.order_status_history;
DROP POLICY IF EXISTS "Franchisees can view their order status history" ON public.order_status_history;

CREATE POLICY "Order history via order access" ON public.order_status_history FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM orders o WHERE o.id = order_status_history.order_id
      AND (
        o.franchise_profile_id IN (SELECT id FROM profiles_franchisees WHERE user_id = auth.uid())
        OR public.is_company_admin(auth.uid())
      )
    )
  )
  WITH CHECK (public.is_company_admin(auth.uid()));

-- ============================================================
-- FINANCIAL_ENTRIES
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all financial entries" ON public.financial_entries;
DROP POLICY IF EXISTS "Franchisees can view their financial entries" ON public.financial_entries;

CREATE POLICY "Franchisee financial read" ON public.financial_entries FOR SELECT TO authenticated
  USING (
    franchise_profile_id IN (SELECT id FROM profiles_franchisees WHERE user_id = auth.uid())
  );

CREATE POLICY "Company+ financial manage" ON public.financial_entries FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid()))
  WITH CHECK (public.is_company_admin(auth.uid()));

-- ============================================================
-- SUPPORT_CONVERSATIONS
-- ============================================================
DROP POLICY IF EXISTS "Admins and support can update all conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Admins and support can view all conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Franqueados can create their own conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Franqueados can update their own conversations" ON public.support_conversations;
DROP POLICY IF EXISTS "Franqueados can view their own conversations" ON public.support_conversations;

CREATE POLICY "Own conversations" ON public.support_conversations FOR ALL TO authenticated
  USING (franqueado_id = auth.uid())
  WITH CHECK (franqueado_id = auth.uid());

CREATE POLICY "Support+ conversations" ON public.support_conversations FOR ALL TO authenticated
  USING (public.is_company_support(auth.uid()))
  WITH CHECK (public.is_company_support(auth.uid()));

-- ============================================================
-- SUPPORT_MESSAGES
-- ============================================================
DROP POLICY IF EXISTS "Admins and support can send messages" ON public.support_messages;
DROP POLICY IF EXISTS "Admins and support can view all messages" ON public.support_messages;
DROP POLICY IF EXISTS "Users can send messages in their conversations" ON public.support_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.support_messages;

CREATE POLICY "Own conversation messages" ON public.support_messages FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_conversations sc
      WHERE sc.id = support_messages.conversation_id
      AND sc.franqueado_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_conversations sc
      WHERE sc.id = support_messages.conversation_id
      AND sc.franqueado_id = auth.uid()
    )
  );

CREATE POLICY "Support+ messages" ON public.support_messages FOR ALL TO authenticated
  USING (public.is_company_support(auth.uid()))
  WITH CHECK (public.is_company_support(auth.uid()));

-- ============================================================
-- CORRECTION_TICKETS
-- ============================================================
DROP POLICY IF EXISTS "Admins can update correction tickets" ON public.correction_tickets;
DROP POLICY IF EXISTS "Admins can view all correction tickets" ON public.correction_tickets;
DROP POLICY IF EXISTS "Franqueados can create their own correction tickets" ON public.correction_tickets;
DROP POLICY IF EXISTS "Franqueados can view their own correction tickets" ON public.correction_tickets;

CREATE POLICY "Own correction tickets" ON public.correction_tickets FOR ALL TO authenticated
  USING (franqueado_id = auth.uid())
  WITH CHECK (franqueado_id = auth.uid());

CREATE POLICY "Support+ correction tickets" ON public.correction_tickets FOR ALL TO authenticated
  USING (public.is_company_support(auth.uid()))
  WITH CHECK (public.is_company_support(auth.uid()));

-- ============================================================
-- PROFILES_FRANCHISEES
-- ============================================================
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles_franchisees;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles_franchisees;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles_franchisees;
DROP POLICY IF EXISTS "Franqueados can update basic info" ON public.profiles_franchisees;
DROP POLICY IF EXISTS "Franqueados can view their own profile" ON public.profiles_franchisees;

CREATE POLICY "Own profile" ON public.profiles_franchisees FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Company+ profiles" ON public.profiles_franchisees FOR ALL TO authenticated
  USING (public.is_company_admin(auth.uid()))
  WITH CHECK (public.is_company_admin(auth.uid()));

-- ============================================================
-- CARTS / CART_ITEMS (maintain unit-scoped + company admin)
-- ============================================================
DROP POLICY IF EXISTS "Admins can manage all carts" ON public.carts;
DROP POLICY IF EXISTS "Admins can view all carts" ON public.carts;
DROP POLICY IF EXISTS "Franchisees can manage their cart" ON public.carts;

CREATE POLICY "Unit-scoped cart access" ON public.carts FOR ALL TO authenticated
  USING (unit_id = public.get_user_unit_id(auth.uid()) OR public.is_company_admin(auth.uid()))
  WITH CHECK (unit_id = public.get_user_unit_id(auth.uid()) OR public.is_company_admin(auth.uid()));

DROP POLICY IF EXISTS "Admins can manage all cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Admins can view all cart items" ON public.cart_items;
DROP POLICY IF EXISTS "Franchisees can manage their cart items" ON public.cart_items;

CREATE POLICY "Cart items via cart access" ON public.cart_items FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id
      AND (c.unit_id = public.get_user_unit_id(auth.uid()) OR public.is_company_admin(auth.uid()))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM carts c WHERE c.id = cart_items.cart_id
      AND (c.unit_id = public.get_user_unit_id(auth.uid()) OR public.is_company_admin(auth.uid()))
    )
  );
