-- Parte 1 (Task 07) — enums, tabela logs, RLS. Usa public.users (projeto galwan-dash; não existe public.profiles).

create type public.log_action as enum ('CREATE', 'UPDATE', 'DELETE');
create type public.log_feature as enum (
  'prompts',
  'projetos',
  'corretores',
  'chat',
  'leads',
  'metricas'
);

create table if not exists public.logs (
  id            uuid primary key default gen_random_uuid(),
  user_email    text not null,
  action        public.log_action not null,
  feature       public.log_feature not null,
  description   text not null,
  created_at    timestamptz not null default now()
);

create index if not exists logs_created_at_idx on public.logs (created_at desc);
create index if not exists logs_feature_idx on public.logs (feature);
create index if not exists logs_action_idx on public.logs (action);

alter table public.logs enable row level security;

drop policy if exists logs_select_admin on public.logs;
create policy logs_select_admin on public.logs
  for select
  using (
    exists (
      select 1 from public.users u
      where u.id = auth.uid() and u.role = 'admin'
    )
  );

drop policy if exists logs_insert_authenticated on public.logs;
create policy logs_insert_authenticated on public.logs
  for insert
  with check (
    exists (
      select 1 from public.users u
      where u.id = auth.uid()
        and (u.role = 'admin' or u.is_active = true)
    )
  );

-- PostgREST: enum usage + SELECT/INSERT (RLS applies on top)
grant usage on type public.log_action to authenticated;
grant usage on type public.log_feature to authenticated;
grant select, insert on table public.logs to authenticated;
