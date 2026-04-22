-- RPC para fila de corretores (n8n / PostgREST).
-- Chamada: POST /rest/v1/rpc/get_next_corretor com body JSON "{}"
-- e header Content-Type: application/json

create or replace function public.get_next_corretor()
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now() at time zone 'America/Sao_Paulo';
  v_hoje date := v_now::date;
  v_hora text := to_char(v_now, 'HH24:MI:SS');
  v_corretor record;
  v_proximo record;
begin

  select b.id, b.first_name, b.last_name, b.whatsapp,
         ba.id as avail_id, ba.queue_position
  into v_corretor
  from brokers b
  join broker_availability ba on ba.broker_id = b.id
  where ba.available_date = v_hoje
    and ba.is_available = true
    and v_hora between ba.start_time and ba.end_time
    and b.is_active = true
  order by ba.queue_position asc
  limit 1;

  if v_corretor is not null then
    update broker_availability
    set queue_position = (
      select max(queue_position) + 1
      from broker_availability
      where available_date = v_hoje
        and is_available = true
        and start_time = (select start_time from broker_availability where id = v_corretor.avail_id)
        and end_time = (select end_time from broker_availability where id = v_corretor.avail_id)
    )
    where id = v_corretor.avail_id;

    return json_build_object(
      'disponivel_agora', true,
      'nome', v_corretor.first_name || ' ' || v_corretor.last_name,
      'whatsapp', v_corretor.whatsapp,
      'data', null
    );
  end if;

  select b.id, b.first_name, b.last_name, b.whatsapp,
         ba.id as avail_id, ba.available_date, ba.start_time, ba.queue_position
  into v_proximo
  from brokers b
  join broker_availability ba on ba.broker_id = b.id
  where ba.is_available = true
    and b.is_active = true
    and (
      ba.available_date > v_hoje or
      (ba.available_date = v_hoje and ba.start_time > v_hora)
    )
  order by ba.available_date asc, ba.start_time asc, ba.queue_position asc
  limit 1;

  if v_proximo is not null then
    update broker_availability
    set queue_position = (
      select max(queue_position) + 1
      from broker_availability
      where available_date = v_proximo.available_date
        and start_time = v_proximo.start_time
        and is_available = true
    )
    where id = v_proximo.avail_id;

    return json_build_object(
      'disponivel_agora', false,
      'nome', v_proximo.first_name || ' ' || v_proximo.last_name,
      'whatsapp', v_proximo.whatsapp,
      'data', (v_proximo.available_date::text || 'T' || v_proximo.start_time)
    );
  end if;

  return json_build_object('erro', 'Nenhum corretor disponível');

end;
$$;

grant execute on function public.get_next_corretor() to anon;
grant execute on function public.get_next_corretor() to authenticated;
grant execute on function public.get_next_corretor() to service_role;
