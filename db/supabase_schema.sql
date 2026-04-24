-- CareLink Caribbean MVP schema (Supabase Postgres)
create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('parent', 'babysitter', 'admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.babysitter_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  bio text not null,
  hourly_rate numeric(10,2) not null,
  location text not null,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique(profile_id)
);

create table if not exists public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  babysitter_profile_id uuid not null references public.babysitter_profiles(id) on delete cascade,
  doc_type text not null check (doc_type in ('government_id', 'selfie')),
  file_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id),
  babysitter_id uuid not null references public.profiles(id),
  booking_date date not null,
  notes text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'rejected', 'cancelled')),
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references public.bookings(id) on delete cascade,
  parent_id uuid not null references public.profiles(id),
  babysitter_id uuid not null references public.profiles(id),
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.babysitter_profiles enable row level security;
alter table public.verification_documents enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

-- Profiles policies
create policy "users can read own profile" on public.profiles
for select using (auth.uid() = id);

create policy "users can insert own profile" on public.profiles
for insert with check (auth.uid() = id);

create policy "users can update own profile" on public.profiles
for update using (auth.uid() = id);

-- Babysitter profile policies
create policy "approved babysitters visible to everyone" on public.babysitter_profiles
for select using (is_approved = true or profile_id = auth.uid());

create policy "babysitters can manage own profile" on public.babysitter_profiles
for all using (profile_id = auth.uid()) with check (profile_id = auth.uid());

-- Verification document policies
create policy "babysitters manage own verification documents" on public.verification_documents
for all using (
  exists (
    select 1 from public.babysitter_profiles bp
    where bp.id = babysitter_profile_id and bp.profile_id = auth.uid()
  )
);

-- Bookings policies
create policy "participants can view bookings" on public.bookings
for select using (parent_id = auth.uid() or babysitter_id = auth.uid());

create policy "parents can create bookings" on public.bookings
for insert with check (parent_id = auth.uid());

create policy "babysitters can update own bookings" on public.bookings
for update using (babysitter_id = auth.uid());

-- Reviews policies
create policy "participants can view reviews" on public.reviews
for select using (parent_id = auth.uid() or babysitter_id = auth.uid());

create policy "parents can create reviews for their bookings" on public.reviews
for insert with check (parent_id = auth.uid());
