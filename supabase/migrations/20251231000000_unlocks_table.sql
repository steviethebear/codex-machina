-- Create table for feature unlocks
create table if not exists public.unlocks (
    user_id uuid references auth.users(id) on delete cascade not null,
    feature text not null,
    unlocked_at timestamptz default now(),
    check_metadata jsonb default '{}'::jsonb,
    primary key (user_id, feature)
);

-- RLS Policies
alter table public.unlocks enable row level security;

create policy "Users can view their own unlocks"
    on public.unlocks for select
    using (auth.uid() = user_id);

-- Admins can view/edit all unlocks
create policy "Admins can view all unlocks"
    on public.unlocks for select
    using (
        exists (
            select 1 from public.users
            where id = auth.uid() and is_admin = true
        )
    );

create policy "Admins can insert unlocks"
    on public.unlocks for insert
    with check (
        exists (
            select 1 from public.users
            where id = auth.uid() and is_admin = true
        ) OR auth.uid() = user_id -- Allow self-insert via server action (security definer wrapper)
    );
-- Note: Better to handle inserts via security definer function or service role,
-- but for simplicity we allow admins directly.
-- The server action will likely use service role or admin privilege.

create policy "Admins can delete unlocks"
    on public.unlocks for delete
    using (
        exists (
            select 1 from public.users
            where id = auth.uid() and is_admin = true
        )
    );
