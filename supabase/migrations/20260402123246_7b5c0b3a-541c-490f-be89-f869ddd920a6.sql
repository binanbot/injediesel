
-- Add seller attribution columns to operational tables
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.received_files
  ADD COLUMN IF NOT EXISTS seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL;

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS seller_profile_id uuid REFERENCES public.seller_profiles(id) ON DELETE SET NULL;

-- Add sale_type to orders and services for ECU vs parts differentiation
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS sale_type text DEFAULT 'parts';

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS sale_type text DEFAULT 'ecu';

-- Add can_bill flag to seller_profiles (missing from initial schema)
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS can_bill boolean NOT NULL DEFAULT true;

-- Index for seller queries and reporting
CREATE INDEX IF NOT EXISTS idx_orders_seller_profile_id ON public.orders(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_received_files_seller_profile_id ON public.received_files(seller_profile_id);
CREATE INDEX IF NOT EXISTS idx_services_seller_profile_id ON public.services(seller_profile_id);
