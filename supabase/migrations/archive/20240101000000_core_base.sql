-- Core Base Schema (Reconstructed for v0.6 Production Init)

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  codex_name text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Characters table (one per user)
create table if not exists public.characters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null,
  level int default 1,
  xp_total int default 0,
  sp_reading int default 0,
  sp_thinking int default 0,
  sp_writing int default 0,
  sp_engagement int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Texts table
create table if not exists public.texts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  author text not null,
  type text not null, -- book, article, film, etc
  archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Units table
create table if not exists public.units (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  start_date date not null,
  end_date date not null,
  reflection_prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Actions table (log of points)
create table if not exists public.actions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  type text not null,
  xp int default 0,
  sp_reading int default 0,
  sp_thinking int default 0,
  sp_writing int default 0,
  sp_engagement int default 0,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Policies
alter table public.users enable row level security;
alter table public.characters enable row level security;
alter table public.texts enable row level security;
alter table public.units enable row level security;
alter table public.actions enable row level security;

-- Users Policies
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Characters Policies
create policy "Characters viewable by everyone" on public.characters for select using (true);

-- Texts Policies
create policy "Texts viewable by everyone" on public.texts for select using (true);

-- Units Policies
create policy "Units viewable by everyone" on public.units for select using (true);

-- Actions Policies
create policy "Actions viewable by owner and admin" on public.actions for select using (auth.uid() = user_id or exists (select 1 from public.users where id = auth.uid() and is_admin = true));

-- Functions for safe user creation (trigger)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, codex_name)
  values (new.id, new.email, 'Student ' || substr(new.id::text, 1, 4))
  on conflict (id) do nothing;
  
  insert into public.characters (user_id)
  values (new.id)
  on conflict do nothing;
  
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
