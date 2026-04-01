
-- Indexes for customers (columns already exist)
CREATE INDEX IF NOT EXISTS idx_customers_unit_id ON public.customers(unit_id);
CREATE INDEX IF NOT EXISTS idx_customers_is_active ON public.customers(is_active);
CREATE INDEX IF NOT EXISTS idx_customers_full_name ON public.customers(full_name);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON public.customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Unique constraints for customers (per unit)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_cpf_unique') THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_cpf_unique UNIQUE (unit_id, cpf);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'customers_cnpj_unique') THEN
    ALTER TABLE public.customers ADD CONSTRAINT customers_cnpj_unique UNIQUE (unit_id, cnpj);
  END IF;
END $$;

-- New columns for vehicles
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS model_year integer;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS transmission text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS fuel text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS color text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS chassis text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS created_by uuid;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS updated_by uuid;
ALTER TABLE public.vehicles ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Indexes for vehicles
CREATE INDEX IF NOT EXISTS idx_vehicles_unit_id ON public.vehicles(unit_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_customer_id ON public.vehicles(customer_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_plate ON public.vehicles(plate);
CREATE INDEX IF NOT EXISTS idx_vehicles_is_active ON public.vehicles(is_active);

-- Unique plate per unit
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vehicles_plate_unit_unique') THEN
    ALTER TABLE public.vehicles ADD CONSTRAINT vehicles_plate_unit_unique UNIQUE (unit_id, plate);
  END IF;
END $$;
