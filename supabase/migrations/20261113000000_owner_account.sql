-- Store owner account: full admin-panel + inventory access.
-- (Maintenance mode is restricted to the developer account in application code.)

-- 1) Grant now, if the owner has already signed up and confirmed their email
insert into public.user_roles (user_id, role)
select id, 'admin'::app_role from auth.users
where lower(email) = 'we.are.versatile26@gmail.com' and email_confirmed_at is not null
on conflict (user_id, role) do nothing;

-- 2) Grant automatically on future sign-up / email confirmation
create or replace function public.grant_admin_for_allowlisted_email()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.email_confirmed_at is not null
     and lower(new.email) in ('codeswithdark83@gmail.com', 'we.are.versatile26@gmail.com') then
    insert into public.user_roles (user_id, role)
    values (new.id, 'admin')
    on conflict (user_id, role) do nothing;
  end if;
  return new;
end;
$$;

revoke all on function public.grant_admin_for_allowlisted_email() from public, anon, authenticated;
