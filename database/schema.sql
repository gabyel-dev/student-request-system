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
