-- Allow multiple availability rows per (broker_id, available_date) so brokers
-- can have more than one period on the same day (e.g. 09:00-12:00 and 14:00-18:00).

alter table public.broker_availability
  drop constraint if exists broker_availability_broker_id_available_date_key;
