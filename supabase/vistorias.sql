-- =========================================================
-- MÓDULO DE VISTORIAS — TEMPLAR ENGENHARIA (ERP)
-- Execute no SQL Editor do Supabase.
-- =========================================================

create table if not exists public.vistorias (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique,
  proposta_id uuid references public.propostas(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  data_vistoria date not null,
  hora_vistoria text,
  cliente_nome text not null,
  cliente_telefone text,
  imovel_endereco text,
  tipo_servico text not null,
  responsavel_tecnico_nome text not null default 'Vinicius Cesar',
  responsavel_tecnico_crea text not null default 'RJ 2024100977',
  observacoes text,
  status text not null default 'agendada'
    check (status in ('agendada','em_andamento','concluida','cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.itens_vistoria (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias(id) on delete cascade,
  categoria text not null,
  item text not null,
  status text not null default 'pendente'
    check (status in ('pendente','conforme','nao_conforme','nao_aplicavel')),
  observacao text,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.fotos_vistoria (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias(id) on delete cascade,
  item_id uuid references public.itens_vistoria(id) on delete cascade,
  url text not null,
  caminho text not null,
  legenda text,
  created_at timestamptz not null default now()
);

create index if not exists idx_itens_vistoria_vistoria on public.itens_vistoria(vistoria_id, ordem);
create index if not exists idx_fotos_vistoria_vistoria on public.fotos_vistoria(vistoria_id);
create index if not exists idx_fotos_vistoria_item on public.fotos_vistoria(item_id);

-- Data API grants
grant select, insert, update, delete on public.vistorias to anon, authenticated;
grant select, insert, update, delete on public.itens_vistoria to anon, authenticated;
grant select, insert, update, delete on public.fotos_vistoria to anon, authenticated;
grant all on public.vistorias to service_role;
grant all on public.itens_vistoria to service_role;
grant all on public.fotos_vistoria to service_role;

alter table public.vistorias enable row level security;
alter table public.itens_vistoria enable row level security;
alter table public.fotos_vistoria enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'vistorias' and policyname = 'vistorias_acesso') then
    create policy "vistorias_acesso" on public.vistorias for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'itens_vistoria' and policyname = 'itens_vistoria_acesso') then
    create policy "itens_vistoria_acesso" on public.itens_vistoria for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'fotos_vistoria' and policyname = 'fotos_vistoria_acesso') then
    create policy "fotos_vistoria_acesso" on public.fotos_vistoria for all using (true) with check (true);
  end if;
end $$;

-- =========================================================
-- STORAGE — bucket público de fotos
-- =========================================================
insert into storage.buckets (id, name, public)
values ('vistorias-fotos', 'vistorias-fotos', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'vistorias_fotos_leitura') then
    create policy "vistorias_fotos_leitura" on storage.objects
      for select using (bucket_id = 'vistorias-fotos');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'vistorias_fotos_envio') then
    create policy "vistorias_fotos_envio" on storage.objects
      for insert with check (bucket_id = 'vistorias-fotos');
  end if;
  if not exists (select 1 from pg_policies where tablename = 'objects' and policyname = 'vistorias_fotos_exclusao') then
    create policy "vistorias_fotos_exclusao" on storage.objects
      for delete using (bucket_id = 'vistorias-fotos');
  end if;
end $$;

-- =========================================================
-- Cômodo por item do checklist
-- =========================================================
alter table if exists public.itens_vistoria
  add column if not exists comodo text;

-- =========================================================
-- Vínculo Vistoria -> Laudo
-- O módulo de Laudos (Inspeção Predial) armazena os laudos no
-- dispositivo (localStorage), então não existe tabela "laudos".
-- O vínculo é guardado no próprio laudo (origem.vistoriaId).
-- Caso a tabela de laudos seja criada no futuro, aplique:
-- alter table public.laudos
--   add column if not exists vistoria_id uuid references public.vistorias(id) on delete set null;

-- =========================================================
-- FLUXO POR AMBIENTES (Imóvel Novo / Entrega) — idempotente
-- Execute no SQL Editor do Supabase.
-- =========================================================

alter table if exists public.vistorias
  add column if not exists unidade text,
  add column if not exists tipo_imovel text,
  add column if not exists responsavel_construtora text,
  add column if not exists fluxo text,
  add column if not exists concluida boolean not null default false;

create table if not exists public.ambientes_vistoria (
  id uuid primary key default gen_random_uuid(),
  vistoria_id uuid not null references public.vistorias(id) on delete cascade,
  nome text not null,
  ordem integer not null default 0,
  created_at timestamptz not null default now()
);

alter table if exists public.itens_vistoria
  add column if not exists ambiente_id uuid references public.ambientes_vistoria(id) on delete cascade,
  add column if not exists titulo text,
  add column if not exists orientacoes text,
  add column if not exists teste text,
  add column if not exists atencao text,
  add column if not exists personalizado boolean not null default false,
  add column if not exists existe_sistema boolean,
  add column if not exists observacoes text,
  add column if not exists observacao_aprimorada text;

alter table if exists public.fotos_vistoria
  add column if not exists item_vistoria_id uuid references public.itens_vistoria(id) on delete cascade,
  add column if not exists ordem integer default 0;

create table if not exists public.catalogo_checklist (
  id uuid primary key default gen_random_uuid(),
  tipo_ambiente text not null,
  titulo text not null,
  orientacoes text,
  teste text,
  atencao text,
  ordem integer not null default 0
);

create index if not exists idx_ambientes_vistoria on public.ambientes_vistoria(vistoria_id, ordem);
create index if not exists idx_itens_ambiente on public.itens_vistoria(ambiente_id, ordem);
create index if not exists idx_fotos_item_vistoria on public.fotos_vistoria(item_vistoria_id);
create index if not exists idx_catalogo_tipo on public.catalogo_checklist(tipo_ambiente, ordem);

grant select, insert, update, delete on public.ambientes_vistoria to anon, authenticated;
grant select on public.catalogo_checklist to anon, authenticated;
grant all on public.ambientes_vistoria to service_role;
grant all on public.catalogo_checklist to service_role;

alter table public.ambientes_vistoria enable row level security;
alter table public.catalogo_checklist enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where tablename = 'ambientes_vistoria' and policyname = 'ambientes_vistoria_acesso') then
    create policy "ambientes_vistoria_acesso" on public.ambientes_vistoria for all using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where tablename = 'catalogo_checklist' and policyname = 'catalogo_checklist_leitura') then
    create policy "catalogo_checklist_leitura" on public.catalogo_checklist for select using (true);
  end if;
end $$;
