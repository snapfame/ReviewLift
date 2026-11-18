-- One row per confirmed registration. Service role only.
-- The browser cannot read or write this table.

create table public.registration_notifications (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  welcome_sent_at timestamptz,
  admin_sent_at timestamptz,
  attempt_started_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

alter table public.registration_notifications enable row level security;
grant select, insert, update on public.registration_notifications to service_role;

create or replace function public.claim_registration_notification(
  _user_id uuid,
  _email text,
  _full_name text
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  row public.registration_notifications%rowtype;
begin
  if _email is null or length(trim(_email)) = 0 then
    raise exception 'email is required';
  end if;

  insert into public.registration_notifications (user_id, email, full_name)
  values (_user_id, trim(_email), nullif(trim(_full_name), ''))
  on conflict (user_id) do nothing;

  select * into row
  from public.registration_notifications
  where user_id = _user_id
  for update;

  if row.user_id is null then
    raise exception 'registration notification row missing';
  end if;

  if row.welcome_sent_at is not null and row.admin_sent_at is not null then
    return jsonb_build_object('state', 'sent');
  end if;

  if row.attempt_started_at is not null
     and row.attempt_started_at > now() - interval '2 minutes' then
    return jsonb_build_object('state', 'in_progress');
  end if;

  update public.registration_notifications
  set email = trim(_email),
      full_name = nullif(trim(_full_name), ''),
      attempt_started_at = now(),
      last_error = null
  where user_id = _user_id;

  return jsonb_build_object(
    'state', 'claimed',
    'send_welcome', row.welcome_sent_at is null,
    'send_admin', row.admin_sent_at is null
  );
end;
$$;

revoke all on function public.claim_registration_notification(uuid, text, text) from public, anon, authenticated;
grant execute on function public.claim_registration_notification(uuid, text, text) to service_role;

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
  if tg_op <> 'UPDATE' then
    return new;
  end if;
  if old.email_confirmed_at is not null or new.email_confirmed_at is null then
    return new;
  end if;
  if new.email is null then
    raise warning 'registration notify skipped: confirmed user % has no email', new.id;
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
    raise warning 'registration notify queued for % but app.registration_notify_secret or app.registration_notify_url is not set', new.id;
    return new;
  end if;

  if not exists (select 1 from pg_extension where extname = 'pg_net') then
    raise warning 'registration notify queued for % but pg_net is not installed', new.id;
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
        jsonb_build_object('user_id', new.id);
  exception when others then
    raise warning 'registration notify http failed for %: %', new.id, sqlerrm;
  end;

  return new;
end;
$$;

revoke all on function public.enqueue_confirmed_registration() from public, anon, authenticated;

drop trigger if exists on_auth_user_confirmed on auth.users;
create trigger on_auth_user_confirmed
  after update of email_confirmed_at on auth.users
  for each row
  execute function public.enqueue_confirmed_registration();
