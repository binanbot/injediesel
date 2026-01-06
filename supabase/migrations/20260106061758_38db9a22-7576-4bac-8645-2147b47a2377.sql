-- Create table for system settings including social links
CREATE TABLE public.system_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (public data like social links)
CREATE POLICY "Anyone can read system settings" 
ON public.system_settings 
FOR SELECT 
USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can modify system settings" 
ON public.system_settings 
FOR ALL 
USING (public.is_franchisor_admin(auth.uid()));

-- Create trigger for updated_at
CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default social link entries
INSERT INTO public.system_settings (key, value) VALUES
  ('social_facebook', ''),
  ('social_instagram', ''),
  ('social_tiktok', ''),
  ('social_shop', '');