
-- ============================================================
-- BLOCO 1: plate_lookup_cache — restringir leitura cross-franchisee
-- ============================================================
DROP POLICY IF EXISTS "Authenticated users can read plate cache" ON public.plate_lookup_cache;

CREATE POLICY "Scoped plate cache read"
ON public.plate_lookup_cache
FOR SELECT
TO authenticated
USING (
  public.is_company_admin(auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.received_files rf
    WHERE rf.placa = plate_lookup_cache.plate
    AND rf.unit_id = public.get_user_unit_id(auth.uid())
  )
);

-- ============================================================
-- BLOCO 2: Remover coluna legacy_user_pass_hash
-- ============================================================
ALTER TABLE public.profiles_franchisees
DROP COLUMN IF EXISTS legacy_user_pass_hash;
