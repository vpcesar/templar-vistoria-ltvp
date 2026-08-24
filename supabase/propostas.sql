-- ============================================================
-- ERP TEMPLAR ENGENHARIA — Módulo Propostas
-- Execute este script no SQL Editor do seu projeto Supabase.
-- (Requer a tabela public.leads criada por supabase/crm.sql)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.propostas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  data_emissao DATE DEFAULT CURRENT_DATE,
  responsavel_tecnico_nome TEXT DEFAULT 'Vinicius Cesar',
  responsavel_tecnico_crea TEXT DEFAULT 'RJ 2024100977',
  cliente_nome TEXT NOT NULL,
  cliente_cpf TEXT,
  cliente_telefone TEXT,
  cliente_endereco TEXT,
  imovel_endereco TEXT,
  imovel_observacoes TEXT,
  tipo_servico TEXT NOT NULL,
  escopo_objetivo TEXT,
  escopo_itens_constantes TEXT,
  escopo_metodologia TEXT,
  escopo_entregaveis TEXT,
  valor_total NUMERIC(10,2) NOT NULL,
  condicoes_pagamento TEXT,
  validade_dias INTEGER DEFAULT 15,
  prazo_execucao TEXT,
  nao_incluido TEXT,
  status TEXT DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviada', 'aceita', 'recusada', 'expirada')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Data API (PostgREST) precisa de GRANTs explícitos.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propostas TO authenticated;
GRANT ALL ON public.propostas TO service_role;

-- O app usa login próprio (não Supabase Auth), portanto as requisições
-- chegam com a role "anon".
GRANT SELECT, INSERT, UPDATE, DELETE ON public.propostas TO anon;

ALTER TABLE public.propostas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated on propostas" ON public.propostas;
CREATE POLICY "Allow all for authenticated on propostas"
  ON public.propostas FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for anon on propostas" ON public.propostas;
CREATE POLICY "Allow all for anon on propostas"
  ON public.propostas FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS propostas_status_idx ON public.propostas (status);
CREATE INDEX IF NOT EXISTS propostas_lead_id_idx ON public.propostas (lead_id);
