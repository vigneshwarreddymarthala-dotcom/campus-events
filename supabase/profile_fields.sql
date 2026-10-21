-- Profile fields: phone, home country, study program, student status, German level.
-- Run this in the Supabase SQL Editor BEFORE deploying the matching app code.

alter table public.profiles
  add column if not exists phone text,
  add column if not exists home_country text,
  add column if not exists study_program text,
  add column if not exists student_status text,
  add column if not exists german_level text;

-- Fill the new fields from signup metadata. department/year stay in sync with
-- study_program/student_status so event registrations and the admin list keep working.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, department, year, phone, home_country, study_program, student_status, german_level)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    'student',
    new.raw_user_meta_data->>'study_program',
    new.raw_user_meta_data->>'student_status',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'home_country',
    new.raw_user_meta_data->>'study_program',
    new.raw_user_meta_data->>'student_status',
    new.raw_user_meta_data->>'german_level'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
