-- Local dev after `supabase db reset`: one broker + availability for today (08:00–20:00).

insert into public.brokers (
  first_name,
  last_name,
  email,
  whatsapp,
  calendar_color,
  is_active
)
select
  'Queue',
  'Test',
  'queue-test@example.local',
  '+5511987650000',
  '#3b82f6',
  true
where not exists (
  select 1 from public.brokers where email = 'queue-test@example.local'
);

insert into public.broker_availability (
  broker_id,
  available_date,
  is_available,
  start_time,
  end_time
)
select b.id, (clock_timestamp() at time zone 'America/Sao_Paulo')::date, true, '08:00', '20:00'
from public.brokers b
where b.email = 'queue-test@example.local'
  and not exists (
    select 1
    from public.broker_availability a
    where a.broker_id = b.id
      and a.available_date = (clock_timestamp() at time zone 'America/Sao_Paulo')::date
  );
