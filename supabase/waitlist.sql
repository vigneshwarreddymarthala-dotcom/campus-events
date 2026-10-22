-- Waiting list + cancellation with reason. Run once in the Supabase SQL Editor.
-- Safe to run twice. Existing registrations all become 'confirmed', so nothing changes for people already in.
--
-- status:  confirmed = has a seat | waitlist = waiting in order of registered_at | cancelled = gave up (reason kept)

-- 1. New columns -------------------------------------------------------------
alter table public.registrations
  add column if not exists status text not null default 'confirmed',
  add column if not exists cancel_reason text,
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_from text;

alter table public.registrations drop constraint if exists registrations_status_check;
alter table public.registrations
  add constraint registrations_status_check check (status in ('confirmed', 'waitlist', 'cancelled'));

create index if not exists registrations_event_status_idx
  on public.registrations (event_id, status, registered_at);

-- 2. Seat decision: confirmed if a seat is free, otherwise waitlist ----------
-- Locks the event row so two students tapping at the same moment cannot both take the last seat.
create or replace function public.seat_status(p_event_id text) returns text
language plpgsql security definer set search_path = public as $$
declare v_cap int; v_conf int;
begin
  select capacity into v_cap from public.events where id = p_event_id for update;
  if not found then return 'confirmed'; end if;
  select count(*) into v_conf from public.registrations where event_id = p_event_id and status = 'confirmed';
  return case when v_conf < v_cap then 'confirmed' else 'waitlist' end;
end $$;

-- Every new registration (old app versions included) gets its status from the database, never from the app.
create or replace function public.registrations_before_insert() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  new.status := public.seat_status(new.event_id);
  new.cancel_reason := null; new.cancelled_at := null; new.cancelled_from := null;
  return new;
end $$;

drop trigger if exists registrations_assign_status on public.registrations;
create trigger registrations_assign_status before insert on public.registrations
  for each row execute function public.registrations_before_insert();

-- 3. Move the first people on the waiting list into free seats ---------------
-- Returns the user ids that moved up, and leaves each of them a notification (bell).
create or replace function public.promote_from_waitlist(p_event_id text) returns setof uuid
language plpgsql security definer set search_path = public as $$
declare v_cap int; v_conf int; v_title text; v_row public.registrations%rowtype;
begin
  select capacity, title into v_cap, v_title from public.events where id = p_event_id for update;
  if not found then return; end if;
  loop
    select count(*) into v_conf from public.registrations where event_id = p_event_id and status = 'confirmed';
    exit when v_conf >= v_cap;
    select * into v_row from public.registrations
      where event_id = p_event_id and status = 'waitlist'
      order by registered_at asc, id asc limit 1 for update skip locked;
    exit when not found;
    update public.registrations set status = 'confirmed' where id = v_row.id;
    insert into public.notifications (user_id, title, message, event_id, read)
      values (v_row.user_id, 'You''re in!', 'A spot opened up for ' || v_title || '. Your registration is now confirmed.', p_event_id, false);
    return next v_row.user_id;
  end loop;
end $$;

revoke execute on function public.promote_from_waitlist(text) from public, anon, authenticated;
revoke execute on function public.seat_status(text) from public, anon, authenticated;

-- Old app versions still cancel by deleting the row: the freed seat is still filled automatically.
create or replace function public.registrations_after_delete() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.status = 'confirmed' then perform public.promote_from_waitlist(old.event_id); end if;
  return old;
end $$;

drop trigger if exists registrations_promote_after_delete on public.registrations;
create trigger registrations_promote_after_delete after delete on public.registrations
  for each row execute function public.registrations_after_delete();

-- 4. Register (new, or come back after cancelling) ---------------------------
create or replace function public.register_for_event(
  p_event_id text, p_name text, p_email text, p_department text, p_year text, p_payment_status text
) returns text language plpgsql security definer set search_path = public as $$
declare v_reg public.registrations%rowtype; v_status text;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  select * into v_reg from public.registrations where event_id = p_event_id and user_id = auth.uid();
  if found and v_reg.status <> 'cancelled' then return v_reg.status; end if;   -- already in or waiting
  if found then                                                              -- coming back after a cancellation
    v_status := public.seat_status(p_event_id);
    update public.registrations
       set status = v_status, registered_at = now(), attended = false,
           cancel_reason = null, cancelled_at = null, cancelled_from = null
     where id = v_reg.id;
    return v_status;
  end if;
  insert into public.registrations (event_id, user_id, student_name, student_email, student_department, student_year, payment_status)
    values (p_event_id, auth.uid(), p_name, p_email, p_department, p_year, coalesce(p_payment_status, 'free'))
    returning status into v_status;
  return v_status;
end $$;

-- 5. Cancel with a reason; the first person waiting takes the seat -----------
create or replace function public.cancel_my_registration(p_event_id text, p_reason text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_reg public.registrations%rowtype; v_title text; v_owner uuid;
  v_reason text := nullif(btrim(coalesce(p_reason, '')), '');
  v_promoted uuid[] := '{}';
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  perform 1 from public.events where id = p_event_id for update;
  select * into v_reg from public.registrations where event_id = p_event_id and user_id = auth.uid();
  if not found or v_reg.status = 'cancelled' then raise exception 'You are not registered for this event.'; end if;
  if v_reg.status = 'confirmed' and (v_reason is null or length(v_reason) < 3) then
    raise exception 'Please tell us why you are cancelling.';
  end if;
  update public.registrations
     set status = 'cancelled', cancel_reason = v_reason, cancelled_at = now(), cancelled_from = v_reg.status, attended = false
   where id = v_reg.id;
  select title, created_by into v_title, v_owner from public.events where id = p_event_id;
  if v_reg.status = 'confirmed' then
    select coalesce(array_agg(p), '{}') into v_promoted from public.promote_from_waitlist(p_event_id) as p;
  end if;
  if v_owner is not null then
    insert into public.notifications (user_id, title, message, event_id, read)
      values (v_owner, 'Registration cancelled',
              v_reg.student_name || ' cancelled for ' || v_title || coalesce(': ' || v_reason, '.') ||
              case when array_length(v_promoted, 1) > 0 then ' The next person on the waiting list moved up.' else '' end,
              p_event_id, false);
  end if;
  return jsonb_build_object('was', v_reg.status, 'promoted', to_jsonb(v_promoted), 'owner', v_owner,
                            'title', v_title, 'student', v_reg.student_name);
end $$;

-- 6. Organizer moves someone between Registered and Waiting -------------------
create or replace function public.set_registration_status(p_registration_id uuid, p_status text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare v_reg public.registrations%rowtype; v_title text;
begin
  if p_status not in ('confirmed', 'waitlist') then raise exception 'Invalid status'; end if;
  select * into v_reg from public.registrations where id = p_registration_id;
  if not found then raise exception 'Registration not found'; end if;
  if not (public.current_user_role() in ('admin', 'super_admin') or public.owns_event(v_reg.event_id)) then
    raise exception 'Not allowed';
  end if;
  if v_reg.status = 'cancelled' then raise exception 'This registration was cancelled.'; end if;
  update public.registrations set status = p_status where id = p_registration_id;
  select title into v_title from public.events where id = v_reg.event_id;
  if p_status = 'confirmed' and v_reg.status = 'waitlist' then
    insert into public.notifications (user_id, title, message, event_id, read)
      values (v_reg.user_id, 'You''re in!', 'A spot opened up for ' || v_title || '. Your registration is now confirmed.', v_reg.event_id, false);
  end if;
  return jsonb_build_object('user_id', v_reg.user_id, 'event_id', v_reg.event_id, 'title', v_title,
                            'moved_up', (p_status = 'confirmed' and v_reg.status = 'waitlist'));
end $$;

-- 7. Student's place in the line ----------------------------------------------
create or replace function public.my_waitlist_position(p_event_id text) returns int
language sql stable security definer set search_path = public as $$
  select case when r.status = 'waitlist' then
           (select count(*) from public.registrations x
             where x.event_id = r.event_id and x.status = 'waitlist'
               and (x.registered_at, x.id) <= (r.registered_at, r.id))::int
         end
  from public.registrations r where r.event_id = p_event_id and r.user_id = auth.uid();
$$;

-- 8. Only people with a seat can be checked in ---------------------------------
create or replace function public.mark_attendance(p_event_id text) returns text
language plpgsql security definer as $$
declare v_reg_id uuid; v_attended boolean;
begin
  select id, attended into v_reg_id, v_attended from registrations
   where event_id = p_event_id and user_id = auth.uid() and status = 'confirmed';
  if v_reg_id is null then return 'not_registered'; end if;
  if v_attended then return 'already_marked'; end if;
  update registrations set attended = true where id = v_reg_id;
  return 'ok';
end $$;

-- 9. Public totals: seats taken (confirmed) and people waiting ------------------
drop function if exists public.event_registration_counts();
create function public.event_registration_counts()
returns table(event_id text, registrations bigint, waiting bigint)
language sql stable security definer set search_path = public as $$
  select r.event_id::text,
         count(*) filter (where r.status = 'confirmed')::bigint,
         count(*) filter (where r.status = 'waitlist')::bigint
  from public.registrations r group by r.event_id
$$;
grant execute on function public.event_registration_counts() to anon, authenticated;

grant execute on function public.register_for_event(text, text, text, text, text, text) to authenticated;
grant execute on function public.cancel_my_registration(text, text) to authenticated;
grant execute on function public.set_registration_status(uuid, text) to authenticated;
grant execute on function public.my_waitlist_position(text) to authenticated;
