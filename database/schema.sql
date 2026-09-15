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

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  document_type text not null,
  queue_number integer not null,
  status text not null default 'pending',
  notes text,
  proof_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Proofs and notes can be added later, so keep the columns idempotent.
alter table public.requests
  add column if not exists notes text;
alter table public.requests
  add column if not exists proof_url text;



create policy "Service role has full request access"
  on public.requests
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

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
