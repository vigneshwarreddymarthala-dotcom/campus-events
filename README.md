# Spirits

Campus event platform: students discover events, register, check in with a QR code and leave feedback; organizers create and manage events and jobs.

Built with Next.js, Supabase (auth, database, storage) and deployed on Vercel.

## Run locally

```bash
npm install
npm run dev
```

Needs a `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` and `SUPABASE_SERVICE_ROLE_KEY`.

## Database setup

Run these in the Supabase SQL Editor:

1. `supabase/schema.sql` — base tables
2. `supabase/profile_fields.sql` — phone, home country, study program, student status, German level
3. `supabase/lockdown_rls.sql` — row-level security so only authorized accounts can post or edit

## More

See `FEATURES.md` for every feature flow, role and table.
