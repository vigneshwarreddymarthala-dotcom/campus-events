"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getEvents, deleteEvent, createEvent } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertCircle, Database, Users, RefreshCw, Trash2, ShieldOff } from "lucide-react";

const PASSWORD = "Student@123";

const FAKE_STUDENTS = [
  { name: "Priya Sharma",    email: "priyasharma.cs2@gmail.com",      dept: "Computer Science",       year: "2nd Year", phone: "9876543001" },
  { name: "Rahul Kumar",     email: "rahulkumar.it3@gmail.com",       dept: "Information Technology", year: "3rd Year", phone: "9876543002" },
  { name: "Anjali Patel",    email: "anjali.patel.ece1@outlook.com",  dept: "ECE",                    year: "1st Year", phone: "9876543003" },
  { name: "Mohammed Ali",    email: "mohd.ali.mech4@gmail.com",       dept: "Mechanical",             year: "4th Year", phone: "9876543004" },
  { name: "Divya Nair",      email: "divya.nair.civil2@yahoo.com",    dept: "Civil",                  year: "2nd Year", phone: "9876543005" },
  { name: "Arjun Singh",     email: "arjunsingh.cs3@gmail.com",       dept: "Computer Science",       year: "3rd Year", phone: "9876543006" },
  { name: "Sneha Reddy",     email: "sneha.reddy.mba1@outlook.com",   dept: "MBA",                    year: "1st Year", phone: "9876543007" },
  { name: "Karthik Menon",   email: "karthik.menon.eee2@gmail.com",   dept: "EEE",                    year: "2nd Year", phone: "9876543008" },
  { name: "Pooja Gupta",     email: "pooja.gupta.cs4@gmail.com",      dept: "Computer Science",       year: "4th Year", phone: "9876543009" },
  { name: "Aditya Verma",    email: "aditya.verma.it3@yahoo.com",     dept: "Information Technology", year: "3rd Year", phone: "9876543010" },
  { name: "Lakshmi Iyer",    email: "lakshmi.iyer.ece2@gmail.com",    dept: "ECE",                    year: "2nd Year", phone: "9876543011" },
  { name: "Vikram Rao",      email: "vikramrao.mech1@outlook.com",    dept: "Mechanical",             year: "1st Year", phone: "9876543012" },
  { name: "Meera Krishnan",  email: "meera.krishnan.civil4@gmail.com",dept: "Civil",                  year: "4th Year", phone: "9876543013" },
  { name: "Rohan Joshi",     email: "rohan.joshi.mba2@gmail.com",     dept: "MBA",                    year: "2nd Year", phone: "9876543014" },
  { name: "Kavitha Pillai",  email: "kavitha.pillai.cs3@outlook.com", dept: "Computer Science",       year: "3rd Year", phone: "9876543015" },
];

const LIKED = [
  "Great organization and smooth flow",
  "Very informative and well-structured sessions",
  "Excellent speakers and inspiring content",
  "Loved the hands-on activities and demos",
  "Wonderful networking opportunities",
  "Engaging, interactive, and fun",
];

const IMPROVE = [
  "More time for Q&A sessions",
  "Better venue facilities and seating",
  "Could use more interactive activities",
  null,
  null,
  null,
];

const REAL_EVENTS = [
  {
    title: "Career Fair Prep & Resume Review",
    description: "Get your resume reviewed by industry experts and prepare for the upcoming engineering career fair.",
    date: "2026-08-20",
    time: "14:00",
    venue: "Student Union, Hall B",
    category: "workshop",
    status: "completed",
    capacity: 100,
    registration_fee: 0,
    organizer_name: "Career Services",
    organizer_email: "careers@college.edu",
    organizer_department: "Student Affairs",
    tags: ["Career", "Resume", "Workshop"],
    banner_image: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80",
    requirements: ["Bring a printed copy of your resume"]
  },
  {
    title: "Guest Lecture: The Future of AI in Tech",
    description: "Join us for an insightful lecture by industry leaders on how artificial intelligence is reshaping software engineering.",
    date: "2026-08-24",
    time: "10:00",
    venue: "Main Auditorium",
    category: "seminar",
    status: "completed",
    capacity: 250,
    registration_fee: 0,
    organizer_name: "Computer Science Dept",
    organizer_email: "cs@college.edu",
    organizer_department: "Computer Science",
    tags: ["AI", "Tech", "Lecture"],
    banner_image: "https://images.unsplash.com/photo-1593508512255-86ab42a8e620?w=800&q=80",
    requirements: []
  },
  {
    title: "Campus Welcome Party 2026",
    description: "Kick off the fall semester with food, music, and games! Meet new friends and discover campus clubs.",
    date: "2026-08-26",
    time: "17:00",
    venue: "Main Quad",
    category: "cultural",
    status: "completed",
    capacity: 500,
    registration_fee: 5,
    organizer_name: "Student Government",
    organizer_email: "sga@college.edu",
    organizer_department: "Student Affairs",
    tags: ["Social", "Welcome", "Party"],
    banner_image: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800&q=80",
    requirements: ["Bring your student ID"]
  },
  {
    title: "Intro to Open Source Hackathon",
    description: "A 12-hour beginner-friendly hackathon to introduce you to Git, GitHub, and contributing to open source projects.",
    date: "2026-08-28",
    time: "09:00",
    venue: "Library Makerspace",
    category: "hackathon",
    status: "completed",
    capacity: 80,
    registration_fee: 0,
    organizer_name: "Open Source Club",
    organizer_email: "opensource@college.edu",
    organizer_department: "Clubs",
    tags: ["Hackathon", "Open Source", "Coding"],
    banner_image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=800&q=80",
    requirements: ["Bring your laptop", "Install Git"]
  },
  {
    title: "Tech Startup Pitch Night",
    description: "Watch student founders pitch their startup ideas to a panel of alumni investors for a chance to win funding.",
    date: "2026-09-05",
    time: "18:00",
    venue: "Business School Auditorium",
    category: "competition",
    status: "upcoming",
    capacity: 150,
    registration_fee: 0,
    organizer_name: "Entrepreneurship Cell",
    organizer_email: "ecell@college.edu",
    organizer_department: "Clubs",
    tags: ["Startup", "Pitch", "Business"],
    banner_image: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800&q=80",
    requirements: []
  },
  {
    title: "Annual Engineering Career Fair",
    description: "Connect with recruiters from over 50 top tech companies offering internships and full-time roles.",
    date: "2026-09-12",
    time: "10:00",
    venue: "Indoor Stadium",
    category: "cultural",
    status: "upcoming",
    capacity: 1000,
    registration_fee: 0,
    organizer_name: "Career Services",
    organizer_email: "careers@college.edu",
    organizer_department: "Student Affairs",
    tags: ["Career Fair", "Jobs", "Engineering"],
    banner_image: "https://images.unsplash.com/photo-1560523159-4a9692d222f9?w=800&q=80",
    requirements: ["Business casual attire", "Multiple copies of resume"]
  },
  {
    title: "Web3 & Blockchain Workshop",
    description: "Learn the fundamentals of blockchain technology and write your first smart contract in Solidity.",
    date: "2026-09-18",
    time: "15:00",
    venue: "Computer Center, Lab 3",
    category: "workshop",
    status: "upcoming",
    capacity: 50,
    registration_fee: 10,
    organizer_name: "Blockchain Club",
    organizer_email: "blockchain@college.edu",
    organizer_department: "Clubs",
    tags: ["Web3", "Blockchain", "Coding"],
    banner_image: "https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=800&q=80",
    requirements: ["Basic programming knowledge"]
  },
  {
    title: "Alumni Networking Mixer",
    description: "An evening of networking and mentorship with distinguished alumni from various industries.",
    date: "2026-09-25",
    time: "19:00",
    venue: "University Hotel Banquet",
    category: "seminar",
    status: "upcoming",
    capacity: 200,
    registration_fee: 25,
    organizer_name: "Alumni Association",
    organizer_email: "alumni@college.edu",
    organizer_department: "Alumni",
    tags: ["Networking", "Alumni", "Mixer"],
    banner_image: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80",
    requirements: ["Register by Sep 15"]
  }
];

type LogEntry = { text: string; type: "info" | "success" | "error" | "warn" };

function isPast(dateStr: string) {
  return new Date(dateStr) < new Date(new Date().toDateString());
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function SeedPage() {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [done, setDone] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hardReset, setHardReset] = useState(false);

  function log(text: string, type: LogEntry["type"] = "info") {
    setLogs((prev) => [...prev, { text, type }]);
  }

  async function runSeed() {
    setRunning(true);
    setDone(false);
    setLogs([]);

    const supabase = createClient();

    if (hardReset) {
      log("HARD RESET: Fetching all existing events...", "warn");
      try {
        const existingEvents = await getEvents();
        log(`Found ${existingEvents.length} events to delete.`, "warn");
        
        for (const ev of existingEvents) {
          log(`Deleting event: ${ev.title}...`);
          await deleteEvent(ev.id);
        }
        
        log("Existing events deleted successfully.", "success");
        
        log("Inserting 8 real-world events...", "info");
        for (const realEv of REAL_EVENTS) {
          log(`Creating event: ${realEv.title}...`);
          await createEvent({
            ...realEv,
            end_date: null,
            end_time: null,
            banner_link: null,
            ticket_url: null,
            created_by: null,
            publish_at: null,
          });
        }
        log("Successfully created 8 realistic events!", "success");
      } catch (err: any) {
        log(`Hard reset failed: ${err.message}`, "error");
        setRunning(false);
        return;
      }
    }

    log("Loading events from database...");
    let events: Awaited<ReturnType<typeof getEvents>>;
    try {
      events = await getEvents();
    } catch {
      log("Failed to load events. Make sure you have events in the database.", "error");
      setRunning(false);
      return;
    }

    if (events.length === 0) {
      log("No events found. Please create some events first.", "error");
      setRunning(false);
      return;
    }

    const pastEvents = events.filter((e) => isPast(e.date));
    const upcomingEvents = events.filter((e) => !isPast(e.date));
    log(`Found ${events.length} events (${pastEvents.length} past, ${upcomingEvents.length} upcoming).`, "success");

    for (let i = 0; i < FAKE_STUDENTS.length; i++) {
      const student = FAKE_STUDENTS[i];
      log(`\n[${i + 1}/${FAKE_STUDENTS.length}] ${student.name} (${student.email})`);

      let userId: string | null = null;

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
        if (signUpErr.message.toLowerCase().includes("already registered") || signUpErr.message.toLowerCase().includes("already been registered")) {
          log("  → Account exists, signing in...", "warn");
          const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
            email: student.email,
            password: PASSWORD,
          });
          if (signInErr) {
            log(`  → Sign-in failed: ${signInErr.message}`, "error");
            continue;
          }
          userId = signInData.user?.id ?? null;
        } else {
          log(`  → SignUp error: ${signUpErr.message}`, "error");
          continue;
        }
      } else {
        userId = signUpData.user?.id ?? null;
      }

      if (!userId) {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      }

      if (!userId) {
        log("  → Could not get user ID (email confirmation may be required)", "error");
        continue;
      }

      log(`  → User ID: ${userId.slice(0, 8)}...`, "success");

      await supabase.from("profiles").upsert({
        id: userId,
        name: student.name,
        email: student.email,
        role: "student",
        department: student.dept,
        year: student.year,
        phone: student.phone,
      });

      const myPast = pastEvents.filter((_, idx) => (idx + i) % 3 !== 2).slice(0, Math.min(5, pastEvents.length));
      const myUpcoming = upcomingEvents.filter((_, idx) => (idx + i) % 2 === 0).slice(0, Math.min(3, upcomingEvents.length));
      const myEvents = [...myPast, ...myUpcoming];

      let regCount = 0;
      let surveyCount = 0;

      for (let j = 0; j < myEvents.length; j++) {
        const event = myEvents[j];
        const eventIsPast = isPast(event.date);

        const attended = eventIsPast ? (i + j) % 3 !== 0 : false;

        const eventDate = new Date(event.date);
        const regDate = new Date(eventDate);
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
            log(`    ↳ Already registered for "${event.title}"`, "warn");
          } else {
            log(`    ↳ Reg error for "${event.title}": ${regErr.message}`, "error");
          }
        } else {
          log(`    ↳ ${event.title} — ${attended ? "attended ✓" : eventIsPast ? "absent ✗" : "upcoming"}`);
          regCount++;
        }

        if (attended && eventIsPast) {
          const rating = 3 + (j % 3);
          const orgRating = 3 + ((j + 1) % 3);
          const { error: survErr } = await supabase.from("event_surveys").insert({
            event_id: event.id,
            user_id: userId,
            student_name: student.name,
            student_email: student.email,
            rating,
            organization_rating: orgRating,
            would_recommend: rating >= 4,
            liked_most: LIKED[j % LIKED.length],
            could_improve: IMPROVE[j % IMPROVE.length],
            other_feedback: null,
            submitted_at: new Date(event.date).toISOString(),
          });
          if (!survErr) surveyCount++;
        }
      }

      log(`  → ${regCount} registrations, ${surveyCount} surveys`, "success");

      if (i < FAKE_STUDENTS.length - 1) {
        log("  → Waiting 2s before next signup...");
        await delay(2000);
      }
    }

    log("\n✅ All done! 15 student accounts seeded.", "success");
    log(`Password for all accounts: ${PASSWORD}`, "info");
    log("Signing out in 5 seconds — please log back in as admin.", "info");

    setDone(true);
    setRunning(false);

    setTimeout(async () => {
      await supabase.auth.signOut();
      router.push("/login");
    }, 5000);
  }

  if (process.env.NODE_ENV === "production") {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center space-y-3">
          <ShieldOff className="w-10 h-10 text-gray-300 mx-auto" />
          <h1 className="text-lg font-semibold text-gray-900">Not available in production</h1>
          <p className="text-sm text-gray-500">This tool can wipe live event data and is disabled outside development.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Database className="w-6 h-6 text-indigo-600" />
          Seed Test Data
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Creates 15 realistic student accounts with registrations, attendance, and survey data.
        </p>
      </div>

      {!running && !done && (
        <Card className="p-6 space-y-5">
          <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">This will sign you out when complete</p>
              <p className="mt-1 text-amber-700">
                The seed process creates accounts by signing in as each student. After seeding, you'll be redirected to login — sign back in as admin.
              </p>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3 border border-gray-200">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="pt-1">
                <input
                  type="checkbox"
                  checked={hardReset}
                  onChange={(e) => setHardReset(e.target.checked)}
                  className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500"
                />
              </div>
              <div>
                <p className="text-sm font-bold text-red-700 flex items-center gap-1.5">
                  <Trash2 className="w-4 h-4" /> Hard Reset Database First
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  If checked, this will <strong>DELETE ALL EXISTING EVENTS</strong>, wipe the database completely, and insert 8 brand new, highly-realistic college events (4 past, 4 upcoming) before seeding the student data.
                </p>
              </div>
            </label>
          </div>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-500" />
              {FAKE_STUDENTS.length} students will be created
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1">
              {FAKE_STUDENTS.map((s) => (
                <div key={s.email} className="text-xs text-gray-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>{s.name}</span>
                  <span className="text-gray-400">· {s.dept.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={runSeed} className={`w-full ${hardReset ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'} gap-2`}>
            <Database className="w-4 h-4" />
            {hardReset ? "Hard Reset & Seed Application" : "Run Seed Data"}
          </Button>
        </Card>
      )}

      {(running || logs.length > 0) && (
        <Card className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            {running ? (
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
            ) : done ? (
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            ) : (
              <RefreshCw className="w-4 h-4 text-gray-400" />
            )}
            <span className="text-sm font-semibold text-gray-900">
              {running ? "Seeding in progress…" : done ? "Seeding complete!" : "Idle"}
            </span>
          </div>

          <div className="bg-gray-950 rounded-xl p-3 text-xs font-mono max-h-[480px] overflow-y-auto space-y-0.5">
            {logs.map((entry, idx) => (
              <p
                key={idx}
                className={
                  entry.type === "success" ? "text-green-400" :
                  entry.type === "error"   ? "text-red-400"   :
                  entry.type === "warn"    ? "text-yellow-400" :
                  "text-gray-300"
                }
              >
                {entry.text}
              </p>
            ))}
            {running && <p className="text-indigo-400 animate-pulse">▌</p>}
          </div>

          {done && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              <p className="font-semibold">✅ Done! Redirecting to login in 5 seconds…</p>
              <p className="mt-1 text-green-700">Log back in as admin to see all the seeded data.</p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
