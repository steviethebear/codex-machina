-- Create evaluations table for AI Rubric Feedback
create table if not exists evaluations (
    id uuid default gen_random_uuid() primary key,
    student_id uuid references auth.users(id) on delete cascade not null,
    teacher_id uuid references auth.users(id) on delete set null,
    content text not null, -- The narrative feedback (markdown)
    score integer, -- The suggested rubric score (1-4)
    date_range text, -- e.g. '7d', '14d', '30d'
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table evaluations enable row level security;

-- Policies
create policy "Admins can view all evaluations"
    on evaluations for select
    using ( exists (select 1 from users where id = auth.uid() and is_admin = true) );

create policy "Admins can insert evaluations"
    on evaluations for insert
    with check ( exists (select 1 from users where id = auth.uid() and is_admin = true) );

create policy "Admins can delete evaluations"
    on evaluations for delete
    using ( exists (select 1 from users where id = auth.uid() and is_admin = true) );

-- Students can view their own evaluations
create policy "Students can view own evaluations"
    on evaluations for select
    using ( auth.uid() = student_id );
