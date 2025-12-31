-- Add DELETE policy for atomic_notes
-- Users should be able to delete their own notes

create policy "Users can delete own notes" on public.atomic_notes 
for delete 
using (auth.uid() = author_id);
