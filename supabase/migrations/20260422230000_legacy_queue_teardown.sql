-- Idempotent cleanup of experimental broker-queue objects (historical migrations).
-- Safe on fresh DBs (no-op) and on DBs that still have leftovers.

do $$
declare
  r regprocedure;
begin
  for r in
    select p.oid::regprocedure
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname in (
        'proximo_corretor',
        'next_available_broker',
        'get_corretores_disponiveis',
        'avancar_fila',
        'get_primeiro_corretor',
        'get_proximo_corretor_preview',
        'reset_fila_corretores'
      )
  loop
    execute format('drop function if exists %s cascade', r);
  end loop;
end$$;

drop function if exists public.proximo_corretor();
drop function if exists public.proximo_corretor(text);

drop table if exists public.corretor_faixas_horarias cascade;
drop table if exists public.corretores cascade;
drop table if exists public.fila_corretores cascade;

alter table public.brokers drop column if exists last_queue_pick_at;
