
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS type text NOT NULL DEFAULT 'PF',
  ADD COLUMN IF NOT EXISTS address_number text,
  ADD COLUMN IF NOT EXISTS address_complement text,
  ADD COLUMN IF NOT EXISTS address_district text;

COMMENT ON COLUMN public.customers.type IS 'PF = Pessoa Física, PJ = Pessoa Jurídica';
