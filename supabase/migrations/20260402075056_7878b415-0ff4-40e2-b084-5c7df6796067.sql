-- Allow unauthenticated (anon) users to read active companies
-- This is needed for brand resolution on landing/login pages before authentication
CREATE POLICY "Anon can view active companies"
  ON public.companies
  FOR SELECT
  TO anon
  USING (is_active = true);

-- Also allow anon to read company_domains for hostname resolution
CREATE POLICY "Anon can read active domains"
  ON public.company_domains
  FOR SELECT
  TO anon
  USING (is_active = true);