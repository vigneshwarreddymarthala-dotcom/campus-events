-- CampusEvents full seed — run in Supabase SQL Editor
-- Creates missing tables + 15 students + 85 registrations + 25 surveys
-- Student password: Student@123

-- ── Create missing tables ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.event_surveys (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  organization_rating INTEGER NOT NULL CHECK (organization_rating BETWEEN 1 AND 5),
  would_recommend BOOLEAN NOT NULL DEFAULT TRUE,
  liked_most TEXT,
  could_improve TEXT,
  other_feedback TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);
ALTER TABLE public.event_surveys ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_surveys' AND policyname='Anyone can read surveys') THEN
    CREATE POLICY "Anyone can read surveys" ON public.event_surveys FOR SELECT USING (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='event_surveys' AND policyname='Users insert own survey') THEN
    CREATE POLICY "Users insert own survey" ON public.event_surveys FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  event_id TEXT REFERENCES public.events(id) ON DELETE SET NULL,
  read BOOLEAN NOT NULL DEFAULT FALSE,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users read own notifications') THEN
    CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Anyone can insert notifications') THEN
    CREATE POLICY "Anyone can insert notifications" ON public.notifications FOR INSERT WITH CHECK (TRUE);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users update own notifications') THEN
    CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ── Auth users ───────────────────────────────────────────────────
INSERT INTO auth.users (id,instance_id,aud,role,email,encrypted_password,email_confirmed_at,created_at,updated_at,raw_user_meta_data,raw_app_meta_data,is_super_admin,confirmation_token,recovery_token,email_change_token_new,email_change)
VALUES
  ('b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','00000000-0000-0000-0000-000000000000','authenticated','authenticated','priyasharma.cs2@gmail.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Priya Sharma","role":"student","department":"Computer Science","year":"2nd Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('3e3ff657-afc8-4e32-89c8-5ff2de7ff893','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rahulkumar.it3@gmail.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Rahul Kumar","role":"student","department":"Information Technology","year":"3rd Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('b92aef44-6f5d-41e5-8073-cc6cb5dd361f','00000000-0000-0000-0000-000000000000','authenticated','authenticated','anjali.patel.ece1@outlook.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Anjali Patel","role":"student","department":"ECE","year":"1st Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('8463fbc9-9c82-4c79-b81d-b22ed463b39c','00000000-0000-0000-0000-000000000000','authenticated','authenticated','mohd.ali.mech4@gmail.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Mohammed Ali","role":"student","department":"Mechanical","year":"4th Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','00000000-0000-0000-0000-000000000000','authenticated','authenticated','divya.nair.civil2@yahoo.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Divya Nair","role":"student","department":"Civil","year":"2nd Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('9c011452-c478-4b9d-af33-76ac3a952a27','00000000-0000-0000-0000-000000000000','authenticated','authenticated','arjunsingh.cs3@gmail.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Arjun Singh","role":"student","department":"Computer Science","year":"3rd Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','00000000-0000-0000-0000-000000000000','authenticated','authenticated','sneha.reddy.mba1@outlook.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Sneha Reddy","role":"student","department":"MBA","year":"1st Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('2d810139-0d6e-4b33-96da-64a26e1ec478','00000000-0000-0000-0000-000000000000','authenticated','authenticated','karthik.menon.eee2@gmail.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Karthik Menon","role":"student","department":"EEE","year":"2nd Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('f3c9daa8-1978-444d-96d5-9cc6c1475156','00000000-0000-0000-0000-000000000000','authenticated','authenticated','pooja.gupta.cs4@gmail.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Pooja Gupta","role":"student","department":"Computer Science","year":"4th Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('d1362ce4-4d94-4db3-a861-687be041573a','00000000-0000-0000-0000-000000000000','authenticated','authenticated','aditya.verma.it3@yahoo.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Aditya Verma","role":"student","department":"Information Technology","year":"3rd Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('95c14665-438f-4c70-af1f-889cc78e80cd','00000000-0000-0000-0000-000000000000','authenticated','authenticated','lakshmi.iyer.ece2@gmail.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Lakshmi Iyer","role":"student","department":"ECE","year":"2nd Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('ecd64bf6-09e0-4c60-9abf-9abeedf6941f','00000000-0000-0000-0000-000000000000','authenticated','authenticated','vikramrao.mech1@outlook.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Vikram Rao","role":"student","department":"Mechanical","year":"1st Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('dd8816c6-92e4-4636-a589-2df9d37c3a3e','00000000-0000-0000-0000-000000000000','authenticated','authenticated','meera.krishnan.civil4@gmail.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Meera Krishnan","role":"student","department":"Civil","year":"4th Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('596ddce6-69a1-44ba-875d-3ba051bb55db','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rohan.joshi.mba2@gmail.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Rohan Joshi","role":"student","department":"MBA","year":"2nd Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','',''),
  ('8862bcaa-2a47-4414-beb4-06acf2ab0aef','00000000-0000-0000-0000-000000000000','authenticated','authenticated','kavitha.pillai.cs3@outlook.com',crypt('Student@123',gen_salt('bf')),NOW(),NOW(),NOW(),'{"name":"Kavitha Pillai","role":"student","department":"Computer Science","year":"3rd Year"}'::jsonb,'{"provider":"email","providers":["email"]}'::jsonb,FALSE,'','','','')
ON CONFLICT (id) DO NOTHING;

-- ── Profiles ────────────────────────────────────────────────────
INSERT INTO public.profiles (id,name,email,role,department,year) VALUES
  ('b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','Priya Sharma','priyasharma.cs2@gmail.com','student','Computer Science','2nd Year'),
  ('3e3ff657-afc8-4e32-89c8-5ff2de7ff893','Rahul Kumar','rahulkumar.it3@gmail.com','student','Information Technology','3rd Year'),
  ('b92aef44-6f5d-41e5-8073-cc6cb5dd361f','Anjali Patel','anjali.patel.ece1@outlook.com','student','ECE','1st Year'),
  ('8463fbc9-9c82-4c79-b81d-b22ed463b39c','Mohammed Ali','mohd.ali.mech4@gmail.com','student','Mechanical','4th Year'),
  ('776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','Divya Nair','divya.nair.civil2@yahoo.com','student','Civil','2nd Year'),
  ('9c011452-c478-4b9d-af33-76ac3a952a27','Arjun Singh','arjunsingh.cs3@gmail.com','student','Computer Science','3rd Year'),
  ('d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','Sneha Reddy','sneha.reddy.mba1@outlook.com','student','MBA','1st Year'),
  ('2d810139-0d6e-4b33-96da-64a26e1ec478','Karthik Menon','karthik.menon.eee2@gmail.com','student','EEE','2nd Year'),
  ('f3c9daa8-1978-444d-96d5-9cc6c1475156','Pooja Gupta','pooja.gupta.cs4@gmail.com','student','Computer Science','4th Year'),
  ('d1362ce4-4d94-4db3-a861-687be041573a','Aditya Verma','aditya.verma.it3@yahoo.com','student','Information Technology','3rd Year'),
  ('95c14665-438f-4c70-af1f-889cc78e80cd','Lakshmi Iyer','lakshmi.iyer.ece2@gmail.com','student','ECE','2nd Year'),
  ('ecd64bf6-09e0-4c60-9abf-9abeedf6941f','Vikram Rao','vikramrao.mech1@outlook.com','student','Mechanical','1st Year'),
  ('dd8816c6-92e4-4636-a589-2df9d37c3a3e','Meera Krishnan','meera.krishnan.civil4@gmail.com','student','Civil','4th Year'),
  ('596ddce6-69a1-44ba-875d-3ba051bb55db','Rohan Joshi','rohan.joshi.mba2@gmail.com','student','MBA','2nd Year'),
  ('8862bcaa-2a47-4414-beb4-06acf2ab0aef','Kavitha Pillai','kavitha.pillai.cs3@outlook.com','student','Computer Science','3rd Year')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name,email=EXCLUDED.email,department=EXCLUDED.department,year=EXCLUDED.year;

-- ── Registrations ───────────────────────────────────────────────
INSERT INTO public.registrations (event_id,user_id,student_name,student_email,student_department,student_year,payment_status,attended,registered_at)
VALUES
  ('e7','b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','Priya Sharma','priyasharma.cs2@gmail.com','Computer Science','2nd Year','free',false,'2025-08-07T00:00:00.000Z'),
  ('e8','b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','Priya Sharma','priyasharma.cs2@gmail.com','Computer Science','2nd Year','free',true,'2025-11-11T00:00:00.000Z'),
  ('e10','b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','Priya Sharma','priyasharma.cs2@gmail.com','Computer Science','2nd Year','free',true,'2026-01-13T00:00:00.000Z'),
  ('e1','b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','Priya Sharma','priyasharma.cs2@gmail.com','Computer Science','2nd Year','free',false,'2026-08-09T00:00:00.000Z'),
  ('e3','b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','Priya Sharma','priyasharma.cs2@gmail.com','Computer Science','2nd Year','free',false,'2026-09-02T00:00:00.000Z'),
  ('e5','b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','Priya Sharma','priyasharma.cs2@gmail.com','Computer Science','2nd Year','free',false,'2026-09-14T00:00:00.000Z'),
  ('e7','3e3ff657-afc8-4e32-89c8-5ff2de7ff893','Rahul Kumar','rahulkumar.it3@gmail.com','Information Technology','3rd Year','free',true,'2025-08-07T00:00:00.000Z'),
  ('e9','3e3ff657-afc8-4e32-89c8-5ff2de7ff893','Rahul Kumar','rahulkumar.it3@gmail.com','Information Technology','3rd Year','paid',true,'2025-12-01T00:00:00.000Z'),
  ('e10','3e3ff657-afc8-4e32-89c8-5ff2de7ff893','Rahul Kumar','rahulkumar.it3@gmail.com','Information Technology','3rd Year','free',false,'2026-01-13T00:00:00.000Z'),
  ('e2','3e3ff657-afc8-4e32-89c8-5ff2de7ff893','Rahul Kumar','rahulkumar.it3@gmail.com','Information Technology','3rd Year','paid',false,'2026-08-14T00:00:00.000Z'),
  ('e4','3e3ff657-afc8-4e32-89c8-5ff2de7ff893','Rahul Kumar','rahulkumar.it3@gmail.com','Information Technology','3rd Year','paid',false,'2026-09-07T00:00:00.000Z'),
  ('e6','3e3ff657-afc8-4e32-89c8-5ff2de7ff893','Rahul Kumar','rahulkumar.it3@gmail.com','Information Technology','3rd Year','paid',false,'2026-09-28T00:00:00.000Z'),
  ('e8','b92aef44-6f5d-41e5-8073-cc6cb5dd361f','Anjali Patel','anjali.patel.ece1@outlook.com','ECE','1st Year','free',true,'2025-11-12T00:00:00.000Z'),
  ('e9','b92aef44-6f5d-41e5-8073-cc6cb5dd361f','Anjali Patel','anjali.patel.ece1@outlook.com','ECE','1st Year','paid',false,'2025-12-01T00:00:00.000Z'),
  ('e1','b92aef44-6f5d-41e5-8073-cc6cb5dd361f','Anjali Patel','anjali.patel.ece1@outlook.com','ECE','1st Year','free',false,'2026-08-10T00:00:00.000Z'),
  ('e3','b92aef44-6f5d-41e5-8073-cc6cb5dd361f','Anjali Patel','anjali.patel.ece1@outlook.com','ECE','1st Year','free',false,'2026-08-30T00:00:00.000Z'),
  ('e5','b92aef44-6f5d-41e5-8073-cc6cb5dd361f','Anjali Patel','anjali.patel.ece1@outlook.com','ECE','1st Year','free',false,'2026-09-15T00:00:00.000Z'),
  ('e7','8463fbc9-9c82-4c79-b81d-b22ed463b39c','Mohammed Ali','mohd.ali.mech4@gmail.com','Mechanical','4th Year','free',false,'2025-08-07T00:00:00.000Z'),
  ('e8','8463fbc9-9c82-4c79-b81d-b22ed463b39c','Mohammed Ali','mohd.ali.mech4@gmail.com','Mechanical','4th Year','free',true,'2025-11-11T00:00:00.000Z'),
  ('e10','8463fbc9-9c82-4c79-b81d-b22ed463b39c','Mohammed Ali','mohd.ali.mech4@gmail.com','Mechanical','4th Year','free',true,'2026-01-13T00:00:00.000Z'),
  ('e2','8463fbc9-9c82-4c79-b81d-b22ed463b39c','Mohammed Ali','mohd.ali.mech4@gmail.com','Mechanical','4th Year','paid',false,'2026-08-14T00:00:00.000Z'),
  ('e4','8463fbc9-9c82-4c79-b81d-b22ed463b39c','Mohammed Ali','mohd.ali.mech4@gmail.com','Mechanical','4th Year','paid',false,'2026-09-07T00:00:00.000Z'),
  ('e6','8463fbc9-9c82-4c79-b81d-b22ed463b39c','Mohammed Ali','mohd.ali.mech4@gmail.com','Mechanical','4th Year','paid',false,'2026-09-28T00:00:00.000Z'),
  ('e7','776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','Divya Nair','divya.nair.civil2@yahoo.com','Civil','2nd Year','free',true,'2025-08-07T00:00:00.000Z'),
  ('e9','776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','Divya Nair','divya.nair.civil2@yahoo.com','Civil','2nd Year','paid',true,'2025-12-01T00:00:00.000Z'),
  ('e10','776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','Divya Nair','divya.nair.civil2@yahoo.com','Civil','2nd Year','free',false,'2026-01-13T00:00:00.000Z'),
  ('e1','776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','Divya Nair','divya.nair.civil2@yahoo.com','Civil','2nd Year','free',false,'2026-08-09T00:00:00.000Z'),
  ('e3','776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','Divya Nair','divya.nair.civil2@yahoo.com','Civil','2nd Year','free',false,'2026-09-02T00:00:00.000Z'),
  ('e5','776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','Divya Nair','divya.nair.civil2@yahoo.com','Civil','2nd Year','free',false,'2026-09-14T00:00:00.000Z'),
  ('e8','9c011452-c478-4b9d-af33-76ac3a952a27','Arjun Singh','arjunsingh.cs3@gmail.com','Computer Science','3rd Year','free',true,'2025-11-12T00:00:00.000Z'),
  ('e9','9c011452-c478-4b9d-af33-76ac3a952a27','Arjun Singh','arjunsingh.cs3@gmail.com','Computer Science','3rd Year','paid',false,'2025-12-01T00:00:00.000Z'),
  ('e2','9c011452-c478-4b9d-af33-76ac3a952a27','Arjun Singh','arjunsingh.cs3@gmail.com','Computer Science','3rd Year','paid',false,'2026-08-15T00:00:00.000Z'),
  ('e4','9c011452-c478-4b9d-af33-76ac3a952a27','Arjun Singh','arjunsingh.cs3@gmail.com','Computer Science','3rd Year','paid',false,'2026-09-04T00:00:00.000Z'),
  ('e6','9c011452-c478-4b9d-af33-76ac3a952a27','Arjun Singh','arjunsingh.cs3@gmail.com','Computer Science','3rd Year','paid',false,'2026-09-29T00:00:00.000Z'),
  ('e7','d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','Sneha Reddy','sneha.reddy.mba1@outlook.com','MBA','1st Year','free',false,'2025-08-07T00:00:00.000Z'),
  ('e8','d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','Sneha Reddy','sneha.reddy.mba1@outlook.com','MBA','1st Year','free',true,'2025-11-11T00:00:00.000Z'),
  ('e10','d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','Sneha Reddy','sneha.reddy.mba1@outlook.com','MBA','1st Year','free',true,'2026-01-13T00:00:00.000Z'),
  ('e1','d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','Sneha Reddy','sneha.reddy.mba1@outlook.com','MBA','1st Year','free',false,'2026-08-09T00:00:00.000Z'),
  ('e3','d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','Sneha Reddy','sneha.reddy.mba1@outlook.com','MBA','1st Year','free',false,'2026-09-02T00:00:00.000Z'),
  ('e5','d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','Sneha Reddy','sneha.reddy.mba1@outlook.com','MBA','1st Year','free',false,'2026-09-14T00:00:00.000Z'),
  ('e7','2d810139-0d6e-4b33-96da-64a26e1ec478','Karthik Menon','karthik.menon.eee2@gmail.com','EEE','2nd Year','free',true,'2025-08-07T00:00:00.000Z'),
  ('e9','2d810139-0d6e-4b33-96da-64a26e1ec478','Karthik Menon','karthik.menon.eee2@gmail.com','EEE','2nd Year','paid',true,'2025-12-01T00:00:00.000Z'),
  ('e10','2d810139-0d6e-4b33-96da-64a26e1ec478','Karthik Menon','karthik.menon.eee2@gmail.com','EEE','2nd Year','free',false,'2026-01-13T00:00:00.000Z'),
  ('e2','2d810139-0d6e-4b33-96da-64a26e1ec478','Karthik Menon','karthik.menon.eee2@gmail.com','EEE','2nd Year','paid',false,'2026-08-14T00:00:00.000Z'),
  ('e4','2d810139-0d6e-4b33-96da-64a26e1ec478','Karthik Menon','karthik.menon.eee2@gmail.com','EEE','2nd Year','paid',false,'2026-09-07T00:00:00.000Z'),
  ('e6','2d810139-0d6e-4b33-96da-64a26e1ec478','Karthik Menon','karthik.menon.eee2@gmail.com','EEE','2nd Year','paid',false,'2026-09-28T00:00:00.000Z'),
  ('e8','f3c9daa8-1978-444d-96d5-9cc6c1475156','Pooja Gupta','pooja.gupta.cs4@gmail.com','Computer Science','4th Year','free',true,'2025-11-12T00:00:00.000Z'),
  ('e9','f3c9daa8-1978-444d-96d5-9cc6c1475156','Pooja Gupta','pooja.gupta.cs4@gmail.com','Computer Science','4th Year','paid',false,'2025-12-01T00:00:00.000Z'),
  ('e1','f3c9daa8-1978-444d-96d5-9cc6c1475156','Pooja Gupta','pooja.gupta.cs4@gmail.com','Computer Science','4th Year','free',false,'2026-08-10T00:00:00.000Z'),
  ('e3','f3c9daa8-1978-444d-96d5-9cc6c1475156','Pooja Gupta','pooja.gupta.cs4@gmail.com','Computer Science','4th Year','free',false,'2026-08-30T00:00:00.000Z'),
  ('e5','f3c9daa8-1978-444d-96d5-9cc6c1475156','Pooja Gupta','pooja.gupta.cs4@gmail.com','Computer Science','4th Year','free',false,'2026-09-15T00:00:00.000Z'),
  ('e7','d1362ce4-4d94-4db3-a861-687be041573a','Aditya Verma','aditya.verma.it3@yahoo.com','Information Technology','3rd Year','free',false,'2025-08-07T00:00:00.000Z'),
  ('e8','d1362ce4-4d94-4db3-a861-687be041573a','Aditya Verma','aditya.verma.it3@yahoo.com','Information Technology','3rd Year','free',true,'2025-11-11T00:00:00.000Z'),
  ('e10','d1362ce4-4d94-4db3-a861-687be041573a','Aditya Verma','aditya.verma.it3@yahoo.com','Information Technology','3rd Year','free',true,'2026-01-13T00:00:00.000Z'),
  ('e2','d1362ce4-4d94-4db3-a861-687be041573a','Aditya Verma','aditya.verma.it3@yahoo.com','Information Technology','3rd Year','paid',false,'2026-08-14T00:00:00.000Z'),
  ('e4','d1362ce4-4d94-4db3-a861-687be041573a','Aditya Verma','aditya.verma.it3@yahoo.com','Information Technology','3rd Year','paid',false,'2026-09-07T00:00:00.000Z'),
  ('e6','d1362ce4-4d94-4db3-a861-687be041573a','Aditya Verma','aditya.verma.it3@yahoo.com','Information Technology','3rd Year','paid',false,'2026-09-28T00:00:00.000Z'),
  ('e7','95c14665-438f-4c70-af1f-889cc78e80cd','Lakshmi Iyer','lakshmi.iyer.ece2@gmail.com','ECE','2nd Year','free',true,'2025-08-07T00:00:00.000Z'),
  ('e9','95c14665-438f-4c70-af1f-889cc78e80cd','Lakshmi Iyer','lakshmi.iyer.ece2@gmail.com','ECE','2nd Year','paid',true,'2025-12-01T00:00:00.000Z'),
  ('e10','95c14665-438f-4c70-af1f-889cc78e80cd','Lakshmi Iyer','lakshmi.iyer.ece2@gmail.com','ECE','2nd Year','free',false,'2026-01-13T00:00:00.000Z'),
  ('e1','95c14665-438f-4c70-af1f-889cc78e80cd','Lakshmi Iyer','lakshmi.iyer.ece2@gmail.com','ECE','2nd Year','free',false,'2026-08-09T00:00:00.000Z'),
  ('e3','95c14665-438f-4c70-af1f-889cc78e80cd','Lakshmi Iyer','lakshmi.iyer.ece2@gmail.com','ECE','2nd Year','free',false,'2026-09-02T00:00:00.000Z'),
  ('e5','95c14665-438f-4c70-af1f-889cc78e80cd','Lakshmi Iyer','lakshmi.iyer.ece2@gmail.com','ECE','2nd Year','free',false,'2026-09-14T00:00:00.000Z'),
  ('e8','ecd64bf6-09e0-4c60-9abf-9abeedf6941f','Vikram Rao','vikramrao.mech1@outlook.com','Mechanical','1st Year','free',true,'2025-11-12T00:00:00.000Z'),
  ('e9','ecd64bf6-09e0-4c60-9abf-9abeedf6941f','Vikram Rao','vikramrao.mech1@outlook.com','Mechanical','1st Year','paid',false,'2025-12-01T00:00:00.000Z'),
  ('e2','ecd64bf6-09e0-4c60-9abf-9abeedf6941f','Vikram Rao','vikramrao.mech1@outlook.com','Mechanical','1st Year','paid',false,'2026-08-15T00:00:00.000Z'),
  ('e4','ecd64bf6-09e0-4c60-9abf-9abeedf6941f','Vikram Rao','vikramrao.mech1@outlook.com','Mechanical','1st Year','paid',false,'2026-09-04T00:00:00.000Z'),
  ('e6','ecd64bf6-09e0-4c60-9abf-9abeedf6941f','Vikram Rao','vikramrao.mech1@outlook.com','Mechanical','1st Year','paid',false,'2026-09-29T00:00:00.000Z'),
  ('e7','dd8816c6-92e4-4636-a589-2df9d37c3a3e','Meera Krishnan','meera.krishnan.civil4@gmail.com','Civil','4th Year','free',false,'2025-08-07T00:00:00.000Z'),
  ('e8','dd8816c6-92e4-4636-a589-2df9d37c3a3e','Meera Krishnan','meera.krishnan.civil4@gmail.com','Civil','4th Year','free',true,'2025-11-11T00:00:00.000Z'),
  ('e10','dd8816c6-92e4-4636-a589-2df9d37c3a3e','Meera Krishnan','meera.krishnan.civil4@gmail.com','Civil','4th Year','free',true,'2026-01-13T00:00:00.000Z'),
  ('e1','dd8816c6-92e4-4636-a589-2df9d37c3a3e','Meera Krishnan','meera.krishnan.civil4@gmail.com','Civil','4th Year','free',false,'2026-08-09T00:00:00.000Z'),
  ('e3','dd8816c6-92e4-4636-a589-2df9d37c3a3e','Meera Krishnan','meera.krishnan.civil4@gmail.com','Civil','4th Year','free',false,'2026-09-02T00:00:00.000Z'),
  ('e5','dd8816c6-92e4-4636-a589-2df9d37c3a3e','Meera Krishnan','meera.krishnan.civil4@gmail.com','Civil','4th Year','free',false,'2026-09-14T00:00:00.000Z'),
  ('e7','596ddce6-69a1-44ba-875d-3ba051bb55db','Rohan Joshi','rohan.joshi.mba2@gmail.com','MBA','2nd Year','free',true,'2025-08-07T00:00:00.000Z'),
  ('e9','596ddce6-69a1-44ba-875d-3ba051bb55db','Rohan Joshi','rohan.joshi.mba2@gmail.com','MBA','2nd Year','paid',true,'2025-12-01T00:00:00.000Z'),
  ('e10','596ddce6-69a1-44ba-875d-3ba051bb55db','Rohan Joshi','rohan.joshi.mba2@gmail.com','MBA','2nd Year','free',false,'2026-01-13T00:00:00.000Z'),
  ('e2','596ddce6-69a1-44ba-875d-3ba051bb55db','Rohan Joshi','rohan.joshi.mba2@gmail.com','MBA','2nd Year','paid',false,'2026-08-14T00:00:00.000Z'),
  ('e4','596ddce6-69a1-44ba-875d-3ba051bb55db','Rohan Joshi','rohan.joshi.mba2@gmail.com','MBA','2nd Year','paid',false,'2026-09-07T00:00:00.000Z'),
  ('e6','596ddce6-69a1-44ba-875d-3ba051bb55db','Rohan Joshi','rohan.joshi.mba2@gmail.com','MBA','2nd Year','paid',false,'2026-09-28T00:00:00.000Z'),
  ('e8','8862bcaa-2a47-4414-beb4-06acf2ab0aef','Kavitha Pillai','kavitha.pillai.cs3@outlook.com','Computer Science','3rd Year','free',true,'2025-11-12T00:00:00.000Z'),
  ('e9','8862bcaa-2a47-4414-beb4-06acf2ab0aef','Kavitha Pillai','kavitha.pillai.cs3@outlook.com','Computer Science','3rd Year','paid',false,'2025-12-01T00:00:00.000Z'),
  ('e1','8862bcaa-2a47-4414-beb4-06acf2ab0aef','Kavitha Pillai','kavitha.pillai.cs3@outlook.com','Computer Science','3rd Year','free',false,'2026-08-10T00:00:00.000Z'),
  ('e3','8862bcaa-2a47-4414-beb4-06acf2ab0aef','Kavitha Pillai','kavitha.pillai.cs3@outlook.com','Computer Science','3rd Year','free',false,'2026-08-30T00:00:00.000Z'),
  ('e5','8862bcaa-2a47-4414-beb4-06acf2ab0aef','Kavitha Pillai','kavitha.pillai.cs3@outlook.com','Computer Science','3rd Year','free',false,'2026-09-15T00:00:00.000Z')
ON CONFLICT DO NOTHING;

-- ── Surveys ─────────────────────────────────────────────────────
INSERT INTO public.event_surveys (event_id,user_id,student_name,student_email,rating,organization_rating,would_recommend,liked_most,could_improve,other_feedback,submitted_at)
VALUES
  ('e8','b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','Priya Sharma','priyasharma.cs2@gmail.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-11-15T10:00:00Z'),
  ('e10','b70c6ada-1519-4d2e-b2ce-29e0c13c15a9','Priya Sharma','priyasharma.cs2@gmail.com',5,3,TRUE,'Excellent speakers and content',NULL,NULL,'2026-01-18T10:00:00Z'),
  ('e7','3e3ff657-afc8-4e32-89c8-5ff2de7ff893','Rahul Kumar','rahulkumar.it3@gmail.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-08-10T10:00:00Z'),
  ('e9','3e3ff657-afc8-4e32-89c8-5ff2de7ff893','Rahul Kumar','rahulkumar.it3@gmail.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-12-05T10:00:00Z'),
  ('e8','b92aef44-6f5d-41e5-8073-cc6cb5dd361f','Anjali Patel','anjali.patel.ece1@outlook.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-11-15T10:00:00Z'),
  ('e8','8463fbc9-9c82-4c79-b81d-b22ed463b39c','Mohammed Ali','mohd.ali.mech4@gmail.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-11-15T10:00:00Z'),
  ('e10','8463fbc9-9c82-4c79-b81d-b22ed463b39c','Mohammed Ali','mohd.ali.mech4@gmail.com',5,3,TRUE,'Excellent speakers and content',NULL,NULL,'2026-01-18T10:00:00Z'),
  ('e7','776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','Divya Nair','divya.nair.civil2@yahoo.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-08-10T10:00:00Z'),
  ('e9','776ea0f0-26bf-44d6-aa7c-f44ef332b7f3','Divya Nair','divya.nair.civil2@yahoo.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-12-05T10:00:00Z'),
  ('e8','9c011452-c478-4b9d-af33-76ac3a952a27','Arjun Singh','arjunsingh.cs3@gmail.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-11-15T10:00:00Z'),
  ('e8','d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','Sneha Reddy','sneha.reddy.mba1@outlook.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-11-15T10:00:00Z'),
  ('e10','d84d4b89-ab9d-4b6b-ab80-3a201ee3f32c','Sneha Reddy','sneha.reddy.mba1@outlook.com',5,3,TRUE,'Excellent speakers and content',NULL,NULL,'2026-01-18T10:00:00Z'),
  ('e7','2d810139-0d6e-4b33-96da-64a26e1ec478','Karthik Menon','karthik.menon.eee2@gmail.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-08-10T10:00:00Z'),
  ('e9','2d810139-0d6e-4b33-96da-64a26e1ec478','Karthik Menon','karthik.menon.eee2@gmail.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-12-05T10:00:00Z'),
  ('e8','f3c9daa8-1978-444d-96d5-9cc6c1475156','Pooja Gupta','pooja.gupta.cs4@gmail.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-11-15T10:00:00Z'),
  ('e8','d1362ce4-4d94-4db3-a861-687be041573a','Aditya Verma','aditya.verma.it3@yahoo.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-11-15T10:00:00Z'),
  ('e10','d1362ce4-4d94-4db3-a861-687be041573a','Aditya Verma','aditya.verma.it3@yahoo.com',5,3,TRUE,'Excellent speakers and content',NULL,NULL,'2026-01-18T10:00:00Z'),
  ('e7','95c14665-438f-4c70-af1f-889cc78e80cd','Lakshmi Iyer','lakshmi.iyer.ece2@gmail.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-08-10T10:00:00Z'),
  ('e9','95c14665-438f-4c70-af1f-889cc78e80cd','Lakshmi Iyer','lakshmi.iyer.ece2@gmail.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-12-05T10:00:00Z'),
  ('e8','ecd64bf6-09e0-4c60-9abf-9abeedf6941f','Vikram Rao','vikramrao.mech1@outlook.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-11-15T10:00:00Z'),
  ('e8','dd8816c6-92e4-4636-a589-2df9d37c3a3e','Meera Krishnan','meera.krishnan.civil4@gmail.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-11-15T10:00:00Z'),
  ('e10','dd8816c6-92e4-4636-a589-2df9d37c3a3e','Meera Krishnan','meera.krishnan.civil4@gmail.com',5,3,TRUE,'Excellent speakers and content',NULL,NULL,'2026-01-18T10:00:00Z'),
  ('e7','596ddce6-69a1-44ba-875d-3ba051bb55db','Rohan Joshi','rohan.joshi.mba2@gmail.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-08-10T10:00:00Z'),
  ('e9','596ddce6-69a1-44ba-875d-3ba051bb55db','Rohan Joshi','rohan.joshi.mba2@gmail.com',4,5,TRUE,'Very informative sessions','Better venue facilities',NULL,'2025-12-05T10:00:00Z'),
  ('e8','8862bcaa-2a47-4414-beb4-06acf2ab0aef','Kavitha Pillai','kavitha.pillai.cs3@outlook.com',3,4,FALSE,'Great organization and smooth flow','More time for Q&A',NULL,'2025-11-15T10:00:00Z')
ON CONFLICT (event_id,user_id) DO NOTHING;

SELECT 'Done: 15 students, 85 registrations, 25 surveys' AS result;
