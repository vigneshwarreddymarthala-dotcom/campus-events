-- ============================================================
-- Campus Events Backend Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Profiles (extends auth.users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role text not null check (role in ('admin', 'student')),
  department text,
  year text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Users can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Admins can view all profiles"
  on public.profiles for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, role, department, year)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'student'),
    new.raw_user_meta_data->>'department',
    new.raw_user_meta_data->>'year'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Events
create table if not exists public.events (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text not null,
  date date not null,
  end_date date,
  time text not null,
  end_time text,
  venue text not null,
  category text not null,
  status text not null default 'upcoming' check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')),
  capacity int not null default 100,
  registration_fee numeric not null default 0,
  organizer_name text not null,
  organizer_email text not null,
  organizer_department text not null,
  tags text[] default '{}',
  banner_image text default 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
  requirements text[] default '{}',
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.events enable row level security;

create policy "Anyone can view events"
  on public.events for select
  using (true);

create policy "Admins can insert events"
  on public.events for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update events"
  on public.events for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can delete events"
  on public.events for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Auto-update updated_at
create or replace function public.handle_updated_at()
returns trigger language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists on_events_updated on public.events;
create trigger on_events_updated
  before update on public.events
  for each row execute procedure public.handle_updated_at();


-- Registrations
create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  event_id text not null references public.events(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  student_name text not null,
  student_email text not null,
  student_department text,
  student_year text,
  payment_status text not null default 'free' check (payment_status in ('free', 'paid', 'pending')),
  attended boolean not null default false,
  registered_at timestamptz default now(),
  unique(event_id, user_id)
);

alter table public.registrations enable row level security;

create policy "Users can view own registrations"
  on public.registrations for select
  using (auth.uid() = user_id);

create policy "Users can register for events"
  on public.registrations for insert
  with check (auth.uid() = user_id);

create policy "Users can cancel own registrations"
  on public.registrations for delete
  using (auth.uid() = user_id);

create policy "Admins can view all registrations"
  on public.registrations for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Admins can update registrations"
  on public.registrations for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );


-- Bookmarks
create table if not exists public.bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id text not null references public.events(id) on delete cascade,
  created_at timestamptz default now(),
  primary key (user_id, event_id)
);

alter table public.bookmarks enable row level security;

create policy "Users can manage own bookmarks"
  on public.bookmarks for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);


-- ============================================================
-- Seed: Demo Users (run after schema, before app use)
-- These must be created via Supabase Auth, then profiles
-- updated. Use the app's register flow or Supabase dashboard.
-- ============================================================

-- Seed: Sample Events
insert into public.events (id, title, description, date, end_date, time, end_time, venue, category, status, capacity, registration_fee, organizer_name, organizer_email, organizer_department, tags, banner_image)
values
  ('e1', 'National Level Hackathon 2026', 'Join us for a 24-hour coding marathon where teams compete to build innovative solutions to real-world problems. Open to all engineering students.', '2026-08-15', '2026-08-16', '09:00 AM', '09:00 AM', 'Main Auditorium, Block A', 'Technical', 'upcoming', 200, 0, 'Dr. Ramesh Kumar', 'ramesh@college.edu', 'Computer Science', ARRAY['hackathon', 'coding', 'innovation', 'team'], 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800'),
  ('e2', 'Annual Cultural Fest — Utsav 2026', 'The biggest cultural extravaganza of the year! Dance, music, drama and more. Participate in various competitions and showcase your talent.', '2026-08-20', '2026-08-22', '05:00 PM', '10:00 PM', 'Open Air Theatre', 'Cultural', 'upcoming', 500, 150, 'Prof. Sunita Sharma', 'sunita@college.edu', 'Arts & Humanities', ARRAY['cultural', 'dance', 'music', 'drama'], 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800'),
  ('e3', 'Career Fair 2026 — Top Companies Hiring', 'Connect with recruiters from 50+ companies. Bring your resume and be interview-ready. Dress code: Formal.', '2026-09-05', NULL, '10:00 AM', '04:00 PM', 'Sports Complex', 'Career', 'upcoming', 300, 0, 'Dr. Priya Nair', 'priya@college.edu', 'Training & Placement', ARRAY['career', 'jobs', 'placement', 'networking'], 'https://images.unsplash.com/photo-1559523161-0fc0d8b814aa?w=800'),
  ('e4', 'Photography Workshop', 'Learn the art of photography from professional photographers. Covers composition, lighting, editing and portrait photography.', '2026-09-10', NULL, '02:00 PM', '06:00 PM', 'Media Lab, Block C', 'Workshop', 'upcoming', 40, 200, 'Mr. Arjun Das', 'arjun@college.edu', 'Fine Arts', ARRAY['photography', 'workshop', 'creative'], 'https://images.unsplash.com/photo-1554941829-202a0b2403b8?w=800'),
  ('e5', 'Inter-College Cricket Tournament', '3-day cricket tournament between 8 colleges. Cheer for your team! Entry is free for spectators.', '2026-09-18', '2026-09-20', '08:00 AM', '06:00 PM', 'College Cricket Ground', 'Sports', 'upcoming', 1000, 0, 'Mr. Vijay Singh', 'vijay@college.edu', 'Sports', ARRAY['cricket', 'sports', 'tournament', 'inter-college'], 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800'),
  ('e6', 'AI & Machine Learning Summit', 'Industry experts discuss the future of AI. Sessions on LLMs, computer vision, and career paths in AI. Certificate provided.', '2026-10-02', NULL, '10:00 AM', '05:00 PM', 'Seminar Hall 1', 'Technical', 'upcoming', 150, 100, 'Dr. Kavita Rao', 'kavita@college.edu', 'Computer Science', ARRAY['AI', 'ML', 'technology', 'summit'], 'https://images.unsplash.com/photo-1677442135703-1787eea5ce01?w=800'),
  ('e7', 'Freshers Welcome Party', 'A warm welcome to the batch of 2025! Fun games, music, food and a chance to make new friends.', '2025-08-10', NULL, '06:00 PM', '10:00 PM', 'Open Air Theatre', 'Cultural', 'completed', 400, 0, 'Student Council', 'council@college.edu', 'Student Affairs', ARRAY['freshers', 'party', 'welcome'], 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800'),
  ('e8', 'Resume Building Workshop', 'Craft a winning resume with guidance from HR professionals. Includes mock interviews and LinkedIn profile optimization.', '2025-11-15', NULL, '11:00 AM', '01:00 PM', 'Seminar Hall 2', 'Career', 'completed', 80, 0, 'Ms. Deepa Iyer', 'deepa@college.edu', 'Training & Placement', ARRAY['resume', 'career', 'workshop'], 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800'),
  ('e9', 'Tech Quiz Competition', 'Test your technology knowledge in this fast-paced quiz. Topics: CS fundamentals, current tech, and logical reasoning.', '2025-12-05', NULL, '03:00 PM', '05:00 PM', 'Lecture Hall 4', 'Technical', 'completed', 100, 50, 'CSE Department', 'cse@college.edu', 'Computer Science', ARRAY['quiz', 'technical', 'competition'], 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?w=800'),
  ('e10', 'Yoga & Mindfulness Camp', 'A weekend wellness retreat on campus. Sessions by certified yoga instructors. Mats provided.', '2026-01-18', '2026-01-19', '06:00 AM', '08:00 AM', 'College Garden', 'Workshop', 'completed', 60, 0, 'Dr. Ananya Bose', 'ananya@college.edu', 'Health & Wellness', ARRAY['yoga', 'wellness', 'mindfulness'], 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800')
on conflict (id) do nothing;
