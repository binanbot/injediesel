-- ===========================================
-- LOJA PROMAX PEÇAS - E-COMMERCE MODULE
-- ===========================================

-- PRODUCTS TABLE
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sku TEXT NOT NULL UNIQUE,
  ref TEXT,
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT 'PROMAX',
  models TEXT[] DEFAULT '{}',
  description_short TEXT,
  description_full TEXT,
  specifications TEXT[] DEFAULT '{}',
  price NUMERIC NOT NULL DEFAULT 0,
  available BOOLEAN NOT NULL DEFAULT true,
  category TEXT,
  weight_kg NUMERIC,
  dimensions_mm TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Products are readable by authenticated users
CREATE POLICY "Authenticated users can view products"
ON public.products FOR SELECT
USING (auth.uid() IS NOT NULL);

-- Only admins can manage products
CREATE POLICY "Admins can manage products"
ON public.products FOR ALL
USING (is_franchisor_admin(auth.uid()))
WITH CHECK (is_franchisor_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- CARTS TABLE (one per unit)
-- ===========================================
CREATE TABLE public.carts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;

-- Franchisees can manage their own cart
CREATE POLICY "Franchisees can manage their cart"
ON public.carts FOR ALL
USING (unit_id = get_user_unit_id(auth.uid()))
WITH CHECK (unit_id = get_user_unit_id(auth.uid()));

-- Admins can view all carts
CREATE POLICY "Admins can view all carts"
ON public.carts FOR SELECT
USING (is_franchisor_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_carts_updated_at
BEFORE UPDATE ON public.carts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- CART ITEMS TABLE
-- ===========================================
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(cart_id, product_id)
);

-- Enable RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- Franchisees can manage items in their cart
CREATE POLICY "Franchisees can manage their cart items"
ON public.cart_items FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id
    AND carts.unit_id = get_user_unit_id(auth.uid())
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.carts
    WHERE carts.id = cart_items.cart_id
    AND carts.unit_id = get_user_unit_id(auth.uid())
  )
);

-- Admins can view all cart items
CREATE POLICY "Admins can view all cart items"
ON public.cart_items FOR SELECT
USING (is_franchisor_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_cart_items_updated_at
BEFORE UPDATE ON public.cart_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ORDERS TABLE
-- ===========================================
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'canceled', 'shipped')),
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT CHECK (payment_method IN ('pix', 'card', 'boleto')),
  installments INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Franchisees can view and create their own orders
CREATE POLICY "Franchisees can view their orders"
ON public.orders FOR SELECT
USING (unit_id = get_user_unit_id(auth.uid()));

CREATE POLICY "Franchisees can create orders"
ON public.orders FOR INSERT
WITH CHECK (unit_id = get_user_unit_id(auth.uid()));

-- Admins can manage all orders
CREATE POLICY "Admins can manage all orders"
ON public.orders FOR ALL
USING (is_franchisor_admin(auth.uid()))
WITH CHECK (is_franchisor_admin(auth.uid()));

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ORDER ITEMS TABLE
-- ===========================================
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL,
  subtotal NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Franchisees can view and create their own order items
CREATE POLICY "Franchisees can view their order items"
ON public.order_items FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.unit_id = get_user_unit_id(auth.uid())
  )
);

CREATE POLICY "Franchisees can create order items"
ON public.order_items FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_items.order_id
    AND orders.unit_id = get_user_unit_id(auth.uid())
  )
);

-- Admins can manage all order items
CREATE POLICY "Admins can manage all order items"
ON public.order_items FOR ALL
USING (is_franchisor_admin(auth.uid()))
WITH CHECK (is_franchisor_admin(auth.uid()));