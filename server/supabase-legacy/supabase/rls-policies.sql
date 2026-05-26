create or replace function public.user_role()
returns text
language sql
stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

alter table public.profiles enable row level security;
alter table public.voters enable row level security;
alter table public.family_members enable row level security;
alter table public.departments enable row level security;
alter table public.officers enable row level security;
alter table public.complaints enable row level security;
alter table public.complaint_timeline enable row level security;
alter table public.social_posts enable row level security;
alter table public.whatsapp_templates enable row level security;
alter table public.audit_logs enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (id = auth.uid());

create policy "profiles_update_own"
  on public.profiles for update
  using (id = auth.uid())
  with check (id = auth.uid());

create policy "profiles_insert_self"
  on public.profiles for insert
  with check (id = auth.uid());

create policy "voters_select"
  on public.voters for select
  using (
    profile_id = auth.uid()
    or public.user_role() in ('operator','officer','leader','admin')
  );

create policy "voters_insert_operator"
  on public.voters for insert
  with check (public.user_role() in ('operator','leader','admin'));

create policy "voters_update_operator"
  on public.voters for update
  using (public.user_role() in ('operator','leader','admin'))
  with check (public.user_role() in ('operator','leader','admin'));

create policy "family_members_select"
  on public.family_members for select
  using (
    exists (
      select 1 from public.voters v
      where v.id = family_members.voter_id
        and (v.profile_id = auth.uid() or public.user_role() in ('operator','leader','admin'))
    )
  );

create policy "family_members_insert_operator"
  on public.family_members for insert
  with check (public.user_role() in ('operator','leader','admin'));

create policy "departments_select"
  on public.departments for select
  using (auth.role() = 'authenticated');

create policy "officers_select"
  on public.officers for select
  using (
    profile_id = auth.uid() or public.user_role() in ('leader','admin')
  );

create policy "complaints_select_citizen"
  on public.complaints for select
  using (citizen_profile_id = auth.uid());

create policy "complaints_select_operator"
  on public.complaints for select
  using (public.user_role() in ('operator','leader','admin'));

create policy "complaints_select_officer"
  on public.complaints for select
  using (
    public.user_role() = 'officer'
    and (
      assigned_officer_id = auth.uid()
      or exists (
        select 1 from public.officers o
        where o.profile_id = auth.uid()
          and o.department_id = complaints.assigned_department_id
      )
    )
  );

create policy "complaints_insert_citizen"
  on public.complaints for insert
  with check (
    citizen_profile_id = auth.uid()
    or public.user_role() in ('operator','leader','admin')
  );

create policy "complaints_update_operator"
  on public.complaints for update
  using (public.user_role() in ('operator','leader','admin'))
  with check (public.user_role() in ('operator','leader','admin'));

create policy "complaints_update_officer"
  on public.complaints for update
  using (
    public.user_role() = 'officer'
    and (
      assigned_officer_id = auth.uid()
      or exists (
        select 1 from public.officers o
        where o.profile_id = auth.uid()
          and o.department_id = complaints.assigned_department_id
      )
    )
  )
  with check (
    public.user_role() = 'officer'
    and (
      assigned_officer_id = auth.uid()
      or exists (
        select 1 from public.officers o
        where o.profile_id = auth.uid()
          and o.department_id = complaints.assigned_department_id
      )
    )
  );

create policy "complaints_reopen_citizen"
  on public.complaints for update
  using (
    citizen_profile_id = auth.uid()
    and status = 'resolved'
    and resolved_at > now() - interval '7 days'
  )
  with check (
    status = 'reopened'
  );

create policy "complaint_timeline_select"
  on public.complaint_timeline for select
  using (
    public.user_role() in ('operator','officer','leader','admin')
    or exists (
      select 1 from public.complaints c
      where c.id = complaint_timeline.complaint_id
        and c.citizen_profile_id = auth.uid()
    )
  );

create policy "complaint_timeline_insert_staff"
  on public.complaint_timeline for insert
  with check (public.user_role() in ('operator','officer','leader','admin'));

create policy "social_posts_select_published"
  on public.social_posts for select
  using (status = 'published');

create policy "social_posts_select_staff"
  on public.social_posts for select
  using (public.user_role() in ('leader','admin'));

create policy "social_posts_insert_staff"
  on public.social_posts for insert
  with check (public.user_role() in ('leader','admin'));

create policy "social_posts_update_staff"
  on public.social_posts for update
  using (public.user_role() in ('leader','admin'))
  with check (public.user_role() in ('leader','admin'));

create policy "whatsapp_templates_select_staff"
  on public.whatsapp_templates for select
  using (public.user_role() in ('leader','admin'));

create policy "whatsapp_templates_update_staff"
  on public.whatsapp_templates for update
  using (public.user_role() in ('leader','admin'))
  with check (public.user_role() in ('leader','admin'));

create policy "audit_logs_select_staff"
  on public.audit_logs for select
  using (public.user_role() in ('leader','admin'));

create policy "audit_logs_insert_staff"
  on public.audit_logs for insert
  with check (public.user_role() in ('operator','officer','leader','admin'));
