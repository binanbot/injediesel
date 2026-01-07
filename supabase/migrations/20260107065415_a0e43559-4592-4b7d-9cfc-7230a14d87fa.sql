-- Tornar o bucket support-attachments privado
UPDATE storage.buckets 
SET public = false 
WHERE id = 'support-attachments';

-- Remover todas as policies existentes para support-attachments
DROP POLICY IF EXISTS "Users can upload support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Franchisees can read own support attachments" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all support attachments" ON storage.objects;

-- Policy: Usuários autenticados podem fazer upload de anexos de suporte
CREATE POLICY "Users can upload support attachments"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'support-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Franqueados podem ler seus próprios anexos
CREATE POLICY "Franchisees can read own support attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'support-attachments' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins/Suporte podem ler todos os anexos de suporte
CREATE POLICY "Admins can read all support attachments"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'support-attachments' AND
  public.is_franchisor_admin(auth.uid())
);