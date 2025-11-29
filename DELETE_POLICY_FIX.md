# Fix for Deleted Notes Reappearing

## Problem
Notes can be deleted from the UI, but they reappear after editing another note. This is because the database has Row Level Security (RLS) policies that allow INSERT, SELECT, and UPDATE on `atomic_notes`, but no DELETE policy.

## Solution
A migration has been created at:
`/Users/shebert/dev/codex-machina/supabase/migrations/20241126230000_add_delete_policy.sql`

## How to Apply

### Option 1: Run via Supabase CLI (if configured)
```bash
supabase db push
```

### Option 2: Manual SQL in Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this SQL:

```sql
create policy "Users can delete own notes" on public.atomic_notes 
for delete 
using (auth.uid() = author_id);
```

## Verification
After running the migration:
1. Try deleting a note
2. Check the browser console - you should see: `Successfully deleted note: [id]`
3. Edit another note - the deleted note should NOT reappear
