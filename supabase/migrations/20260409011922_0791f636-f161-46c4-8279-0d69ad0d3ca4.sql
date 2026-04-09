-- Fix: Remove overly permissive financial_entries policy
-- The "Company+ financial manage" policy allows any company admin to access ALL financial entries
-- regardless of company_id, creating a cross-tenant data leak
DROP POLICY IF EXISTS "Company+ financial manage" ON public.financial_entries;

-- The existing "Company admins can manage own financial entries" policy already handles
-- company-scoped access correctly with can_access_company(auth.uid(), company_id)
-- No replacement needed as the proper policy already exists.