-- Lock down posting/editing. Run in the Supabase SQL Editor.
-- Before this, row-level security was OFF on every table, so the existing
-- policies were not enforced and anyone with the public key could write.
-- After this: only admin / super_admin (and an event_head for their own
-- event) can post or edit events and jobs. Students only touch their own rows.

alter table public.profiles          enable row level security;
alter table public.events            enable row level security;
alter table public.registrations     enable row level security;
alter table public.bookmarks         enable row level security;
alter table public.event_surveys     enable row level security;
alter table public.survey_questions  enable row level security;
alter table public.notifications     enable row level security;
alter table public.jobs              enable row level security;
alter table public.job_applications  enable row level security;

-- profiles: nobody can change their own role; hide other people's profiles
drop policy if exists authenticated_read_profiles on public.profiles;
drop policy if exists profiles_update_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_update_own on public.profiles for update
  using (auth.uid() = id) with check (auth.uid() = id and role = current_user_role());
create policy profiles_insert_own on public.profiles for insert
  with check (auth.uid() = id and role = 'student');

-- events: super_admin may also post/edit (admin + event_head policies already exist)
drop policy if exists lock_events_super_insert on public.events;
drop policy if exists lock_events_super_update on public.events;
drop policy if exists lock_events_super_delete on public.events;
create policy lock_events_super_insert on public.events for insert with check (current_user_role() = 'super_admin');
create policy lock_events_super_update on public.events for update using (current_user_role() = 'super_admin');
create policy lock_events_super_delete on public.events for delete using (current_user_role() = 'super_admin');

-- registrations: super_admin can view
drop policy if exists lock_reg_super_select on public.registrations;
create policy lock_reg_super_select on public.registrations for select using (current_user_role() = 'super_admin');

-- bookmarks: own rows only
drop policy if exists lock_bm_select on public.bookmarks;
drop policy if exists lock_bm_insert on public.bookmarks;
drop policy if exists lock_bm_delete on public.bookmarks;
create policy lock_bm_select on public.bookmarks for select using (auth.uid() = user_id);
create policy lock_bm_insert on public.bookmarks for insert with check (auth.uid() = user_id);
create policy lock_bm_delete on public.bookmarks for delete using (auth.uid() = user_id);

-- surveys: students answer for themselves; organizers read
drop policy if exists lock_sv_insert on public.event_surveys;
drop policy if exists lock_sv_select_own on public.event_surveys;
drop policy if exists lock_sv_select_staff on public.event_surveys;
create policy lock_sv_insert on public.event_surveys for insert with check (auth.uid() = user_id);
create policy lock_sv_select_own on public.event_surveys for select using (auth.uid() = user_id);
create policy lock_sv_select_staff on public.event_surveys for select
  using (current_user_role() in ('admin','super_admin') or owns_event(event_id));

-- survey questions: any signed-in user can read; write policies already exist
drop policy if exists lock_sq_select on public.survey_questions;
create policy lock_sq_select on public.survey_questions for select to authenticated using (true);

-- notifications: staff can send
drop policy if exists lock_nt_insert_staff on public.notifications;
create policy lock_nt_insert_staff on public.notifications for insert
  with check (current_user_role() in ('admin','super_admin','event_head'));

-- jobs: signed-in users read; only admin / super_admin write
drop policy if exists lock_jobs_select on public.jobs;
drop policy if exists lock_jobs_insert on public.jobs;
drop policy if exists lock_jobs_update on public.jobs;
drop policy if exists lock_jobs_delete on public.jobs;
create policy lock_jobs_select on public.jobs for select to authenticated using (true);
create policy lock_jobs_insert on public.jobs for insert with check (current_user_role() in ('admin','super_admin'));
create policy lock_jobs_update on public.jobs for update using (current_user_role() in ('admin','super_admin'));
create policy lock_jobs_delete on public.jobs for delete using (current_user_role() in ('admin','super_admin'));

-- job applications: students apply and see their own; admins see and update all
drop policy if exists lock_ja_insert on public.job_applications;
drop policy if exists lock_ja_select_own on public.job_applications;
drop policy if exists lock_ja_select_staff on public.job_applications;
drop policy if exists lock_ja_update_staff on public.job_applications;
create policy lock_ja_insert on public.job_applications for insert with check (auth.uid() = user_id);
create policy lock_ja_select_own on public.job_applications for select using (auth.uid() = user_id);
create policy lock_ja_select_staff on public.job_applications for select using (current_user_role() in ('admin','super_admin'));
create policy lock_ja_update_staff on public.job_applications for update using (current_user_role() in ('admin','super_admin'));
