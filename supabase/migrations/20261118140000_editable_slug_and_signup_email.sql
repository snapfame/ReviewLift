-- Editable review slugs keep the old address working, and registration
-- emails are queued when the account is created.

alter table public.businesses
  add column if not exists qr_reprint_required boolean not null default false;

create table if not exists public.business_slug_redirects (
  slug text primary key,
  business_id uuid not null references public.businesses (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists business_slug_redirects_business_id_idx
  on public.business_slug_redirects (business_id);

alter table public.business_slug_redirects enable row level security;
revoke all on public.business_slug_redirects from public, anon, authenticated;
grant select, insert, update, delete on public.business_slug_redirects to service_role;

create or replace function public.resolve_business_slug(_slug text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select b.slug
  from public.business_slug_redirects r
  join public.businesses b on b.id = r.business_id
  where r.slug = lower(trim(_slug))
    and b.status = 'active'
  limit 1;
$$;

revoke all on function public.resolve_business_slug(text) from public;
grant execute on function public.resolve_business_slug(text) to anon, authenticated, service_role;

create or replace function public.change_business_slug(_business_id uuid, _slug text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor uuid := auth.uid();
  current_slug text;
  next_slug text;
  member_role public.member_role;
  reserved text[] := array[
    'about','account','admin','api','app','assets','auth','brand','callback','contact',
    'dashboard','edit','favicon','features','forgot-password','how-it-works','internal',
    'login','mail','new','null','onboarding','pricing','privacy','public','qr','r',
    'reset-password','settings','signup','static','terms','undefined','www'
  ];
begin
  if actor is null then
    return jsonb_build_object('ok', false, 'error', 'You need to be logged in.');
  end if;

  select m.role into member_role
  from public.business_members m
  where m.business_id = _business_id and m.user_id = actor;

  if member_role is null and not public.is_super_admin(actor) then
    return jsonb_build_object('ok', false, 'error', 'You cannot edit this business.');
  end if;
  if member_role = 'business_staff' and not public.is_super_admin(actor) then
    return jsonb_build_object('ok', false, 'error', 'Only an owner or admin can change the review URL.');
  end if;

  next_slug := lower(trim(coalesce(_slug, '')));
  if next_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
     or char_length(next_slug) < 3
     or char_length(next_slug) > 60
     or next_slug = any (reserved) then
    return jsonb_build_object('ok', false, 'error', 'Use 3–60 letters, numbers, and single hyphens. That name may be reserved.');
  end if;

  select b.slug into current_slug
  from public.businesses b
  where b.id = _business_id
  for update;

  if current_slug is null then
    return jsonb_build_object('ok', false, 'error', 'Business not found.');
  end if;
  if current_slug = next_slug then
    return jsonb_build_object('ok', true, 'slug', next_slug, 'changed', false);
  end if;

  if exists (
    select 1 from public.businesses b
    where b.slug = next_slug and b.id <> _business_id
  ) or exists (
    select 1 from public.business_slug_redirects r
    where r.slug = next_slug and r.business_id <> _business_id
  ) then
    return jsonb_build_object('ok', false, 'error', 'That review URL is already in use.');
  end if;

  delete from public.business_slug_redirects
  where slug = next_slug and business_id = _business_id;

  insert into public.business_slug_redirects (slug, business_id)
  values (current_slug, _business_id);

  update public.businesses
  set slug = next_slug,
      qr_reprint_required = true
  where id = _business_id;

  update public.qr_codes
  set destination_slug = next_slug,
      status = 'active'
  where business_id = _business_id;

  if not found then
    insert into public.qr_codes (business_id, code, destination_slug, status)
    values (
      _business_id,
      next_slug || '-' || substr(replace(_business_id::text, '-', ''), 1, 8),
      next_slug,
      'active'
    );
  end if;

  return jsonb_build_object('ok', true, 'slug', next_slug, 'changed', true);
exception
  when unique_violation then
    return jsonb_build_object('ok', false, 'error', 'That review URL is already in use.');
end;
$$;

revoke all on function public.change_business_slug(uuid, text) from public, anon;
grant execute on function public.change_business_slug(uuid, text) to authenticated, service_role;

alter table public.registration_notifications
  add column if not exists welcome_error text,
  add column if not exists admin_error text;

create or replace function public.enqueue_confirmed_registration()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  secret text;
  endpoint text;
  request_id bigint;
begin
  if tg_op <> 'INSERT' or new.email is null then
    return new;
  end if;

  insert into public.registration_notifications (user_id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(trim(coalesce(new.raw_user_meta_data->>'full_name', '')), '')
  )
  on conflict (user_id) do nothing;

  secret := nullif(current_setting('app.registration_notify_secret', true), '');
  endpoint := nullif(current_setting('app.registration_notify_url', true), '');
  if secret is null or endpoint is null then
    raise warning 'registration email queued for % but the notify URL or secret is not set', new.id;
    return new;
  end if;

  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise warning 'registration email queued for % but pg_net is not installed', new.id;
    return new;
  end if;

  begin
    execute
      'select net.http_post(url := $1, headers := $2, body := $3)'
      into request_id
      using endpoint,
        jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || secret
        ),
        jsonb_build_object('user_id', new.id, 'event', 'insert');
  exception when others then
    raise warning 'registration email notify failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

drop trigger if exists on_auth_user_confirmed on auth.users;
drop trigger if exists on_auth_user_registered_email on auth.users;
create trigger on_auth_user_registered_email
  after insert on auth.users
  for each row
  execute function public.enqueue_confirmed_registration();
