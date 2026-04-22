-- Renomeia agent_prompts → prompt. RLS/policies (ex.: access_agent_prompts + can_access_area('prompt'))
-- permanecem na mesma relação após o rename no Postgres.

do $$
begin
  if exists (
    select 1 from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'agent_prompts' and c.relkind = 'r'
  ) and not exists (
    select 1 from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'prompt' and c.relkind = 'r'
  ) then
    alter table public.agent_prompts rename to prompt;
  end if;
end$$;
