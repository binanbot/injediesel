-- Add promotional pricing fields to products table
ALTER TABLE public.products 
ADD COLUMN promo_price numeric DEFAULT NULL,
ADD COLUMN promo_type text DEFAULT NULL CHECK (promo_type IN ('percent', 'fixed', NULL)),
ADD COLUMN promo_value numeric DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.products.promo_price IS 'Final promotional price (calculated)';
COMMENT ON COLUMN public.products.promo_type IS 'Type of promotion: percent or fixed discount';
COMMENT ON COLUMN public.products.promo_value IS 'Discount value (percentage or fixed amount)';