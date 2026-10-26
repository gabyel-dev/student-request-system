create table if not exists public.assistant_rate_limits (
  bucket_key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.assistant_rate_limits enable row level security;

drop policy if exists "Service role manages assistant rate limits"
  on public.assistant_rate_limits;

create policy "Service role manages assistant rate limits"
  on public.assistant_rate_limits
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create or replace function public.consume_assistant_rate_limits(p_buckets jsonb)
returns table (allowed boolean, retry_after integer, bucket_key text)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_now timestamptz := now();
  v_bucket jsonb;
  v_key text;
  v_limit integer;
  v_window integer;
  v_hits integer;
  v_start timestamptz;
  v_retry integer := 0;
  v_failed_key text := null;
begin
  for v_bucket in select * from jsonb_array_elements(p_buckets)
  loop
    v_key := v_bucket->>'key';
    v_limit := (v_bucket->>'limit')::integer;
    v_window := (v_bucket->>'window_seconds')::integer;

    insert into public.assistant_rate_limits (
      bucket_key,
      window_start,
      hits,
      updated_at
    )
    values (v_key, v_now, 1, v_now)
    on conflict on constraint assistant_rate_limits_pkey do update
      set hits = case
            when public.assistant_rate_limits.window_start
              <= v_now - make_interval(secs => v_window)
              then 1
            else public.assistant_rate_limits.hits + 1
          end,
          window_start = case
            when public.assistant_rate_limits.window_start
              <= v_now - make_interval(secs => v_window)
              then v_now
            else public.assistant_rate_limits.window_start
          end,
          updated_at = v_now
    returning hits, window_start into v_hits, v_start;

    if v_hits > v_limit and v_failed_key is null then
      v_failed_key := v_key;
      v_retry := greatest(
        1,
        ceil(
          extract(
            epoch from (v_start + make_interval(secs => v_window) - v_now)
          )
        )::integer
      );
    end if;
  end loop;

  return query select (v_failed_key is null), v_retry, v_failed_key;
end;
$$;

revoke all on function public.consume_assistant_rate_limits(jsonb)
  from public;
grant execute on function public.consume_assistant_rate_limits(jsonb)
  to service_role;
