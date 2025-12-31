-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (extends auth.users)
create table public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  codex_name text,
  is_admin boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Characters table (one per user)
create table public.characters (
  id uuid default uuid_generate_v4() primary key,
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
create table public.texts (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  author text not null,
  type text not null, -- book, article, film, etc
  archived boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Units table
create table public.units (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  start_date date not null,
  end_date date not null,
  reflection_prompt text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Atomic Notes table
create table public.atomic_notes (
  id uuid default uuid_generate_v4() primary key,
  author_id uuid references public.users(id) not null,
  character_id uuid references public.characters(id) not null,
  text_id uuid references public.texts(id), -- nullable
  title text not null,
  body text not null,
  type text not null, -- idea, question, quote, insight
  tags text[],
  hidden boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Links table
create table public.links (
  id uuid default uuid_generate_v4() primary key,
  from_note_id uuid references public.atomic_notes(id) not null,
  to_note_id uuid, -- can be note or text, but FK constraints are tricky if mixed. 
                   -- For simplicity, let's assume to_note_id points to atomic_notes. 
                   -- If linking to text, we might need a separate column or a polymorphic approach.
                   -- Requirement says "create links from one note to another or to a text".
                   -- Let's add to_text_id as nullable.
  to_text_id uuid references public.texts(id),
  relation_type text not null, -- supports, extends, questions, contrasts
  explanation text not null,
  created_by uuid references public.users(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Constraint: Must have either to_note_id OR to_text_id, not both (or handle in app logic)
  constraint link_target_check check (
    (to_note_id is not null and to_text_id is null) or
    (to_note_id is null and to_text_id is not null)
  )
);

-- Add FK for to_note_id separately to avoid circular dependency issues during creation if not careful, 
-- but here it's fine.
alter table public.links add constraint links_to_note_id_fkey foreign key (to_note_id) references public.atomic_notes(id);


-- Reflections table
create table public.reflections (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  unit_id uuid references public.units(id) not null,
  body text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Actions table (log of points)
create table public.actions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.users(id) not null,
  type text not null, -- CREATE_NOTE, LINK_NOTE, REFLECTION, MANUAL_AWARD, HUB_BONUS
  xp int default 0,
  sp_reading int default 0,
  sp_thinking int default 0,
  sp_writing int default 0,
  sp_engagement int default 0,
  description text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Hub Tracking (Materialized view or simple table updated by triggers/app)
-- For simplicity, let's make it a view for now, or a table if we need performance.
-- Requirement: "Question note becomes a hub (3+ links)..."
-- Let's use a view to calculate incoming links count dynamically.
create view public.hub_stats as
select 
  to_note_id as note_id,
  count(*) as incoming_links_count
from public.links
where to_note_id is not null
group by to_note_id;

-- RLS Policies (Basic setup)
alter table public.users enable row level security;
alter table public.characters enable row level security;
alter table public.texts enable row level security;
alter table public.units enable row level security;
alter table public.atomic_notes enable row level security;
alter table public.links enable row level security;
alter table public.reflections enable row level security;
alter table public.actions enable row level security;

-- Users can read all users (for codex names), but only update their own
create policy "Users are viewable by everyone" on public.users for select using (true);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Characters viewable by everyone (leaderboard), update by system/admin only (handled via functions usually, or simple RLS)
create policy "Characters viewable by everyone" on public.characters for select using (true);

-- Texts viewable by everyone, insert/update by admin only
create policy "Texts viewable by everyone" on public.texts for select using (true);

-- Units viewable by everyone
create policy "Units viewable by everyone" on public.units for select using (true);

-- Notes viewable by everyone (unless hidden)
create policy "Notes viewable by everyone" on public.atomic_notes for select using (hidden = false);
create policy "Users can insert own notes" on public.atomic_notes for insert with check (auth.uid() = author_id);
create policy "Users can update own notes" on public.atomic_notes for update using (auth.uid() = author_id);

-- Links viewable by everyone
create policy "Links viewable by everyone" on public.links for select using (true);
create policy "Users can insert links" on public.links for insert with check (auth.uid() = created_by);

-- Reflections viewable by admin, and own
create policy "Reflections viewable by owner and admin" on public.reflections for select using (auth.uid() = user_id or exists (select 1 from public.users where id = auth.uid() and is_admin = true));
create policy "Users can insert reflections" on public.reflections for insert with check (auth.uid() = user_id);

-- Actions viewable by owner and admin
create policy "Actions viewable by owner and admin" on public.actions for select using (auth.uid() = user_id or exists (select 1 from public.users where id = auth.uid() and is_admin = true));

-- Functions for safe user creation (trigger)
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.users (id, email, codex_name)
  values (new.id, new.email, 'Student ' || substr(new.id::text, 1, 4)); -- Default codex name
  
  insert into public.characters (user_id)
  values (new.id);
  
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
