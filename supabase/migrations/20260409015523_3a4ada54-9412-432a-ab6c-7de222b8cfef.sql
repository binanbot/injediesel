
-- ============================================================
-- BLOCO 1: Remover policy pública do bucket support-attachments
-- ============================================================
DROP POLICY IF EXISTS "Public can view support attachments" ON storage.objects;

-- ============================================================
-- BLOCO 2: Endurecer audit_logs INSERT
-- ============================================================
DROP POLICY IF EXISTS "Authenticated can insert audit logs" ON public.audit_logs;

CREATE POLICY "Authenticated insert own audit logs"
ON public.audit_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- ============================================================
-- BLOCO 3: View segura para profiles_franchisees (sem legacy hashes)
-- ============================================================
CREATE OR REPLACE VIEW public.profiles_franchisees_safe AS
SELECT
  id, user_id, email, display_name, first_name, last_name,
  phone, cpf, cnpj, cidade, state, district, street,
  address_number, complement, zip_code, delivery_address,
  service_areas, contract_expiration_date, contract_type,
  equipment_type, kess_serial, kess_expires_at, ktag_serial, ktag_expires_at,
  is_prepaid, rental_value_brl, start_date,
  allow_manual_credits, requires_password_reset,
  created_at, updated_at
FROM public.profiles_franchisees;

-- ============================================================
-- BLOCO 4: file_status_history — franqueados podem ler seus próprios arquivos
-- ============================================================
CREATE POLICY "Franchisees can view own file status history"
ON public.file_status_history
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.received_files rf
    WHERE rf.id::text = file_status_history.arquivo_id
    AND rf.unit_id = public.get_user_unit_id(auth.uid())
  )
);
