
create type public.system_role as enum ('user','super_admin');
create type public.member_role as enum ('business_owner','business_staff','business_admin');
create type public.business_status as enum ('active','paused','inactive');
create type public.review_language as enum ('english','hinglish','hindi');
create type public.review_length as enum ('short','medium','detailed');
create type public.experience_rating as enum ('excellent','good','average','not_good');

create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  system_role public.system_role not null default 'user',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create or replace function public.is_super_admin(_user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles p where p.id = _user_id and p.system_role = 'super_admin');
$$;

create table public.businesses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  category text,
  phone text,
  address_line text,
  city text,
  state text,
  postal_code text,
  country text default 'India',
  website_url text,
  google_review_url text,
  instagram_url text,
  accent_color text default '#1f6feb',
  status public.business_status not null default 'active',
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.businesses to authenticated;
grant select on public.businesses to anon;
grant all on public.businesses to service_role;
alter table public.businesses enable row level security;

create table public.business_members (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.member_role not null default 'business_owner',
  created_at timestamptz not null default now(),
  unique (business_id, user_id)
);
grant select, insert, update, delete on public.business_members to authenticated;
grant all on public.business_members to service_role;
alter table public.business_members enable row level security;

create or replace function public.is_business_member(_business_id uuid, _user_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.business_members m where m.business_id = _business_id and m.user_id = _user_id)
      or public.is_super_admin(_user_id);
$$;

create or replace function public.is_business_active(_business_id uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.businesses b where b.id = _business_id and b.status = 'active');
$$;

create policy "profiles self read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin(auth.uid()));
create policy "profiles self insert" on public.profiles for insert to authenticated
  with check (id = auth.uid());
create policy "profiles self update" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_super_admin(auth.uid()))
  with check (id = auth.uid() or public.is_super_admin(auth.uid()));

create policy "businesses public read active" on public.businesses for select to anon
  using (status = 'active');
create policy "businesses member read" on public.businesses for select to authenticated
  using (public.is_business_member(id, auth.uid()) or status = 'active');
create policy "businesses insert own" on public.businesses for insert to authenticated with check (true);
create policy "businesses member update" on public.businesses for update to authenticated
  using (public.is_business_member(id, auth.uid())) with check (public.is_business_member(id, auth.uid()));
create policy "businesses admin delete" on public.businesses for delete to authenticated
  using (public.is_super_admin(auth.uid()));

create policy "members read own" on public.business_members for select to authenticated
  using (user_id = auth.uid() or public.is_business_member(business_id, auth.uid()));
create policy "members insert" on public.business_members for insert to authenticated
  with check (user_id = auth.uid() or public.is_super_admin(auth.uid()));
create policy "members update admin" on public.business_members for update to authenticated
  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
create policy "members delete" on public.business_members for delete to authenticated
  using (public.is_super_admin(auth.uid()) or user_id = auth.uid());

create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  name text not null,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.business_services (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  category_id uuid references public.service_categories(id) on delete set null,
  name text not null,
  description text,
  active boolean not null default true,
  sort_order int not null default 0,
  vocabulary jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.review_settings (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.businesses(id) on delete cascade,
  customer_headline text not null default 'Share your experience',
  customer_subheadline text not null default 'Answer a few quick questions and get a review draft you can edit.',
  default_language public.review_language not null default 'english',
  allow_english boolean not null default true,
  allow_hindi boolean not null default true,
  allow_hinglish boolean not null default true,
  default_length public.review_length not null default 'medium',
  allow_regenerate boolean not null default true,
  show_optional_note boolean not null default true,
  selectable_attributes jsonb not null default '["Quality of Work","Staff","Finishing","Pricing","Speed","Installation","Product Range","Communication","Cleanliness","Overall Experience"]'::jsonb,
  google_cta_text text not null default 'Copy & Continue to Google',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.qr_codes (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  code text not null unique,
  destination_slug text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

grant select on public.service_categories, public.business_services, public.review_settings, public.qr_codes to anon;
grant select, insert, update, delete on public.service_categories, public.business_services, public.review_settings, public.qr_codes to authenticated;
grant all on public.service_categories, public.business_services, public.review_settings, public.qr_codes to service_role;
alter table public.service_categories enable row level security;
alter table public.business_services enable row level security;
alter table public.review_settings enable row level security;
alter table public.qr_codes enable row level security;

create policy "cats public read" on public.service_categories for select to anon
  using (active and public.is_business_active(business_id));
create policy "cats member all" on public.service_categories for all to authenticated
  using (public.is_business_member(business_id, auth.uid()) or (active and public.is_business_active(business_id)))
  with check (public.is_business_member(business_id, auth.uid()));

create policy "svc public read" on public.business_services for select to anon
  using (active and public.is_business_active(business_id));
create policy "svc member all" on public.business_services for all to authenticated
  using (public.is_business_member(business_id, auth.uid()) or (active and public.is_business_active(business_id)))
  with check (public.is_business_member(business_id, auth.uid()));

create policy "settings public read" on public.review_settings for select to anon
  using (public.is_business_active(business_id));
create policy "settings member all" on public.review_settings for all to authenticated
  using (public.is_business_member(business_id, auth.uid()) or public.is_business_active(business_id))
  with check (public.is_business_member(business_id, auth.uid()));

create policy "qr public read" on public.qr_codes for select to anon
  using (public.is_business_active(business_id));
create policy "qr member all" on public.qr_codes for all to authenticated
  using (public.is_business_member(business_id, auth.uid()))
  with check (public.is_business_member(business_id, auth.uid()));

create table public.review_sessions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  qr_code_id uuid references public.qr_codes(id) on delete set null,
  session_token text not null unique,
  selected_service_ids jsonb not null default '[]'::jsonb,
  experience_rating public.experience_rating,
  selected_attributes jsonb not null default '[]'::jsonb,
  customer_note text,
  selected_language public.review_language,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);
create table public.review_generations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  session_id uuid not null references public.review_sessions(id) on delete cascade,
  review_text text not null,
  normalized_text text not null,
  review_hash text not null,
  language public.review_language not null,
  review_length public.review_length not null,
  structure_signature text not null,
  generation_number int not null default 1,
  edited boolean not null default false,
  copied_at timestamptz,
  google_clicked_at timestamptz,
  created_at timestamptz not null default now()
);
create index review_generations_business_idx on public.review_generations (business_id, created_at desc);
create unique index review_generations_business_hash_idx on public.review_generations (business_id, review_hash);

create table public.template_fragments (
  id uuid primary key default gen_random_uuid(),
  business_id uuid references public.businesses(id) on delete cascade,
  language public.review_language not null,
  fragment_type text not null,
  sentiment text,
  attribute_key text,
  service_category text,
  content text not null,
  usage_count int not null default 0,
  last_used_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index template_fragments_key_idx on public.template_fragments (coalesce(business_id, '00000000-0000-0000-0000-000000000000'::uuid), language, fragment_type, content);

create table public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  session_id uuid references public.review_sessions(id) on delete set null,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index analytics_events_business_idx on public.analytics_events (business_id, created_at desc);

grant select, insert, update, delete on public.review_sessions, public.review_generations, public.analytics_events, public.template_fragments to authenticated;
grant all on public.review_sessions, public.review_generations, public.analytics_events, public.template_fragments to service_role;
grant insert on public.analytics_events to anon;

alter table public.review_sessions enable row level security;
alter table public.review_generations enable row level security;
alter table public.analytics_events enable row level security;
alter table public.template_fragments enable row level security;

create policy "sessions member read" on public.review_sessions for select to authenticated
  using (public.is_business_member(business_id, auth.uid()));
create policy "sessions member write" on public.review_sessions for all to authenticated
  using (public.is_business_member(business_id, auth.uid()))
  with check (public.is_business_member(business_id, auth.uid()));

create policy "generations member read" on public.review_generations for select to authenticated
  using (public.is_business_member(business_id, auth.uid()));
create policy "generations member write" on public.review_generations for all to authenticated
  using (public.is_business_member(business_id, auth.uid()))
  with check (public.is_business_member(business_id, auth.uid()));

create policy "events public insert" on public.analytics_events for insert to anon
  with check (public.is_business_active(business_id));
create policy "events member read" on public.analytics_events for select to authenticated
  using (public.is_business_member(business_id, auth.uid()));
create policy "events auth insert" on public.analytics_events for insert to authenticated
  with check (public.is_business_active(business_id) or public.is_business_member(business_id, auth.uid()));

create policy "fragments member read" on public.template_fragments for select to authenticated
  using (business_id is null or public.is_business_member(business_id, auth.uid()));
create policy "fragments admin write" on public.template_fragments for all to authenticated
  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));

create table public.business_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  active boolean not null default true,
  limits jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create table public.business_subscriptions (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  plan_id uuid not null references public.business_plans(id) on delete restrict,
  status text not null default 'active',
  starts_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.business_plans to anon;
grant select, insert, update, delete on public.business_plans to authenticated;
grant all on public.business_plans, public.business_subscriptions to service_role;
grant select, insert, update, delete on public.business_subscriptions to authenticated;
alter table public.business_plans enable row level security;
alter table public.business_subscriptions enable row level security;
create policy "plans readable anon" on public.business_plans for select to anon using (true);
create policy "plans readable auth" on public.business_plans for select to authenticated using (true);
create policy "plans admin write" on public.business_plans for all to authenticated
  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));
create policy "subs member read" on public.business_subscriptions for select to authenticated
  using (public.is_business_member(business_id, auth.uid()));
create policy "subs admin write" on public.business_subscriptions for all to authenticated
  using (public.is_super_admin(auth.uid())) with check (public.is_super_admin(auth.uid()));

create table public.google_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  status text not null default 'disconnected',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.google_locations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  connection_id uuid references public.google_connections(id) on delete cascade,
  external_id text,
  name text,
  created_at timestamptz not null default now()
);
create table public.google_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  location_id uuid references public.google_locations(id) on delete cascade,
  external_id text,
  rating int,
  comment text,
  author_name text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);
create table public.google_review_replies (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.businesses(id) on delete cascade,
  review_id uuid references public.google_reviews(id) on delete cascade,
  reply_text text,
  status text not null default 'draft',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.google_connections, public.google_locations, public.google_reviews, public.google_review_replies to authenticated;
grant all on public.google_connections, public.google_locations, public.google_reviews, public.google_review_replies to service_role;
alter table public.google_connections enable row level security;
alter table public.google_locations enable row level security;
alter table public.google_reviews enable row level security;
alter table public.google_review_replies enable row level security;
create policy "gconn member" on public.google_connections for all to authenticated
  using (public.is_business_member(business_id, auth.uid())) with check (public.is_business_member(business_id, auth.uid()));
create policy "gloc member" on public.google_locations for all to authenticated
  using (public.is_business_member(business_id, auth.uid())) with check (public.is_business_member(business_id, auth.uid()));
create policy "grev member" on public.google_reviews for all to authenticated
  using (public.is_business_member(business_id, auth.uid())) with check (public.is_business_member(business_id, auth.uid()));
create policy "grep member" on public.google_review_replies for all to authenticated
  using (public.is_business_member(business_id, auth.uid())) with check (public.is_business_member(business_id, auth.uid()));

create trigger t1 before update on public.profiles for each row execute function public.set_updated_at();
create trigger t2 before update on public.businesses for each row execute function public.set_updated_at();
create trigger t3 before update on public.service_categories for each row execute function public.set_updated_at();
create trigger t4 before update on public.business_services for each row execute function public.set_updated_at();
create trigger t5 before update on public.review_settings for each row execute function public.set_updated_at();
create trigger t6 before update on public.qr_codes for each row execute function public.set_updated_at();
create trigger t7 before update on public.template_fragments for each row execute function public.set_updated_at();
create trigger t8 before update on public.business_subscriptions for each row execute function public.set_updated_at();
create trigger t9 before update on public.google_connections for each row execute function public.set_updated_at();

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end; $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create policy "logos read" on storage.objects for select using (bucket_id = 'business-logos');
create policy "logos auth write" on storage.objects for insert to authenticated
  with check (bucket_id = 'business-logos');
create policy "logos auth update" on storage.objects for update to authenticated
  using (bucket_id = 'business-logos');
create policy "logos auth delete" on storage.objects for delete to authenticated
  using (bucket_id = 'business-logos');

insert into public.business_plans (name, code, limits) values
  ('Starter','starter','{"reviews_per_month":200,"businesses":1}'),
  ('Growth','growth','{"reviews_per_month":2000,"businesses":3}'),
  ('Pro','pro','{"reviews_per_month":null,"businesses":10}');

insert into public.businesses (id, name, slug, category, phone, address_line, city, state, postal_code, country, status, onboarding_completed)
values ('11111111-1111-4111-8111-111111111111','Jangid Carwala','jangid-carwala','Automotive Services','7987310828','Nayapura Road','Mandsaur','Madhya Pradesh','458001','India','active', true);

insert into public.review_settings (business_id, customer_headline, customer_subheadline)
values ('11111111-1111-4111-8111-111111111111','Share your experience','Tell us what you came in for — we will draft a review you can edit and post.');

insert into public.qr_codes (business_id, code, destination_slug)
values ('11111111-1111-4111-8111-111111111111','jangid-carwala-primary','jangid-carwala');

with cats as (
  insert into public.service_categories (business_id, name, sort_order) values
    ('11111111-1111-4111-8111-111111111111','Car Accessories',1),
    ('11111111-1111-4111-8111-111111111111','Auto Deals',2),
    ('11111111-1111-4111-8111-111111111111','Auto Detailing',3),
    ('11111111-1111-4111-8111-111111111111','Car Modification',4),
    ('11111111-1111-4111-8111-111111111111','Infotainment',5),
    ('11111111-1111-4111-8111-111111111111','Lighting',6),
    ('11111111-1111-4111-8111-111111111111','Wheels',7)
  returning id, name
)
insert into public.business_services (business_id, category_id, name, sort_order, vocabulary)
select '11111111-1111-4111-8111-111111111111', c.id, s.name, s.ord, s.vocab::jsonb
from cats c
join (values
  ('Car Accessories','Premium Car Accessories',1,'["selection","installation","product range","fitment","accessories"]'),
  ('Auto Deals','Auto Deals',1,'["communication","deal process","vehicle","experience"]'),
  ('Auto Detailing','PPF',1,'["film","fitment","installation","edges","finish"]'),
  ('Auto Detailing','Ceramic Coating',2,'["coating","shine","finish","application","appearance"]'),
  ('Auto Detailing','Teflon Coating',3,'["coating","finish","appearance","application"]'),
  ('Auto Detailing','Deep Interior Cleaning',4,'["interior","cleaning","detailing","cleanliness","finish"]'),
  ('Car Modification','Base-to-Top Car Modification',1,'["modification","conversion","fitment","final look","workmanship"]'),
  ('Car Modification','Old-to-New Model Conversion',2,'["conversion","body work","fitment","final look","updated appearance"]'),
  ('Infotainment','Infotainment Systems',1,'["screen","installation","setup","audio","system","functionality"]'),
  ('Lighting','Projector Headlamps',1,'["lighting","fitment","installation","projector setup","final appearance"]'),
  ('Wheels','Alloy Wheels',1,'["wheels","fitment","selection","installation","appearance"]')
) as s(cat, name, ord, vocab) on s.cat = c.name;

insert into public.business_subscriptions (business_id, plan_id, status)
select '11111111-1111-4111-8111-111111111111', id, 'active' from public.business_plans where code = 'growth';
