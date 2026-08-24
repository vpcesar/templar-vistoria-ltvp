-- ============================================================
-- ERP TEMPLAR ENGENHARIA — Módulo CRM
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  telefone TEXT,
  email TEXT,
  tipo_pessoa TEXT DEFAULT 'PF' CHECK (tipo_pessoa IN ('PF', 'PJ')),
  documento TEXT,
  origem TEXT DEFAULT 'outro' CHECK (origem IN ('indicacao', 'site', 'redes_social', 'google', 'outro')),
  status TEXT DEFAULT 'novo' CHECK (status IN ('novo', 'em_contato', 'proposta_enviada', 'ganho', 'perdido')),
  observacoes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.interacoes_lead (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  tipo TEXT CHECK (tipo IN ('whatsapp', 'email', 'telefone', 'visita', 'reuniao')),
  descricao TEXT NOT NULL,
  data_interacao TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Data API (PostgREST) precisa de GRANTs explícitos.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interacoes_lead TO authenticated;
GRANT ALL ON public.leads TO service_role;
GRANT ALL ON public.interacoes_lead TO service_role;

-- O app usa login próprio (não Supabase Auth), portanto as requisições
-- chegam com a role "anon". Os GRANTs/policies abaixo mantêm o CRM
-- funcionando. Se depois migrar o login para o Supabase Auth, remova
-- os GRANTs e policies de "anon".
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.interacoes_lead TO anon;

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interacoes_lead ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated on leads" ON public.leads;
CREATE POLICY "Allow all for authenticated on leads"
  ON public.leads FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated on interacoes_lead" ON public.interacoes_lead;
CREATE POLICY "Allow all for authenticated on interacoes_lead"
  ON public.interacoes_lead FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon on leads" ON public.leads;
CREATE POLICY "Allow all for anon on leads"
  ON public.leads FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon on interacoes_lead" ON public.interacoes_lead;
CREATE POLICY "Allow all for anon on interacoes_lead"
  ON public.interacoes_lead FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS leads_status_idx ON public.leads (status);
CREATE INDEX IF NOT EXISTS interacoes_lead_lead_id_idx ON public.interacoes_lead (lead_id);
