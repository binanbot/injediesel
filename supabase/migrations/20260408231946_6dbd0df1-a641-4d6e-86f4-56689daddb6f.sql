-- Add services tracking to commission_closings
ALTER TABLE public.commission_closings
  ADD COLUMN services_revenue numeric NOT NULL DEFAULT 0,
  ADD COLUMN services_count integer NOT NULL DEFAULT 0;