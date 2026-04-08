
-- Add operator tracking to received_files
ALTER TABLE public.received_files
ADD COLUMN IF NOT EXISTS operator_user_id uuid;

CREATE INDEX IF NOT EXISTS idx_received_files_operator ON public.received_files(operator_user_id) WHERE operator_user_id IS NOT NULL;

-- Add operator and sale_channel to services
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS operator_user_id uuid;

ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS sale_channel text;

CREATE INDEX IF NOT EXISTS idx_services_operator ON public.services(operator_user_id) WHERE operator_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_services_sale_channel ON public.services(sale_channel) WHERE sale_channel IS NOT NULL;
