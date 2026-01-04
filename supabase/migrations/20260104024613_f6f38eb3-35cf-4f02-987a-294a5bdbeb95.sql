-- Create storage bucket for support attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('support-attachments', 'support-attachments', true, 10485760)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload support attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'support-attachments');

-- Allow public read access
CREATE POLICY "Public can view support attachments"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'support-attachments');

-- Allow users to delete their own files
CREATE POLICY "Users can delete their support attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'support-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add attachment columns to support_conversations
ALTER TABLE public.support_conversations
ADD COLUMN IF NOT EXISTS attachment_url TEXT,
ADD COLUMN IF NOT EXISTS attachment_name TEXT;