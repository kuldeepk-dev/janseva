create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('citizen','operator','leader','admin')),
  full_name text,
  mobile text unique,
  email text,
  preferred_language text not null default 'en',
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.voters (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  full_name text,
  father_name text,
  dob date,
  voter_id text unique,
  occupation text,
  gender text,
  village text,
  panchayat text,
  booth_number text,
  photo_url text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.family_members (
  id uuid primary key default gen_random_uuid(),
  voter_id uuid references public.voters(id) on delete cascade,
  name text,
  relation text,
  age int,
  voter_card_id text
);

create table if not exists public.departments (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(),
  complaint_number text unique,
  citizen_profile_id uuid references public.profiles(id) on delete set null,
  voter_id uuid references public.voters(id) on delete set null,
  submitted_by uuid references public.profiles(id) on delete set null,
  created_by_role text check (created_by_role in ('citizen','operator','leader','admin')),
  created_by_user_id uuid references public.profiles(id) on delete set null,
  created_on_behalf_of_citizen_id uuid references public.profiles(id) on delete set null,
  source text check (source in ('citizen','operator')),
  reported_citizen_name text,
  reported_citizen_mobile text,
  category text,
  sub_category text,
  description text,
  location_text text,
  attachment_url text,
  assigned_department_id uuid references public.departments(id) on delete set null,
  priority text check (priority in ('normal','urgent','critical')),
  status text not null default 'unassigned' check (status in ('unassigned','assigned','acknowledged','in_progress','resolved','escalated','closed','reopened')),
  internal_notes text,
  resolution_note text,
  resolution_details text,
  expected_resolution_at timestamp with time zone,
  resolved_at timestamp with time zone,
  reopened_at timestamp with time zone,
  closed_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.complaint_timeline (
  id uuid primary key default gen_random_uuid(),
  complaint_id uuid references public.complaints(id) on delete cascade,
  actor_profile_id uuid references public.profiles(id) on delete set null,
  old_status text,
  new_status text,
  note text,
  created_at timestamp with time zone not null default now()
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  author_profile_id uuid references public.profiles(id) on delete set null,
  title text,
  content text,
  category text,
  location_text text,
  image_url text,
  audience text check (audience in ('public','registered_citizens')),
  status text not null default 'draft' check (status in ('draft','pending_approval','published','archived')),
  whatsapp_broadcast boolean not null default false,
  published_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  template_key text unique not null,
  title text,
  body text,
  language text not null default 'en',
  active boolean not null default true,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamp with time zone not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  action text,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamp with time zone not null default now()
);

create sequence if not exists public.complaint_number_seq start 1;

create or replace function public.set_complaint_number()
returns trigger as $$
begin
  if new.complaint_number is null then
    new.complaint_number := 'CMP-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.complaint_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$ language plpgsql;

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.seed_complaint_timeline()
returns trigger as $$
begin
  insert into public.complaint_timeline (complaint_id, actor_profile_id, old_status, new_status, note)
  values (new.id, new.submitted_by, null, new.status, 'Complaint submitted');
  return new;
end;
$$ language plpgsql;

do $$
begin
  if not exists (
    select 1 from pg_trigger where tgname = 'complaints_set_number'
  ) then
    create trigger complaints_set_number
      before insert on public.complaints
      for each row execute function public.set_complaint_number();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'complaints_updated_at'
  ) then
    create trigger complaints_updated_at
      before update on public.complaints
      for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'complaints_seed_timeline'
  ) then
    create trigger complaints_seed_timeline
      after insert on public.complaints
      for each row execute function public.seed_complaint_timeline();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'profiles_updated_at'
  ) then
    create trigger profiles_updated_at
      before update on public.profiles
      for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'voters_updated_at'
  ) then
    create trigger voters_updated_at
      before update on public.voters
      for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'social_posts_updated_at'
  ) then
    create trigger social_posts_updated_at
      before update on public.social_posts
      for each row execute function public.set_updated_at();
  end if;

  if not exists (
    select 1 from pg_trigger where tgname = 'whatsapp_templates_updated_at'
  ) then
    create trigger whatsapp_templates_updated_at
      before update on public.whatsapp_templates
      for each row execute function public.set_updated_at();
  end if;
end;
$$;

insert into public.departments (name, category)
values
  ('Block Education Office', 'Education'),
  ('Police Station / Dist. SP Office', 'Law & Order'),
  ('Agriculture Extension Office', 'Agriculture'),
  ('District Employment Office / MNREGA Cell', 'Job & Employment'),
  ('PHC / District Health Office', 'Health'),
  ('PWD Block Office / DISCOM', 'Infrastructure'),
  ('Revenue / Tehsil Office', 'Land Dispute'),
  ('Social Welfare Department', 'Personal / Social'),
  ('Admin Review Queue', 'Other')
on conflict do nothing;

insert into storage.buckets (id, name, public)
values
  ('voter-photos', 'voter-photos', true),
  ('complaint-attachments', 'complaint-attachments', true),
  ('social-post-images', 'social-post-images', true)
on conflict do nothing;
