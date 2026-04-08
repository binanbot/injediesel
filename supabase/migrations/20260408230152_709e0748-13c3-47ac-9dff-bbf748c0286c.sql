
-- Add primary_seller_id to customers
ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS primary_seller_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL;

-- Index for fast lookups by seller
CREATE INDEX IF NOT EXISTS idx_customers_primary_seller ON public.customers(primary_seller_id) WHERE primary_seller_id IS NOT NULL;
