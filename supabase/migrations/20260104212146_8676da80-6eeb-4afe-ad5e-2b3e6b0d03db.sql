-- Tabela de referência de cidades (BR/PY)
CREATE TABLE IF NOT EXISTS public.cities_reference (
  id TEXT PRIMARY KEY,
  country TEXT NOT NULL,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  search_key TEXT NOT NULL
);

-- Índice para busca rápida
CREATE INDEX IF NOT EXISTS idx_cities_reference_search ON public.cities_reference (country, state, search_key);
CREATE INDEX IF NOT EXISTS idx_cities_reference_city ON public.cities_reference (search_key);

-- Adicionar coluna service_areas na tabela profiles_franchisees
ALTER TABLE public.profiles_franchisees 
ADD COLUMN IF NOT EXISTS service_areas JSONB DEFAULT '[]'::jsonb;

-- RLS para cities_reference (leitura pública, escrita apenas admin)
ALTER TABLE public.cities_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cities reference"
ON public.cities_reference
FOR SELECT
USING (true);

CREATE POLICY "Admins can manage cities reference"
ON public.cities_reference
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));