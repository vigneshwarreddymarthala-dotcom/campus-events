"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { getEvents } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2, AlertCircle, Database, Users, RefreshCw } from "lucide-react";

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

  function log(text: string, type: LogEntry["type"] = "info") {
    setLogs((prev) => [...prev, { text, type }]);
  }

  async function runSeed() {
    setRunning(true);
    setDone(false);
    setLogs([]);

    const supabase = createClient();

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

      // Try signUp; fall back to signIn if account already exists
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
        // Session might be pending email confirmation — try to get current user
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      }

      if (!userId) {
        log("  → Could not get user ID (email confirmation may be required)", "error");
        continue;
      }

      log(`  → User ID: ${userId.slice(0, 8)}...`, "success");

      // Upsert profile (trigger may have created it; ensure all fields are set)
      await supabase.from("profiles").upsert({
        id: userId,
        name: student.name,
        email: student.email,
        role: "student",
        department: student.dept,
        year: student.year,
        phone: student.phone,
      });

      // Pick events for this student (varied selection per student)
      const myPast = pastEvents.filter((_, idx) => (idx + i) % 3 !== 2).slice(0, Math.min(5, pastEvents.length));
      const myUpcoming = upcomingEvents.filter((_, idx) => (idx + i) % 2 === 0).slice(0, Math.min(3, upcomingEvents.length));
      const myEvents = [...myPast, ...myUpcoming];

      let regCount = 0;
      let surveyCount = 0;

      for (let j = 0; j < myEvents.length; j++) {
        const event = myEvents[j];
        const eventIsPast = isPast(event.date);

        // Attendance pattern: ~65% attended, varied by student+event index
        const attended = eventIsPast ? (i + j) % 3 !== 0 : false;

        // registered_at: a few days before the event
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

        // Insert survey for attended past events
        if (attended && eventIsPast) {
          const rating = 3 + (j % 3); // 3, 4, or 5
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

      // Wait between students to avoid Supabase auth rate limits
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
                The seed process creates accounts by signing in as each student. After seeding, you&apos;ll be redirected to login — sign back in as admin.
              </p>
            </div>
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
            <div className="mt-2 pt-3 border-t border-gray-200 text-xs text-gray-500 space-y-1">
              <p>Password for all accounts: <code className="bg-white border border-gray-200 px-1.5 py-0.5 rounded font-mono">{PASSWORD}</code></p>
              <p>Each student gets 4–7 event registrations with mixed attendance.</p>
            </div>
          </div>

          <Button onClick={runSeed} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
            <Database className="w-4 h-4" />
            Run Seed Data
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
