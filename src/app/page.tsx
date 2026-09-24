"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import {
  GraduationCap, Calendar, QrCode, Bell, BarChart3, Bookmark,
  ArrowRight, CheckCircle2,
} from "lucide-react";

const STATS = [
  { number: "50+", label: "Events / Month" },
  { number: "1,500+", label: "Students" },
  { number: "100%", label: "Free to Use" },
];

const FEATURES = [
  {
    icon: Calendar,
    title: "Know what's on, instantly",
    body: "One calendar for every workshop, seminar, and fest on campus. No more finding out an event happened after it's over.",
  },
  {
    icon: Bookmark,
    title: "Save your spot before it's gone",
    body: "Your details are already saved, so claiming a seat is one tap — not another form. Bookmark anything you're still deciding on.",
  },
  {
    icon: QrCode,
    title: "Walk in, you're marked present",
    body: "Scan at the door and you're checked in. No queues, no sign-in sheets, no chasing anyone down after.",
  },
  {
    icon: Bell,
    title: "Nothing sneaks up on you",
    body: "A nudge before your event starts, an instant heads-up if the venue or time changes. You're never the last to know.",
  },
  {
    icon: BarChart3,
    title: "Run the event, not a spreadsheet",
    body: "Organizers get live registration numbers, real attendance data, and a registrant export whenever they need one.",
  },
  {
    icon: CheckCircle2,
    title: "Real students, real numbers",
    body: "Every account is a verified college email, so the people on this platform — and the turnout you see — are real.",
  },
];

const STEPS = [
  { step: "01", title: "Find an event", body: "Browse the calendar or feed for what's happening on campus." },
  { step: "02", title: "Register", body: "Reserve your spot in a couple of taps, no paperwork." },
  { step: "03", title: "Check in & go", body: "Scan the QR at the venue and you're marked present." },
];

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || !user) return;
    const destination =
      user.role === "super_admin" ? "/super-admin" :
      user.role === "event_head" ? "/team-head" :
      user.role === "admin" ? "/admin" :
      "/student/events";
    router.push(destination);
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">CampusEvents</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Log in
            </Link>
            <Link
              href="/register"
              className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-20 pb-16 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
          Built after one too many events found out about too late
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.1] max-w-3xl mx-auto">
          Never miss what&apos;s<br />happening on campus.
        </h1>
        <p className="text-lg text-gray-500 max-w-xl mx-auto mt-5">
          You shouldn&apos;t have to scroll five WhatsApp groups to find out what you already missed.
          One tap to see what&apos;s on, one tap to be there.
        </p>
        <div className="flex items-center justify-center gap-3 mt-8">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-indigo-700 transition-colors"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 font-semibold px-6 py-3 rounded-xl hover:border-gray-300 hover:bg-gray-50 transition-colors"
          >
            Log in
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-16">
          {STATS.map((stat) => (
            <div key={stat.label}>
              <div className="text-2xl sm:text-3xl font-bold text-gray-900">{stat.number}</div>
              <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">What changes for you</h2>
            <p className="text-gray-500 mt-3">Less scrolling, less guessing, less chasing people down. That&apos;s the whole point.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-indigo-100 hover:shadow-sm transition-all">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center max-w-xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
        </div>
        <div className="grid sm:grid-cols-3 gap-8">
          {STEPS.map(({ step, title, body }) => (
            <div key={step} className="text-center sm:text-left">
              <div className="text-sm font-bold text-indigo-600 mb-2">{step}</div>
              <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA banner */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl px-8 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">There&apos;s already something filling up.</h2>
          <p className="text-indigo-200 mt-3 max-w-md mx-auto">
            Create your account with your college email — it takes less time than reading one more forwarded message.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-6 py-3 rounded-xl hover:bg-indigo-50 transition-colors mt-7"
          >
            Create your account <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <GraduationCap className="w-4 h-4" />
            CampusEvents
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy-policy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
