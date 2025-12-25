-- Create a function to safely delete a user and all their data
create or replace function delete_user_data(target_user_id uuid)
returns void
language plpgsql
security definer
as $$
begin
  -- 1. Delete connections where user is author
  delete from public.connections where user_id = target_user_id;
  
  -- 2. Delete comments
  delete from public.comments where user_id = target_user_id;

  -- 3. Delete user achievements
  delete from public.user_achievements where user_id = target_user_id;

  -- 4. Delete points
  delete from public.points where user_id = target_user_id;

  -- 5. Delete notes (this might cascade to connections where note is source/target depending on FK)
  delete from public.notes where user_id = target_user_id;

  -- 6. Delete from public.users
  delete from public.users where id = target_user_id;

  -- 7. Delete from auth.users (Supabase Auth)
  -- Note: This requires the function to be called by a role with permission to delete from auth.users, 
  -- or we might just rely on the public delete and let the admin use the dashboard to invoke an edge function for the auth part.
  -- BUT, within Postgres functions, we can't easily access auth.users unless we are superuser.
  -- Standard practice: Delete public data here, then call Supabase Admin API in the server action to delete auth user.
end;
$$;
