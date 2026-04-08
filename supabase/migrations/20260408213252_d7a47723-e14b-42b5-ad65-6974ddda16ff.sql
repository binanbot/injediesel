
ALTER TABLE public.commission_closings
  ADD COLUMN IF NOT EXISTS paid_by uuid NULL,
  ADD COLUMN IF NOT EXISTS period_status text NOT NULL DEFAULT 'aberto';

COMMENT ON COLUMN public.commission_closings.paid_by IS 'Usuário que registrou o pagamento';
COMMENT ON COLUMN public.commission_closings.period_status IS 'Status do período: aberto, em_apuracao, fechado, pago';

-- Add unique constraint for seller+period if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'commission_closings_seller_period_unique'
  ) THEN
    ALTER TABLE public.commission_closings
      ADD CONSTRAINT commission_closings_seller_period_unique
      UNIQUE (seller_profile_id, period_start, period_end);
  END IF;
END $$;
