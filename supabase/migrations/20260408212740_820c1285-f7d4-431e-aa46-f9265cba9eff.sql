
ALTER TABLE public.seller_profiles
  ADD COLUMN IF NOT EXISTS sales_channel_mode text NOT NULL DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS can_sell_services boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS commission_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS target_enabled boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.seller_profiles.sales_channel_mode IS 'Canal de venda: counter, phone, both';
COMMENT ON COLUMN public.seller_profiles.can_sell_services IS 'Pode vender serviços ECU/mapa';
COMMENT ON COLUMN public.seller_profiles.commission_enabled IS 'Tem direito a comissão';
COMMENT ON COLUMN public.seller_profiles.target_enabled IS 'Participa de metas comerciais';
