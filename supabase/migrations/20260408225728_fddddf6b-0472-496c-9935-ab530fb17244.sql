-- Add customer_id to orders (links to customers table)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL;

-- Add operator_user_id to orders (who created the sale, may differ from seller)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS operator_user_id uuid;