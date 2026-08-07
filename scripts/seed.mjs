// Run: node scripts/seed.mjs
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://lunoscljzlkzepqekmpm.supabase.co";
const SUPABASE_KEY = "sb_publishable_Qi7YyBj98bSoOFstHXaFjw_0ZgfF9j8";
const PASSWORD = "Student@123";

const STUDENTS = [
  { name: "Priya Sharma",    email: "priyasharma.cs2@gmail.com",       dept: "Computer Science",       year: "2nd Year", phone: "9876543001" },
  { name: "Rahul Kumar",     email: "rahulkumar.it3@gmail.com",        dept: "Information Technology", year: "3rd Year", phone: "9876543002" },
  { name: "Anjali Patel",    email: "anjali.patel.ece1@outlook.com",   dept: "ECE",                    year: "1st Year", phone: "9876543003" },
  { name: "Mohammed Ali",    email: "mohd.ali.mech4@gmail.com",        dept: "Mechanical",             year: "4th Year", phone: "9876543004" },
  { name: "Divya Nair",      email: "divya.nair.civil2@yahoo.com",     dept: "Civil",                  year: "2nd Year", phone: "9876543005" },
  { name: "Arjun Singh",     email: "arjunsingh.cs3@gmail.com",        dept: "Computer Science",       year: "3rd Year", phone: "9876543006" },
  { name: "Sneha Reddy",     email: "sneha.reddy.mba1@outlook.com",    dept: "MBA",                    year: "1st Year", phone: "9876543007" },
  { name: "Karthik Menon",   email: "karthik.menon.eee2@gmail.com",    dept: "EEE",                    year: "2nd Year", phone: "9876543008" },
  { name: "Pooja Gupta",     email: "pooja.gupta.cs4@gmail.com",       dept: "Computer Science",       year: "4th Year", phone: "9876543009" },
  { name: "Aditya Verma",    email: "aditya.verma.it3@yahoo.com",      dept: "Information Technology", year: "3rd Year", phone: "9876543010" },
  { name: "Lakshmi Iyer",    email: "lakshmi.iyer.ece2@gmail.com",     dept: "ECE",                    year: "2nd Year", phone: "9876543011" },
  { name: "Vikram Rao",      email: "vikramrao.mech1@outlook.com",     dept: "Mechanical",             year: "1st Year", phone: "9876543012" },
  { name: "Meera Krishnan",  email: "meera.krishnan.civil4@gmail.com", dept: "Civil",                  year: "4th Year", phone: "9876543013" },
  { name: "Rohan Joshi",     email: "rohan.joshi.mba2@gmail.com",      dept: "MBA",                    year: "2nd Year", phone: "9876543014" },
  { name: "Kavitha Pillai",  email: "kavitha.pillai.cs3@outlook.com",  dept: "Computer Science",       year: "3rd Year", phone: "9876543015" },
];

const LIKED = [
  "Great organization and smooth flow",
  "Very informative and well-structured sessions",
  "Excellent speakers and inspiring content",
  "Loved the hands-on activities and demos",
  "Wonderful networking opportunities",
  "Engaging, interactive, and fun",
];
const IMPROVE = ["More time for Q&A", "Better venue facilities", null, null, null, null];

const delay = (ms) => new Promise((r) => setTimeout(r, ms));

function isPast(dateStr) {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

async function main() {
  // Fetch events using admin credentials first
  const adminClient = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });

  console.log("Signing in as admin to fetch events...");
  const { error: adminErr } = await adminClient.auth.signInWithPassword({
    email: "admin@college.edu",
    password: "admin123",
  });
  if (adminErr) { console.error("Admin sign-in failed:", adminErr.message); process.exit(1); }

  const { data: events, error: evErr } = await adminClient.from("events").select("*");
  if (evErr) { console.error("Failed to fetch events:", evErr.message); process.exit(1); }
  console.log(`Found ${events.length} events (${events.filter(e => isPast(e.date)).length} past, ${events.filter(e => !isPast(e.date)).length} upcoming)\n`);

  await adminClient.auth.signOut();

  let totalCreated = 0;
  let totalRegs = 0;
  let totalSurveys = 0;

  for (let i = 0; i < STUDENTS.length; i++) {
    const student = STUDENTS[i];
    console.log(`[${i + 1}/${STUDENTS.length}] ${student.name} (${student.email})`);

    // Each student gets its own Supabase client with isolated session
    const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false },
    });

    // Try signUp, fall back to signIn if already exists
    let userId = null;
    const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
      email: student.email,
      password: PASSWORD,
      options: {
        data: {
          name: student.name,
          role: "student",
          department: student.dept,
          year: student.year,
        },
      },
    });

    if (signUpErr) {
      if (signUpErr.message.toLowerCase().includes("already") || signUpErr.message.toLowerCase().includes("registered")) {
        process.stdout.write("  → Exists, signing in... ");
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: student.email,
          password: PASSWORD,
        });
        if (signInErr) { console.log(`FAILED: ${signInErr.message}`); continue; }
        userId = signInData.user?.id;
        console.log("ok");
      } else {
        console.log(`  → SignUp error: ${signUpErr.message}`);
        continue;
      }
    } else {
      userId = signUpData.user?.id;
      if (!userId) {
        // Email confirmation may be required — try signing in
        const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
          email: student.email,
          password: PASSWORD,
        });
        userId = signInData?.user?.id ?? null;
        if (signInErr || !userId) { console.log("  → Could not get session"); continue; }
      }
      console.log(`  → Created: ${userId.slice(0, 8)}...`);
      totalCreated++;
    }

    // Upsert profile
    await supabase.from("profiles").upsert({
      id: userId,
      name: student.name,
      email: student.email,
      role: "student",
      department: student.dept,
      year: student.year,
      phone: student.phone,
    });

    // Select events for this student
    const pastEvs = events.filter(e => isPast(e.date));
    const upcomingEvs = events.filter(e => !isPast(e.date));
    const myPast = pastEvs.filter((_, idx) => (idx + i) % 3 !== 2).slice(0, Math.min(5, pastEvs.length));
    const myUpcoming = upcomingEvs.filter((_, idx) => (idx + i) % 2 === 0).slice(0, Math.min(3, upcomingEvs.length));
    const myEvents = [...myPast, ...myUpcoming];

    let regCount = 0;
    let surveyCount = 0;

    for (let j = 0; j < myEvents.length; j++) {
      const event = myEvents[j];
      const eventIsPast = isPast(event.date);
      const attended = eventIsPast ? (i + j) % 3 !== 0 : false;

      const regDate = new Date(event.date);
      regDate.setDate(regDate.getDate() - (3 + (j % 4)));

      const { error: regErr } = await supabase.from("registrations").insert({
        event_id: event.id,
        user_id: userId,
        student_name: student.name,
        student_email: student.email,
        student_department: student.dept,
        student_year: student.year,
        payment_status: event.registration_fee === 0 ? "free" : "paid",
        attended,
        registered_at: regDate.toISOString(),
      });

      if (regErr) {
        if (regErr.code === "23505") {
          process.stdout.write(`    ↳ already registered: ${event.title.slice(0, 30)}\n`);
        } else {
          console.log(`    ↳ reg error: ${regErr.message}`);
        }
      } else {
        console.log(`    ↳ ${event.title.slice(0, 35)} — ${attended ? "attended ✓" : eventIsPast ? "absent ✗" : "upcoming"}`);
        regCount++;
      }

      // Survey for attended past events
      if (attended && eventIsPast) {
        const rating = 3 + (j % 3);
        const { error: survErr } = await supabase.from("event_surveys").insert({
          event_id: event.id,
          user_id: userId,
          student_name: student.name,
          student_email: student.email,
          rating,
          organization_rating: 3 + ((j + 1) % 3),
          would_recommend: rating >= 4,
          liked_most: LIKED[j % LIKED.length],
          could_improve: IMPROVE[j % IMPROVE.length],
          other_feedback: null,
          submitted_at: new Date(event.date).toISOString(),
        });
        if (!survErr) surveyCount++;
      }
    }

    totalRegs += regCount;
    totalSurveys += surveyCount;
    console.log(`  → ${regCount} registrations, ${surveyCount} surveys\n`);

    // Rate-limit buffer between students
    if (i < STUDENTS.length - 1) {
      process.stdout.write("  Waiting 4s...\n");
      await delay(4000);
    }
  }

  console.log("═══════════════════════════════════════");
  console.log(`✅ Done! ${totalCreated} new accounts, ${totalRegs} registrations, ${totalSurveys} surveys.`);
  console.log(`Password for all student accounts: ${PASSWORD}`);
}

main().catch(console.error);
