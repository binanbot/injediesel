-- Add allowed_sales_channels array to seller_profiles
ALTER TABLE public.seller_profiles
ADD COLUMN IF NOT EXISTS allowed_sales_channels text[] NOT NULL DEFAULT '{whatsapp,telefone,balcao}'::text[];

-- Migrate existing sales_channel_mode data
UPDATE public.seller_profiles
SET allowed_sales_channels = CASE
  WHEN sales_channel_mode = 'counter' THEN '{balcao}'::text[]
  WHEN sales_channel_mode = 'phone' THEN '{telefone}'::text[]
  ELSE '{whatsapp,telefone,balcao}'::text[]
END;

-- Add sale_channel to orders (actual channel used per sale)
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS sale_channel text;

-- Add sale_channel to received_files (actual channel used per file)
ALTER TABLE public.received_files
ADD COLUMN IF NOT EXISTS sale_channel text;