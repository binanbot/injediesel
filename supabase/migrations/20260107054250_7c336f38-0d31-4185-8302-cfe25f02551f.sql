-- Allow franchisor admins to create/update/delete carts (needed for admin selecting a unit)

-- Carts: admin can manage
CREATE POLICY "Admins can manage all carts"
ON public.carts
FOR ALL
TO public
USING (is_franchisor_admin(auth.uid()))
WITH CHECK (is_franchisor_admin(auth.uid()));

-- Cart items: admin can manage
CREATE POLICY "Admins can manage all cart items"
ON public.cart_items
FOR ALL
TO public
USING (is_franchisor_admin(auth.uid()))
WITH CHECK (is_franchisor_admin(auth.uid()));
