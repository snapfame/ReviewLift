-- Public customer flow RPCs, tighter grants, and the logo storage bucket.
-- These complement the initial schema so the review page works without a
-- service-role key in the browser, while keeping tenant data isolated.

create or replace function public.public_business_status(_slug text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when not exists (select 1 from public.businesses b where b.slug = _slug) then 'not_found'
    when exists (select 1 from public.businesses b where b.slug = _slug and b.status = 'active') then 'ok'
    else 'unavailable'
  end;
$$;

revoke all on function public.public_business_status(text) from public;
grant execute on function public.public_business_status(text) to anon, authenticated;

create or replace function public.start_review_session(
  _business_id uuid,
  _service_ids jsonb,
  _from_qr boolean default false
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  sid uuid;
  qid uuid;
  token text;
begin
  if not public.is_business_active(_business_id) then
    raise exception 'Business unavailable';
  end if;
  if jsonb_typeof(_service_ids) is distinct from 'array' or jsonb_array_length(_service_ids) < 1 then
    raise exception 'At least one service is required';
  end if;
  if _from_qr then
    select id into qid from public.qr_codes where business_id = _business_id order by created_at asc limit 1;
  end if;
  token := replace(gen_random_uuid()::text, '-', '');
  insert into public.review_sessions (business_id, qr_code_id, session_token, selected_service_ids)
  values (_business_id, qid, token, _service_ids)
  returning id into sid;
  return sid;
end;
$$;

revoke all on function public.start_review_session(uuid, jsonb, boolean) from public;
grant execute on function public.start_review_session(uuid, jsonb, boolean) to anon, authenticated;

create or replace function public.recent_review_signatures(_business_id uuid, _limit int default 300)
returns table(review_hash text, normalized_text text)
language sql
stable
security definer
set search_path = public
as $$
  select rg.review_hash, rg.normalized_text
  from public.review_generations rg
  where rg.business_id = _business_id
    and public.is_business_active(_business_id)
  order by rg.created_at desc
  limit least(greatest(coalesce(_limit, 300), 1), 400);
$$;

revoke all on function public.recent_review_signatures(uuid, int) from public;
grant execute on function public.recent_review_signatures(uuid, int) to anon, authenticated;

create or replace function public.save_review_generation(
  _session_id uuid,
  _review_text text,
  _normalized_text text,
  _review_hash text,
  _language public.review_language,
  _review_length public.review_length,
  _structure_signature text
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  bid uuid;
  gid uuid;
  next_num int;
begin
  select business_id into bid from public.review_sessions where id = _session_id;
  if bid is null then
    raise exception 'Session not found';
  end if;
  if not public.is_business_active(bid) then
    raise exception 'Business unavailable';
  end if;
  if exists (
    select 1 from public.review_generations g
    where g.business_id = bid and g.review_hash = _review_hash
  ) then
    raise exception 'duplicate_hash';
  end if;

  select coalesce(max(generation_number), 0) + 1 into next_num
  from public.review_generations
  where session_id = _session_id;

  insert into public.review_generations (
    business_id, session_id, review_text, normalized_text, review_hash,
    language, review_length, structure_signature, generation_number
  ) values (
    bid, _session_id, _review_text, _normalized_text, _review_hash,
    _language, _review_length, _structure_signature, next_num
  ) returning id into gid;

  return gid;
end;
$$;

revoke all on function public.save_review_generation(uuid, text, text, text, public.review_language, public.review_length, text) from public;
grant execute on function public.save_review_generation(uuid, text, text, text, public.review_language, public.review_length, text) to anon, authenticated;

create or replace function public.mark_review_generation(
  _generation_id uuid,
  _action text,
  _text text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  rec public.review_generations%rowtype;
  patch_text text;
begin
  select * into rec from public.review_generations where id = _generation_id;
  if not found then
    return false;
  end if;
  if not public.is_business_active(rec.business_id) then
    return false;
  end if;

  patch_text := nullif(trim(coalesce(_text, '')), '');
  if patch_text is not null and patch_text is distinct from rec.review_text then
    update public.review_generations
    set review_text = patch_text, edited = true
    where id = rec.id;
  end if;
  if _action = 'edited' then
    update public.review_generations set edited = true where id = rec.id;
  end if;
  if _action = 'copied' then
    update public.review_generations set copied_at = now() where id = rec.id;
  end if;
  if _action = 'google_clicked' then
    update public.review_generations set google_clicked_at = now() where id = rec.id;
  end if;
  if _action in ('google_clicked', 'completed') then
    update public.review_sessions set completed_at = now() where id = rec.session_id;
  end if;
  return true;
end;
$$;

revoke all on function public.mark_review_generation(uuid, text, text) from public;
grant execute on function public.mark_review_generation(uuid, text, text) to anon, authenticated;

create or replace function public.record_fragment_usage(
  _language public.review_language,
  _fragment_type text,
  _content text,
  _attribute_key text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.template_fragments
  set usage_count = usage_count + 1, last_used_at = now()
  where language = _language
    and fragment_type = _fragment_type
    and content = _content
    and business_id is null;
  if not found then
    insert into public.template_fragments (
      business_id, language, fragment_type, content, attribute_key, usage_count, last_used_at
    ) values (
      null, _language, _fragment_type, _content, _attribute_key, 1, now()
    );
  end if;
end;
$$;

revoke all on function public.record_fragment_usage(public.review_language, text, text, text) from public;
grant execute on function public.record_fragment_usage(public.review_language, text, text, text) to anon, authenticated;

create or replace function public.update_review_session(
  _session_id uuid,
  _experience public.experience_rating,
  _attributes jsonb,
  _note text,
  _language public.review_language
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  bid uuid;
begin
  select business_id into bid from public.review_sessions where id = _session_id;
  if bid is null or not public.is_business_active(bid) then
    return false;
  end if;
  update public.review_sessions
  set experience_rating = _experience,
      selected_attributes = coalesce(_attributes, '[]'::jsonb),
      customer_note = _note,
      selected_language = _language
  where id = _session_id;
  return true;
end;
$$;

revoke all on function public.update_review_session(uuid, public.experience_rating, jsonb, text, public.review_language) from public;
grant execute on function public.update_review_session(uuid, public.experience_rating, jsonb, text, public.review_language) to anon, authenticated;

create policy "fragments public read global" on public.template_fragments
  for select to anon, authenticated
  using (business_id is null and active);

create or replace function public.unique_business_slug(_base text)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  candidate text;
  n int := 1;
begin
  candidate := _base;
  while exists (select 1 from public.businesses b where b.slug = candidate) loop
    n := n + 1;
    candidate := _base || '-' || n::text;
  end loop;
  return candidate;
end;
$$;

revoke all on function public.unique_business_slug(text) from public;
grant execute on function public.unique_business_slug(text) to authenticated;

-- Public session/generation writes are handled by the RPCs above (security definer).
-- Keep member policies for dashboard reads. Do not grant anon SELECT on drafts.

revoke execute on function public.is_super_admin(uuid) from public, anon;
grant execute on function public.is_super_admin(uuid) to authenticated;
revoke execute on function public.is_business_member(uuid, uuid) from public, anon;
grant execute on function public.is_business_member(uuid, uuid) to authenticated;

grant select on public.template_fragments to anon;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'business-logos',
  'business-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;
