-- Super-admin account suspension. Customer data, QR codes, and review history stay.

alter table public.profiles
  add column if not exists account_status text not null default 'active',
  add column if not exists suspension_reason text,
  add column if not exists suspended_at timestamptz,
  add column if not exists suspended_by uuid;

alter table public.profiles
  drop constraint if exists profiles_account_status_check;
alter table public.profiles
  add constraint profiles_account_status_check check (account_status in ('active', 'suspended'));

create table if not exists public.account_audit_log (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null,
  action text not null check (action in ('suspended', 'reactivated')),
  reason text,
  admin_id uuid not null,
  created_at timestamptz not null default now()
);

alter table public.account_audit_log enable row level security;
revoke all on public.account_audit_log from public, anon, authenticated;
grant select on public.account_audit_log to authenticated;
grant all on public.account_audit_log to service_role;

drop policy if exists "audit super admin read" on public.account_audit_log;
create policy "audit super admin read" on public.account_audit_log
  for select to authenticated
  using (public.is_super_admin(auth.uid()));

create or replace function public.caller_is_active()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select p.account_status is distinct from 'suspended'
      from public.profiles p
      where p.id = auth.uid()
    ),
    true
  );
$$;

revoke all on function public.caller_is_active() from public;
grant execute on function public.caller_is_active() to authenticated, service_role;

create or replace function public.protect_account_status()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.account_status is distinct from old.account_status
     or new.suspension_reason is distinct from old.suspension_reason
     or new.suspended_at is distinct from old.suspended_at
     or new.suspended_by is distinct from old.suspended_by then
    if current_setting('app.account_status_write', true) is distinct from '1' then
      raise exception 'Account status can only be changed by a super admin.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_account_status on public.profiles;
create trigger protect_account_status
  before update on public.profiles
  for each row
  execute function public.protect_account_status();

create or replace function public.admin_list_accounts()
returns table (
  id uuid,
  full_name text,
  email text,
  business_name text,
  registered_at timestamptz,
  last_sign_in_at timestamptz,
  account_status text,
  suspension_reason text
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_super_admin(auth.uid()) then
    raise exception 'Only a super admin can manage accounts.';
  end if;

  return query
  select
    p.id,
    p.full_name,
    p.email,
    (
      select string_agg(b.name, ', ' order by m.created_at)
      from public.business_members m
      join public.businesses b on b.id = m.business_id
      where m.user_id = p.id
    ) as business_name,
    u.created_at,
    u.last_sign_in_at,
    p.account_status,
    p.suspension_reason
  from public.profiles p
  join auth.users u on u.id = p.id
  where p.system_role <> 'super_admin'
  order by u.created_at desc;
end;
$$;

revoke all on function public.admin_list_accounts() from public, anon;
grant execute on function public.admin_list_accounts() to authenticated;

create or replace function public.revoke_account_sessions(_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.sessions where user_id = _user_id;
  begin
    delete from auth.refresh_tokens where user_id::text = _user_id::text;
  exception
    when undefined_table or undefined_column then
      null;
  end;
end;
$$;

revoke all on function public.revoke_account_sessions(uuid) from public, anon, authenticated;

create or replace function public.set_account_suspension(
  _user_id uuid,
  _suspend boolean,
  _reason text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  target public.profiles%rowtype;
  business_name text;
  stored_reason text := nullif(trim(coalesce(_reason, '')), '');
begin
  if not public.is_super_admin(actor) then
    raise exception 'Only a super admin can manage accounts.';
  end if;
  if _user_id = actor then
    raise exception 'You cannot suspend your own account.';
  end if;

  select * into target from public.profiles where id = _user_id for update;
  if target.id is null then
    raise exception 'Account not found.';
  end if;
  if target.system_role = 'super_admin' then
    raise exception 'A super admin account cannot be suspended here.';
  end if;

  select string_agg(b.name, ', ' order by m.created_at)
    into business_name
  from public.business_members m
  join public.businesses b on b.id = m.business_id
  where m.user_id = _user_id;

  perform set_config('app.account_status_write', '1', true);

  if _suspend then
    update public.profiles
    set account_status = 'suspended',
        suspension_reason = stored_reason,
        suspended_at = now(),
        suspended_by = actor
    where id = _user_id;

    update auth.users
    set banned_until = now() + interval '100 years'
    where id = _user_id;

    perform public.revoke_account_sessions(_user_id);

    insert into public.account_audit_log (account_id, action, reason, admin_id)
    values (_user_id, 'suspended', stored_reason, actor);
  else
    update public.profiles
    set account_status = 'active',
        suspension_reason = null,
        suspended_at = null,
        suspended_by = null
    where id = _user_id;

    update auth.users
    set banned_until = null
    where id = _user_id;

    perform public.revoke_account_sessions(_user_id);

    insert into public.account_audit_log (account_id, action, reason, admin_id)
    values (_user_id, 'reactivated', stored_reason, actor);
  end if;

  return jsonb_build_object(
    'id', target.id,
    'email', target.email,
    'full_name', target.full_name,
    'business_name', business_name,
    'account_status', case when _suspend then 'suspended' else 'active' end
  );
end;
$$;

revoke all on function public.set_account_suspension(uuid, boolean, text) from public, anon;
grant execute on function public.set_account_suspension(uuid, boolean, text) to authenticated;

-- Suspended sessions cannot read or change tenant data. Anonymous review pages stay open.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'businesses',
    'business_members',
    'service_categories',
    'business_services',
    'review_settings',
    'qr_codes',
    'review_sessions',
    'review_generations',
    'analytics_events',
    'template_fragments',
    'business_subscriptions',
    'google_connections',
    'google_locations',
    'google_reviews',
    'google_review_replies'
  ]
  loop
    execute format('drop policy if exists "active account required" on public.%I', table_name);
    execute format(
      'create policy "active account required" on public.%I as restrictive for all to authenticated using (public.caller_is_active()) with check (public.caller_is_active())',
      table_name
    );
  end loop;
end $$;

drop policy if exists "active account required profile write" on public.profiles;
create policy "active account required profile write" on public.profiles
  as restrictive
  for update to authenticated
  using (public.caller_is_active())
  with check (public.caller_is_active());

drop policy if exists "active account required profile insert" on public.profiles;
create policy "active account required profile insert" on public.profiles
  as restrictive
  for insert to authenticated
  with check (public.caller_is_active());

create or replace function public.reject_suspended_business_write()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() is not null and not public.caller_is_active() then
    raise exception 'Your account has been temporarily suspended. Please contact support.';
  end if;
  return new;
end;
$$;

drop trigger if exists reject_suspended_business_write on public.businesses;
create trigger reject_suspended_business_write
  before update on public.businesses
  for each row
  execute function public.reject_suspended_business_write();
