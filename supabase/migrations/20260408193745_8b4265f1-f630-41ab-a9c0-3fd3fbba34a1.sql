
ALTER TABLE public.seller_profiles
ADD COLUMN IF NOT EXISTS max_discount_pct numeric NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.seller_profiles.max_discount_pct IS 'Maximum discount percentage this seller can apply (0-100)';
