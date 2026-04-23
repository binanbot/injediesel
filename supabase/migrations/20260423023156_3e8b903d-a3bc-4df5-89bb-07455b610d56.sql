ALTER TABLE public.profiles_franchisees ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id);

-- Update existing profiles based on their roles
UPDATE public.profiles_franchisees p
SET company_id = ur.company_id
FROM public.user_roles ur
WHERE p.user_id = ur.user_id;
