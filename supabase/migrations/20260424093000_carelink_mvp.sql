-- CareLink Caribbean MVP - Supabase migration
-- Creates core marketplace tables, enums, RLS policies, and storage bucket suggestions.

create extension if not exists pgcrypto;

-- Enums
create type public.user_role as enum ('parent', 'babysitter', 'admin');
create type public.verification_status as enum ('pending', 'approved', 'rejected');
create type public.booking_status as enum ('pending', 'accepted', 'rejected', 'cancelled', 'completed');

-- Helper functions for policies
create or replace function public.current_user_role()
returns public.user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

-- Tables
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text not null,
  role public.user_role not null default 'parent',
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.babysitter_profiles (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  bio text,
  years_experience int not null default 0,
  hourly_rate numeric(10, 2) not null,
  city text,
  country text,
  languages text[] not null default '{}',
  profile_photo_path text,
  verification_status public.verification_status not null default 'pending',
  approved_at timestamptz,
  approved_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.verification_documents (
  id uuid primary key default gen_random_uuid(),
  babysitter_profile_id uuid not null references public.babysitter_profiles(id) on delete cascade,
  id_image_path text,
  selfie_image_path text,
  status public.verification_status not null default 'pending',
  reviewed_by uuid references public.profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.profiles(id) on delete cascade,
  babysitter_id uuid not null references public.profiles(id) on delete cascade,
  requested_start_at timestamptz not null,
  requested_end_at timestamptz not null,
  address_line text,
  notes text,
  status public.booking_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint booking_time_valid check (requested_end_at > requested_start_at)
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings(id) on delete cascade,
  parent_id uuid not null references public.profiles(id) on delete cascade,
  babysitter_id uuid not null references public.profiles(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.babysitter_profiles enable row level security;
alter table public.verification_documents enable row level security;
alter table public.bookings enable row level security;
alter table public.reviews enable row level security;

-- Profiles policies
create policy "profiles_select_self"
on public.profiles for select
using (id = auth.uid());

create policy "profiles_update_self"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_admin_select_all"
on public.profiles for select
using (public.is_admin());

create policy "profiles_admin_update_all"
on public.profiles for update
using (public.is_admin())
with check (public.is_admin());

-- Babysitter profiles policies
create policy "babysitter_profiles_parent_select_approved"
on public.babysitter_profiles for select
using (
  verification_status = 'approved'
  and public.current_user_role() = 'parent'
);

create policy "babysitter_profiles_owner_select"
on public.babysitter_profiles for select
using (profile_id = auth.uid());

create policy "babysitter_profiles_owner_update"
on public.babysitter_profiles for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());

create policy "babysitter_profiles_owner_insert"
on public.babysitter_profiles for insert
with check (profile_id = auth.uid());

create policy "babysitter_profiles_admin_select_all"
on public.babysitter_profiles for select
using (public.is_admin());

create policy "babysitter_profiles_admin_update_all"
on public.babysitter_profiles for update
using (public.is_admin())
with check (public.is_admin());

-- Verification documents policies
create policy "verification_docs_owner_select"
on public.verification_documents for select
using (
  exists (
    select 1
    from public.babysitter_profiles bp
    where bp.id = babysitter_profile_id
      and bp.profile_id = auth.uid()
  )
);

create policy "verification_docs_owner_insert"
on public.verification_documents for insert
with check (
  exists (
    select 1
    from public.babysitter_profiles bp
    where bp.id = babysitter_profile_id
      and bp.profile_id = auth.uid()
  )
);

create policy "verification_docs_owner_update"
on public.verification_documents for update
using (
  exists (
    select 1
    from public.babysitter_profiles bp
    where bp.id = babysitter_profile_id
      and bp.profile_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.babysitter_profiles bp
    where bp.id = babysitter_profile_id
      and bp.profile_id = auth.uid()
  )
);

create policy "verification_docs_admin_select_all"
on public.verification_documents for select
using (public.is_admin());

create policy "verification_docs_admin_update_all"
on public.verification_documents for update
using (public.is_admin())
with check (public.is_admin());

-- Bookings policies
create policy "bookings_parent_insert"
on public.bookings for insert
with check (
  parent_id = auth.uid()
  and status = 'pending'
);

create policy "bookings_parent_select_own"
on public.bookings for select
using (parent_id = auth.uid());

create policy "bookings_babysitter_select_assigned"
on public.bookings for select
using (babysitter_id = auth.uid());

create policy "bookings_babysitter_update_status"
on public.bookings for update
using (babysitter_id = auth.uid())
with check (babysitter_id = auth.uid());

create policy "bookings_admin_select_all"
on public.bookings for select
using (public.is_admin());

create policy "bookings_admin_update_all"
on public.bookings for update
using (public.is_admin())
with check (public.is_admin());

-- Reviews (minimal ownership/admin visibility)
create policy "reviews_participants_select"
on public.reviews for select
using (parent_id = auth.uid() or babysitter_id = auth.uid() or public.is_admin());

create policy "reviews_parent_insert"
on public.reviews for insert
with check (parent_id = auth.uid());

-- Suggested storage buckets for document/image uploads
insert into storage.buckets (id, name, public)
values
  ('ids', 'ids', false),
  ('selfies', 'selfies', false),
  ('profile_photos', 'profile_photos', true)
on conflict (id) do nothing;

-- Suggested storage policies
create policy "ids_owner_access"
on storage.objects for all
using (bucket_id = 'ids' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'ids' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "selfies_owner_access"
on storage.objects for all
using (bucket_id = 'selfies' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'selfies' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "profile_photos_public_read"
on storage.objects for select
using (bucket_id = 'profile_photos');

create policy "profile_photos_owner_write"
on storage.objects for insert
with check (bucket_id = 'profile_photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "profile_photos_owner_update_delete"
on storage.objects for update
using (bucket_id = 'profile_photos' and auth.uid()::text = (storage.foldername(name))[1])
with check (bucket_id = 'profile_photos' and auth.uid()::text = (storage.foldername(name))[1]);
