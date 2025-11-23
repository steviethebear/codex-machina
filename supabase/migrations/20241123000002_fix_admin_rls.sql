-- Fix RLS policies for Admin actions

-- Texts: Allow admins to insert and update
create policy "Admins can insert texts" on public.texts for insert with check (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

create policy "Admins can update texts" on public.texts for update using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- Units: Allow admins to insert and update
create policy "Admins can insert units" on public.units for insert with check (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

create policy "Admins can update units" on public.units for update using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- Actions: Allow admins to insert (for manual awards)
create policy "Admins can insert actions" on public.actions for insert with check (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- Characters: Allow admins to update (for manual adjustments if needed, though mostly RPC)
create policy "Admins can update characters" on public.characters for update using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);

-- Atomic Notes: Allow admins to update (for moderation/hiding)
create policy "Admins can update notes" on public.atomic_notes for update using (
  exists (select 1 from public.users where id = auth.uid() and is_admin = true)
);
