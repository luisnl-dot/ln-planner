-- LN Planner — initial schema (Phase 1)
-- Run this in the Supabase SQL editor (or via `supabase db push`).

-- ---------- Tables ----------
create table if not exists public.clients (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  handle       text,
  emoji        text,
  branche      text,
  cta          text,
  voice        text,
  hard_rules   text[] not null default '{}',
  hashtags_fix text[] not null default '{}',
  facts        text,
  created_at   timestamptz not null default now()
);

create table if not exists public.posts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  date       date not null,
  time       text,
  format     text,
  theme      text,
  caption    text,
  status     text not null default 'Neu',
  created_at timestamptz not null default now()
);

create table if not exists public.photos (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid references public.posts(id) on delete set null,
  client_id    uuid not null references public.clients(id) on delete cascade,
  storage_path text not null,
  created_at   timestamptz not null default now()
);

create index if not exists posts_client_id_idx on public.posts(client_id);
create index if not exists posts_date_idx       on public.posts(date);
create index if not exists photos_post_id_idx    on public.photos(post_id);
create index if not exists photos_client_id_idx  on public.photos(client_id);

-- ---------- Row Level Security ----------
-- Single-user app without auth (v1): allow the anon + authenticated roles full
-- access. The app is meant to live behind a private/obscure URL. Tighten this
-- once real auth is added.
alter table public.clients enable row level security;
alter table public.posts   enable row level security;
alter table public.photos  enable row level security;

drop policy if exists "clients all" on public.clients;
drop policy if exists "posts all"   on public.posts;
drop policy if exists "photos all"  on public.photos;

create policy "clients all" on public.clients
  for all to anon, authenticated using (true) with check (true);
create policy "posts all" on public.posts
  for all to anon, authenticated using (true) with check (true);
create policy "photos all" on public.photos
  for all to anon, authenticated using (true) with check (true);

-- ---------- Storage bucket ----------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photos bucket read"   on storage.objects;
drop policy if exists "photos bucket write"  on storage.objects;
drop policy if exists "photos bucket delete" on storage.objects;

create policy "photos bucket read" on storage.objects
  for select to anon, authenticated using (bucket_id = 'photos');
create policy "photos bucket write" on storage.objects
  for insert to anon, authenticated with check (bucket_id = 'photos');
create policy "photos bucket delete" on storage.objects
  for delete to anon, authenticated using (bucket_id = 'photos');
