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
