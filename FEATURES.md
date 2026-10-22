# Spirits — Feature Flows

> Use this document as the source of truth for building visual flow diagrams.
> Each feature lists: **Start → Steps → End**, plus **connects to** other features.

---

## ACTORS

| Actor   | Entry Point           |
|---------|-----------------------|
| Student | `/login` → `/student/events` |
| Event head (team head) | `/login` → `/team-head` — can create and manage **one** event |
| Admin (organizer) | `/login` → `/admin` — creates and manages all events and jobs |
| Super admin | `/login` → `/super-admin` — creates organizer and event-head accounts |
| Guest   | `/` (landing page with login card), `/login` or `/register` |

---

## 1. Sign Up

**Start:** Guest lands on `/register`

**Steps:**
1. Fill name, email, password, confirm password
2. Fill phone (optional), home country, study program, student status and German level (all stored on `profiles`)
3. Accept Terms & Conditions (link to `/terms`)
4. Submit → `supabase.auth.signUp()` + insert into `profiles`

**End:** Redirect to `/student/events` (default role = student)

**Connects to:**
- → Feature 2 (Login) — user can log in after registering
- → Feature 11 (Student Profile) — profile data pre-filled from registration

---

## 2. Login

**Start:** User lands on `/login` (or is redirected from a protected route)

**Steps:**
1. Enter email + password
2. Submit → `supabase.auth.signInWithPassword()`
3. `auth-context` loads profile from `profiles` table
4. Role check: `admin` or `student`

**End:**
- Admin → `/admin` (dashboard)
- Student → `/student/events` (event discovery)
- Special: `?redirect=/attend/:id` → go to QR check-in page after login

**Connects to:**
- → Feature 3 (Forgot Password) — link on login page
- → Feature 5 (Event Discovery) for students
- → Feature 12 (Admin Dashboard) for admins
- → Feature 8 (QR Check-in) — if login was triggered by a QR scan

---

## 3. Forgot Password

**Start:** User clicks "Forgot password?" on `/login`

**Steps:**
1. Lands on `/forgot-password`
2. Enters email
3. Submit → Supabase sends password reset email

**End:** Success message shown; user checks email, clicks link, resets password

**Connects to:**
- → Feature 2 (Login) — user returns to login after reset

---

## 4. Logout

**Start:** User clicks "Sign Out" in Profile page

**Steps:**
1. `supabase.auth.signOut()` clears session + httpOnly cookie
2. Auth context resets user to null

**End:** Redirect to `/login`

**Connects to:**
- → Feature 2 (Login)

---

## 5. Event Discovery (Student)

**Start:** Student lands on `/student/events`

**Steps:**
1. Page loads all events from Supabase + student's bookmarks + registrations
2. Student can:
   - **Search** by title, tag, or venue
   - **Filter** by category (chip bar) or fee (free/paid)
   - **Sort** by date / trending / newest
   - **Switch view** between Grid / List / Calendar
3. Calendar view: shows events on their dates, click date → event detail
4. Upcoming events shown first; past events collapsible at the bottom
5. Each card shows: title, date, venue, fee, registration fill bar, bookmark icon, "Registered" badge

**End:** Student clicks an event card → goes to Event Detail

**Connects to:**
- → Feature 6 (Event Detail & Registration) — clicking any event card
- → Feature 7 (Bookmarks) — bookmark icon on each card
- → Feature 10 (My Events) — nav link

---

## 6. Event Detail & Registration

**Start:** Student clicks an event card → `/student/events/:id`

**Steps:**
1. Load event details (banner, description, date, venue, fee, capacity, organizer)
2. Check registration status, bookmark status, survey status
3. Show capacity fill bar (color: green → yellow → red at 90%)
4. Registration button logic:
   - **Not registered + upcoming + open** → "Register Free" or "Buy Ticket – ₹X"
   - **Paid with ticket URL** → opens external link
   - **Paid without ticket URL** → shows confirm modal → `registerForEvent()`
   - **Already registered** → green "Registered" badge + "Cancel Registration" option
   - **Event full** → "Event Full" (disabled)
   - **Past** → "Event Ended" (disabled)
5. Other actions:
   - **Bookmark** — toggle bookmark
   - **Add to Google Calendar** — builds Google Calendar URL and opens it
   - **Share** — copies page URL to clipboard
   - **External ticket link** — if event has `ticketUrl`
6. If registered + event is past → show "Rate this Event" button

**End:**
- Free event: registered successfully, button turns green
- Paid/external: user goes to external ticket page
- Past + registered: → Feature 9 (Survey)

**Connects to:**
- → Feature 7 (Bookmarks) — bookmark toggle
- → Feature 8 (QR Check-in) — after registering, student scans QR at the event
- → Feature 9 (Survey) — "Rate this Event" button for past attended events
- → Feature 10 (My Events) — registration appears in "Upcoming" tab
- ← Feature 5 (Event Discovery) — back link

---

## 7. Bookmarks / Save Events

**Start:** Student taps bookmark icon on any event card or event detail page

**Steps:**
1. Toggle — if not bookmarked: `addBookmark(eventId)` inserts into `bookmarks` table
2. If bookmarked: `removeBookmark(eventId)` deletes from `bookmarks` table
3. Optimistic UI update (instant visual feedback)

**End:** Bookmark state persisted in Supabase; appears in My Events → Saved tab

**Connects to:**
- → Feature 5 (Event Discovery) — icon visible on all cards
- → Feature 6 (Event Detail) — icon visible on detail page
- → Feature 10 (My Events) — Saved tab shows all bookmarks

---

## 8. QR Check-in (Attendance)

**Start:** Admin shows QR code at event (from admin event edit page)

**Steps (Admin side):**
1. Admin opens `/admin/events/:id`
2. Clicks "Show QR" button → modal shows QR code + copy link button
3. QR encodes URL: `/attend/:eventId`

**Steps (Student side):**
1. Student scans QR with phone camera → opens `/attend/:eventId`
2. If not logged in → redirected to `/login?redirect=/attend/:eventId` → logs in → returns
3. Page shows event info (title, date, venue) + "Mark me Present ✓" button
4. Student taps button → `supabase.rpc("mark_attendance", { p_event_id })` called
5. DB function (SECURITY DEFINER) checks:
   - Is student registered? → if not: returns `"not_registered"`
   - Already marked? → returns `"already_marked"`
   - Success → sets `attended = true`, returns `"ok"`
6. UI shows result:
   - `"ok"` → green "You're checked in!" + "My Events" button
   - `"already_marked"` → blue "Already checked in"
   - `"not_registered"` → orange "Not registered" + "View Event" button
   - `error` → red "Something went wrong" + "Try Again"

**End:** Attendance recorded in `registrations.attended = true`

**Connects to:**
- ← Feature 6 (Event Detail) — student must be registered first
- ← Feature 2 (Login) — login redirect if not authenticated
- → Feature 10 (My Events) — attended events appear in "History" tab
- → Feature 13 (Admin Registrants) — attendance visible in registrant list
- → Feature 19 (Student Report) — counted in "Events Attended" stat
- → Feature 12 (Admin Dashboard) — updates attendance rate %

---

## 9. Post-event Survey

**Start:** Student clicks "Rate this Event" on a past event detail page → `/student/events/:id/survey`

**Guards:**
- Must be registered for the event
- Event must be past
- Survey not already submitted (if submitted, shows "Already submitted" state)

**Steps:**
1. Rate overall experience (1–5 stars)
2. Rate organization (1–5 stars)
3. Would recommend? (Yes / No toggle)
4. Optional text: "What did you like most?"
5. Optional text: "What could be improved?"
6. Optional text: "Other feedback"
7. Submit → `submitSurvey()` inserts into `event_surveys`

**End:** "Thank you!" confirmation screen; user can go back to My Events

**Connects to:**
- ← Feature 6 (Event Detail) — entry point
- → Feature 12 (Admin Dashboard) — avg survey rating stat updates
- → Feature 17 (Admin Surveys) — survey appears in admin survey list for that event

---

## 10. My Events (Student)

**Start:** Student taps "My Events" in nav → `/student/my-events`

**Tabs:**
- **Upcoming** — registered events that haven't happened yet
- **Saved** — bookmarked events
- **History** — events the student actually attended (attended = true)

**Stats shown:** Upcoming Registered count, Saved count, Past Attended count

**End:** Student taps any card → goes to Event Detail

**Connects to:**
- → Feature 6 (Event Detail) — clicking any card
- → Feature 7 (Bookmarks) — bookmark toggle works inline
- ← Feature 8 (QR Check-in) — attended events appear in History tab
- ← Feature 6 (Registration) — registered events appear in Upcoming tab

---

## 11. Student Profile

**Start:** Student taps "Profile" in nav → `/student/profile`

**Sections:**
- Avatar with initials
- Stats: Registered events, Saved, Attended
- Profile picture upload (camera button on the avatar, see Feature 24)
- Editable fields: Name, Mobiltelefon (phone), Heimatland (home country), study program, student status, German level
- Edit mode: save changes to `profiles` table in Supabase
- Sign Out button

**End:** Profile saved; or user signs out → Feature 4 (Logout)

**Connects to:**
- → Feature 4 (Logout) — sign out button
- → Feature 6 (Event Detail) — profile data (name, dept, year) auto-fills registration

---

## 12. Admin Dashboard

**Start:** Admin logs in → `/admin`

**Displays:**
- **Stats bar:** Total Events, Upcoming count, Total Registrations, Attendance Rate %, Avg Survey Rating
- **Upcoming Events list** (up to 4) with capacity fill bars — click → Edit Event
- **Recent Registrations** list (last 6)
- **Quick Stats:** Past Events, Total Attended, Survey Responses
- **Events by Category** — bar chart breakdown
- **Top Events by Registrations** — ranked list with fill bars

**Actions:**
- "New Event" button → Feature 13 (Create Event)
- "View all" → Feature 14 (Events List)
- Click event card → Feature 15 (Edit Event)

**Connects to:**
- → Feature 13 (Create Event)
- → Feature 14 (Admin Events List)
- → Feature 15 (Edit Event)
- ← Feature 8 (QR Check-in) — attendance rate updates
- ← Feature 9 (Survey) — avg rating updates

---

## 13. Create Event (Admin)

**Start:** Admin clicks "New Event" → `/admin/events/new`

**Steps:**
1. Fill EventForm: title, description, date, end date, time, venue, category, status, capacity, fee
2. Optional: organizer name, organizer email, banner image (upload, paste, Instagram import or `https://` URL), banner link, ticket URL, tags
3. Submit → `createEvent()` inserts into `events` table

**End:** Redirect to `/admin/events` (events list)

**Connects to:**
- → Feature 14 (Admin Events List) — new event appears
- → Feature 5 (Event Discovery) — students can now see and register
- ← Feature 12 (Admin Dashboard) — "New Event" entry point

---

## 14. Admin Events List

**Start:** Admin clicks "Events" in nav → `/admin/events`

**Displays:** All events with status badges, registrant counts, date, category

**Actions per event:**
- Click → Feature 15 (Edit Event)
- Delete event

**Connects to:**
- → Feature 15 (Edit Event)
- → Feature 13 (Create Event) — "New Event" button

---

## 15. Edit Event (Admin)

**Start:** Admin clicks an event → `/admin/events/:id`

**Steps:**
1. Load current event data → prefill EventForm
2. Edit any field
3. Save → `updateEvent()` patches `events` table

**Action buttons (top right):**
- **Surveys** → Feature 17 (Admin Surveys)
- **Show QR** → Feature 8 (QR Check-in) — shows QR modal
- **Registrants (N)** → Feature 16 (Registrants)

**Connects to:**
- → Feature 16 (Registrants)
- → Feature 17 (Admin Surveys)
- → Feature 8 (QR Check-in) — QR modal
- ← Feature 14 (Events List)
- ← Feature 12 (Dashboard) — upcoming event cards

---

## 16. Event Registrants (Admin)

**Start:** Admin clicks "Registrants" on edit event page → `/admin/events/:id/registrants`

**Displays:**
- Registrant count, attended count
- Table: name, email, department, year, payment status, attended toggle, notify button
- Search bar to filter registrants

**Actions:**
- **Toggle attendance** per student — `toggleAttendance()` updates DB
- **Notify one** — opens NotificationModal pre-filled for that student
- **Notify no-shows** — opens NotificationModal for all who didn't attend
- **Show QR** — QR modal shortcut
- **Export CSV** — downloads registrant data as CSV

**End:** Attendance updated; notifications sent; CSV downloaded

**Connects to:**
- → Feature 20 (Notifications) — notify modal opens inline
- ← Feature 8 (QR Check-in) — QR sets attendance; toggles here are manual override
- ← Feature 15 (Edit Event) — entry point

---

## 17. Event Surveys (Admin)

**Start:** Admin clicks "Surveys" on edit event page → `/admin/events/:id/surveys`

**Displays:**
- Avg overall rating, avg organization rating, % would recommend
- Individual survey cards: student name, ratings, text feedback
- Export CSV button

**End:** Admin reads feedback; optionally exports

**Connects to:**
- ← Feature 9 (Survey) — student submissions appear here
- ← Feature 15 (Edit Event) — entry point
- → Feature 12 (Admin Dashboard) — avg rating feeds dashboard

---

## 18. Admin Students List

**Start:** Admin clicks "Students" in nav → `/admin/students`

**Displays:**
- Stats: Total Students, Total Registrations, Total Attendances
- Search by name, email, or department
- Table: name, email, department, year, registered count, attended count

**Action:** Click row → Feature 19 (Student Report)

**Connects to:**
- → Feature 19 (Student Report)

---

## 19. Student Report (Admin)

**Start:** Admin clicks a student row → `/admin/students/:id`

**Displays:**
- Student profile card (name, email, department, year)
- Stats: Events Registered, Events Attended, Total Hours
- Event History table: event name, date, venue, attended (Yes/No), hours

**Action buttons:**
- **Notify** → opens NotificationModal for this student
- **Certificate** → generates participation certificate modal (printable)
- **Print Report** → triggers `window.print()`

**Connects to:**
- → Feature 20 (Notifications) — notify button
- ← Feature 18 (Students List) — entry point
- ← Feature 8 (QR Check-in) — attendance data shown here

---

## 20. Send Notifications (Admin)

**Start:** Admin clicks "Notify" in nav → `/admin/notifications`
**Or:** Admin clicks Notify button from Registrants page or Student Report page (opens inline modal)

**Steps (full page):**
1. Choose target type:
   - **All Students** — every student in DB
   - **By Department** — select department from dropdown
   - **By Event** — select event → loads registrants
   - **Pick Students** — search + checkbox select individual students
2. Recipient count shown in preview bar
3. Compose: Title (max 100 chars) + Message (max 500 chars)
4. Optional: use Quick Templates (Reminder, Update, Thank You)
5. Send → `sendNotificationToUsers()` batch inserts into `notifications` table

**End:** "Sent successfully!" confirmation; title/message cleared

**Connects to:**
- ← Feature 19 (Student Report) — inline modal via "Notify" button
- ← Feature 16 (Registrants) — inline modal for single student or all no-shows
- ← Admin nav — full-page entry
- → notifications received by students (shown in student notification bell if implemented)

---

## 21. Admin Profile

**Start:** Admin clicks "Profile" in nav or avatar → `/admin/profile`

**Sections:**
- Display: avatar initials, name, email, role badge
- Edit name → save to `profiles`
- Change password → `supabase.auth.updateUser({ password })`
- Sign Out button

**End:** Profile saved / password changed / logged out

**Connects to:**
- → Feature 4 (Logout)

---

## 22. Event Head (Team Head)

**Start:** Event head logs in → `/team-head`

**Steps:**
1. First visit: "Create your event" form (same EventForm as admins). An event head can create **one** event
2. After that: manage only their own event (registrants, attendance, surveys)

**Rules:** enforced by database policies. An event head can insert one event with `created_by = their id` and update only that event.

**Connects to:** Feature 13 (Create Event), Feature 23 (Super Admin — who creates the account)

---

## 23. Super Admin

**Start:** Super admin logs in → `/super-admin`

**Steps:**
1. View all organizers and event heads
2. "Create organizer" → `/api/super-admin/create-organizer` creates the account with role `admin` or `event_head`

**Note:** this is the only way an account gets posting rights. Students cannot promote themselves.

---

## 24. Image Upload

**Start:** Event form (banner) or Admin / Student profile (avatar)

**Steps:**
1. Pick or paste a JPG, PNG, WebP or GIF (max 4 MB)
2. Browser posts to `/api/upload` with `kind` = `banner` or `avatar`
3. Server checks the user is signed in (banners: admin, super_admin or event_head only), then stores the file with the service role

**Storage:** public buckets `event-banners` (banners) and `avatars` (one file per user id, replaced on re-upload)

**Fallback:** `EventImage` shows a placeholder when an event image is missing, not an `http(s)` link, or fails to load.

---

## 25. Jobs

**Start:** Student → `/student/jobs` (Discover, My Applications); Admin → `/admin/jobs`

**Steps:**
1. Admin posts a job (`/admin/jobs/new`), views applicants (`/admin/jobs/:id/applicants`)
2. Student opens a job, applies with a consent checkbox; duplicate applications are rejected
3. Public `/jobs` page lists jobs

**Tables:** `jobs`, `job_applications`

---

## 26. Landing Page

**Start:** Guest opens `/`

**Contents (all from real data, nothing invented):**
- Login card (email, password, Forgot password, Create new account) in the hero
- Next upcoming event with a live countdown, and a "Coming up" list from `events`
- Feature highlights and a four-step "How it works": create account, register, attend (QR check-in), feedback survey
- Sticky "Join free" bar on mobile

**Logged-in users** are redirected to their role home page (student, admin, event head, super admin).

---

## 27. Access Control

Row-level security rules (see `supabase/lockdown_rls.sql`):
- Only `admin` and `super_admin` (plus an event head for their own event) can create, edit or delete events and jobs
- Students can only read events and jobs, and manage their own registrations, bookmarks, surveys, job applications and profile
- Nobody can change their own role; signed-in users cannot read other users' profiles
- Sign-up is restricted by a database rule to `@stud.fh-sm.de` and `@gmail.com` addresses

---

## 28. Event Announcements and Notifications

**Organizer:** event page → **Announce** tab. Write a title and message, choose *Registered students* or *All students*, send. Each student gets an in-app notification linked to the event, and a phone push notification if they use the mobile app with notifications enabled.

**Student (web):** the bell in the top bar shows an unread count; opening a message goes to the event.
**Student (mobile):** a bell with an unread badge sits at the top of Events, My Events and Profile. It opens the inbox. Tapping a push notification opens the event.

**How push works:** the app saves each phone's Expo push token (`push_tokens`, via `register_push_token`). After an organizer sends, `/api/push/send` (organizers only) looks up the tokens and sends through Expo's push service. Android needs the Firebase (FCM) credentials; iOS needs the Push Notifications capability on the provisioning profile.

---

## 29. Add to Calendar

After registering for an upcoming event, students can add it to their calendar: Google Calendar link or an `.ics` download on the web; the phone's own "New Event" sheet on mobile. The event is added with title, venue and start time (default length 2 hours) and, in the `.ics`, a 1-hour reminder.

---

## CROSS-FEATURE CONNECTION MAP

```
[Guest]
  │
  ├── Register ──────────────────► Student Profile
  │                                      │
  └── Login ◄──── Forgot Password        │
        │                                │
        ├── [Student]                    │
        │     │                          │
        │     ├── Event Discovery ◄──────┘
        │     │     │
        │     │     └── Event Detail & Registration
        │     │               │
        │     │     ┌─────────┴──────────────────┐
        │     │     ▼                             ▼
        │     │  Bookmark/Save             QR Check-in (attend page)
        │     │     │                             │
        │     │     └──── My Events ◄─────────────┘
        │     │                 │
        │     │                 └── (History tab shows attended events)
        │     │
        │     ├── Post-event Survey ◄── Event Detail (past events)
        │     │
        │     └── Student Profile ──► Logout
        │
        └── [Admin]
              │
              ├── Dashboard
              │     │
              │     ├── Create Event
              │     │
              │     └── Edit Event ──┬── Registrants ──┬── Notifications (modal)
              │                      │                  └── QR Check-in (modal)
              │                      └── Surveys
              │
              ├── Students List
              │     │
              │     └── Student Report ──┬── Notifications (modal)
              │                          └── Certificate (modal / print)
              │
              ├── Notifications (full page)
              │
              └── Admin Profile ──► Logout
```

---

## DATABASE TABLES TOUCHED PER FEATURE

| Feature                   | Tables Read / Written                            |
|---------------------------|--------------------------------------------------|
| Sign Up                   | `profiles` (insert)                              |
| Login                     | `profiles` (read)                                |
| Event Discovery           | `events`, `bookmarks`, `registrations`           |
| Event Detail & Register   | `events`, `registrations` (insert/delete)        |
| Bookmarks                 | `bookmarks` (insert/delete)                      |
| QR Check-in               | `registrations` (update via RPC)                 |
| Survey                    | `event_surveys` (insert), `registrations` (read) |
| My Events                 | `events`, `registrations`, `bookmarks`           |
| Student Profile           | `profiles` (update), `registrations`, `bookmarks`|
| Admin Dashboard           | `events`, `registrations`, `event_surveys`       |
| Create / Edit Event       | `events` (insert/update)                         |
| Registrants               | `registrations` (read/update)                    |
| Event Surveys             | `event_surveys` (read)                           |
| Students List             | `profiles`, `registrations`                      |
| Student Report            | `profiles`, `registrations`, `events`            |
| Notifications             | `notifications` (insert), `profiles` (read)      |
| Admin Profile             | `profiles` (update)                              |
| Event Head                | `events` (insert one, update own)                |
| Super Admin               | `profiles` (read/update), auth admin API         |
| Image Upload              | storage buckets `event-banners`, `avatars`       |
| Jobs                      | `jobs`, `job_applications`                       |
| Landing Page              | `events` (read)                                  |
| Announcements / Push      | `notifications`, `push_tokens`                   |
