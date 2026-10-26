create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  profile_picture_url text,
  section text,
  student_number text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.users
  add column if not exists profile_picture_url text;

insert into storage.buckets (id, name, public)
values ('profile_pictures', 'profile_pictures', true)
on conflict (id) do update set public = true;

-- Profile images are public because the dashboard uses their public Supabase URL as its image src.
do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anyone can read profile pictures'
  ) then
    create policy "Anyone can read profile pictures"
      on storage.objects
      for select
      using (bucket_id = 'profile_pictures');
  end if;
end
$$;

-- Enable Row Level Security
alter table public.users enable row level security;

-- Allow authenticated users (service_role) full access
create policy "Service role has full access"
  on public.users
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Allow anon users to read (for public profile lookups if needed)
create policy "Anon can read users"
  on public.users
  for select
  using (true);

-- Allow anon users to insert (for new user registration via OAuth)
create policy "Anon can insert users"
  on public.users
  for insert
  with check (true);

-- Refresh tokens are long-lived credentials used to silently renew the short-lived access token.
-- We only store the SHA-256 hash of the token, never the raw value, so a DB leak can't be replayed.
create table if not exists public.refresh_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  token_hash text not null,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

-- Queue numbers are assigned PER SECTION, so the same number (e.g. Queue 1) is
-- valid in every section at the same time. `section` is snapshotted onto the
-- request at creation (from the student's profile) so archival stays correct
-- even if the student later changes sections. Archived rows keep their original
-- queue number; only the active (archived_at is null) cycle starts back at 1.
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_type text not null,
  section text,
  queue_number integer not null,
  status text not null default 'pending',
  notes text,
  proof_url text,
  archived_at timestamptz,
  -- Set when the student files this request away from their dashboard. This is
  -- separate from archived_at, which closes the admin queue cycle.
  student_archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Proofs and notes can be added later, so keep the columns idempotent.
alter table public.requests
  add column if not exists notes text;
alter table public.requests
  add column if not exists proof_url text;
alter table public.requests
  add column if not exists section text;
alter table public.requests
  add column if not exists archived_at timestamptz;
alter table public.requests
  add column if not exists student_archived_at timestamptz;

-- Backfill: snapshot each request's section from its owner's profile. This also
-- makes the admin queue groupable by section before any new requests are made.
update public.requests
   set section = public.users.section
  from public.users
 where public.requests.user_id = public.users.id
   and public.requests.section is null;

-- One-time cleanup for existing data: if two ACTIVE requests ever ended up with
-- the same (section, queue_number) — e.g. from concurrent inserts before the
-- guard below existed — move the later duplicates to the section's next free
-- number so the unique index can be created. Archived records are never touched.
do $$
declare
  r record;
  v_next integer;
begin
  for r in
    select id, section, queue_number
      from (
        select id, section, queue_number,
               row_number() over (
                 partition by section, queue_number
                 order by created_at, id
               ) as rnk
          from public.requests
         where archived_at is null
           and section is not null
      ) dupes
     where dupes.rnk > 1
     order by dupes.section, dupes.queue_number, dupes.created_at, dupes.id
  loop
    select coalesce(max(queue_number), 0) + 1
      into v_next
      from public.requests
     where section = r.section
       and archived_at is null;
    update public.requests set queue_number = v_next where id = r.id;
  end loop;
end
$$;

-- Hard guarantee that a section can never have two requests with the same queue
-- number inside the same active cycle. Archived cycles may reuse numbers (that's
-- by design — every section restarts at 1 each cycle).
create unique index if not exists requests_active_section_queue_uq
  on public.requests (section, queue_number)
  where archived_at is null;

-- Index for per-request user queries (countTodayByUser, findLastByUser, findByUserId)
create index if not exists idx_requests_user_created
  on public.requests (user_id, created_at desc);

-- Index for the student archive page.
create index if not exists idx_requests_user_student_archived
  on public.requests (user_id, student_archived_at desc)
  where student_archived_at is not null;


-- Index for active request checks by user + document type
create index if not exists idx_requests_user_doc_active
  on public.requests (user_id, document_type, archived_at, status)
  where archived_at is null;


-- Index for admin fetching requests by section
create index if not exists idx_requests_section_archived
  on public.requests (section, archived_at);

create policy "Service role has full request access"
  on public.requests
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

-- Real-time updates (Supabase Realtime)
-- ---------------------------------------
-- The dashboards subscribe to live changes on `requests` using the browser
-- (anon key) Supabase client. Two database details make that feed work:
--
-- 1. The table must be part of the `supabase_realtime` publication so Postgres
--    writes its changes to the WAL that Realtime listens to.
-- 2. The role used to subscribe (anon) must be allowed to SELECT the row,
--    because Realtime applies Row Level Security BEFORE broadcasting a change.
--
-- Mutations still happen exclusively through Server Actions backed by the
-- service-role key + in-app checks, so this anon read-only policy only unlocks
-- the live feed; it never permits direct writes from the browser.
alter table public.requests enable row level security;

do $$
begin
  if not exists (
    select 1
    from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'requests'
  ) then
    alter publication supabase_realtime add table public.requests;
  end if;
end
$$;

create policy "Anon can read requests for realtime"
  on public.requests
  for select
  using (true);

-- Students attach a supporting file (proof) to their request so staff can verify it faster.
insert into storage.buckets (id, name, public)
values ('request_proofs', 'request_proofs', true)
on conflict (id) do update set public = true;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Anyone can read request proofs'
  ) then
    create policy "Anyone can read request proofs"
      on storage.objects
      for select
      using (bucket_id = 'request_proofs');
  end if;
end
$$;

-- Per-user and global assistant rate limits. The route calls the RPC with one
-- bucket per limit; the RPC increments all buckets and reports the first one
-- that is over its limit.
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
