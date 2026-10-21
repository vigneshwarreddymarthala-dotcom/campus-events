"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getEvents, type DbEvent } from "@/lib/db";
import { EventImage } from "@/components/shared/EventImage";
import { Input } from "@/components/ui/input";
import {
  GraduationCap, Calendar, QrCode, Bell, Bookmark, ArrowRight,
  Clock, MapPin, Flame, Eye, EyeOff, AlertCircle, UserPlus, CalendarCheck, ClipboardList,
} from "lucide-react";

const FEATURES = [
  { icon: Calendar, title: "Every event, one place", body: "Workshops, trips, fests and hackathons in one feed. Not five chats." },
  { icon: Bookmark, title: "Grab your spot in a tap", body: "Your details are saved. Claiming a seat takes seconds, not another form." },
  { icon: Bell, title: "Never the last to know", body: "A nudge before it starts, and an instant heads-up if the time or venue changes." },
  { icon: QrCode, title: "Walk in, you're checked in", body: "Scan at the door. No queues, no sign-in sheets." },
];

const STEPS = [
  {
    icon: UserPlus,
    title: "Create your account",
    body: "Sign up free with your email in about 30 seconds. Add your study program once, and it's saved for every event.",
    tag: "Takes 30 seconds",
  },
  {
    icon: CalendarCheck,
    title: "Register for an event",
    body: "Browse what's coming up, open an event and tap Register. Bookmark ones you're still deciding on and we'll keep them handy.",
    tag: "One tap to grab your spot",
  },
  {
    icon: QrCode,
    title: "Attend and check in",
    body: "At the venue, scan the event's QR code with your phone and confirm. You're marked present. No sign-in sheets, no queue.",
    tag: "Scan the QR at the door",
  },
  {
    icon: ClipboardList,
    title: "Share your feedback",
    body: "After the event, open it in your account and fill in the short feedback survey. It helps organizers make the next one better.",
    tag: "Takes a minute",
  },
];

function startOf(e: DbEvent): Date {
  const m = (e.time ?? "").match(/^(\d{1,2}):(\d{2})/);
  const t = m ? `${m[1].padStart(2, "0")}:${m[2]}` : "00:00";
  return new Date(`${e.date}T${t}:00`);
}

function endOf(e: DbEvent): Date {
  const d = new Date(`${e.end_date || e.date}T23:59:59`);
  return isNaN(d.getTime()) ? startOf(e) : d;
}

function countdown(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

function relative(ms: number) {
  const { d, h, m } = countdown(ms);
  if (d >= 1) return `in ${d} day${d === 1 ? "" : "s"}`;
  if (h >= 1) return `in ${h} hour${h === 1 ? "" : "s"}`;
  return `in ${Math.max(m, 1)} min`;
}

function LoginCard() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);
    if (!res.success) setError(res.error ?? "Login failed.");
  };

  return (
    <div className="w-full max-w-sm mx-auto lg:mx-0 lg:ml-auto bg-white rounded-2xl shadow-xl shadow-indigo-100/70 border border-gray-100 p-5">
      <form onSubmit={submit} className="space-y-3">
        <Input type="email" placeholder="Email address" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="h-12" />
        <div className="relative">
          <Input type={show ? "text" : "password"} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="h-12 pr-11" />
          <button type="button" onClick={() => setShow(!show)} className="absolute right-1 top-1/2 -translate-y-1/2 p-3 text-gray-400 hover:text-gray-600" aria-label={show ? "Hide password" : "Show password"}>
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> {error}
          </div>
        )}
        <button type="submit" disabled={loading} className="w-full h-12 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition-colors">
          {loading ? "Logging in…" : "Log in"}
        </button>
        <div className="text-center">
          <Link href="/forgot-password" className="inline-block py-2 text-sm text-indigo-600 hover:underline">Forgot password?</Link>
        </div>
      </form>
      <div className="border-t border-gray-100 my-4" />
      <Link href="/register" className="block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-xl transition-colors">
        Create new account
      </Link>
      <p className="text-xs text-gray-400 text-center mt-3">Free. Takes about 30 seconds.</p>
    </div>
  );
}

export default function Home() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<DbEvent[] | null>(null);
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    if (isLoading || !user) return;
    const destination =
      user.role === "super_admin" ? "/super-admin" :
      user.role === "event_head" ? "/team-head" :
      user.role === "admin" ? "/admin" :
      "/student/events";
    router.push(destination);
  }, [user, isLoading, router]);

  useEffect(() => {
    getEvents().then(setEvents).catch(() => setEvents([]));
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const upcoming = useMemo(() => {
    const t = now;
    return (events ?? [])
      .filter((e) => e.status !== "cancelled" && endOf(e).getTime() >= t)
      .filter((e) => !e.publish_at || new Date(e.publish_at).getTime() <= t)
      .sort((a, b) => startOf(a).getTime() - startOf(b).getTime());
  }, [events, now]);

  const next = upcoming[0];
  const nextStart = next ? startOf(next).getTime() : 0;
  const started = next ? nextStart <= now : false;
  const cd = countdown(nextStart - now);

  if (isLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-20 sm:pb-0">
      {/* Nav */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-gray-900">Spirits</span>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-3">Jobs</Link>
            <Link href="/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors py-3">Log in</Link>
            <Link href="/register" className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Join free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero: pitch + login card (like Instagram / Facebook) */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 sm:pt-20 pb-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-600 text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <Flame className="w-3.5 h-3.5" />
              {upcoming.length > 0
                ? `${upcoming.length} event${upcoming.length === 1 ? "" : "s"} coming up on campus`
                : "New events are dropping soon. Be first to know."}
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight leading-[1.08]">
              You found out<br />after it ended.<br />
              <span className="text-indigo-600">Again.</span>
            </h1>
            <p className="text-lg text-gray-500 max-w-xl mx-auto lg:mx-0 mt-5">
              Great events get posted once and buried in a week. See what&apos;s on, grab your spot,
              and be the one who was there.
            </p>
          </div>
          <LoginCard />
        </div>

        {/* Next event, live */}
        {next && (
          <Link href="/register" className="block group mt-12 max-w-3xl mx-auto">
            <div className="rounded-3xl border border-gray-100 bg-white shadow-xl shadow-indigo-100/60 overflow-hidden flex flex-col sm:flex-row transition-transform group-hover:-translate-y-1">
              <div className="relative sm:w-64 h-44 sm:h-auto bg-gray-100 shrink-0">
                <EventImage src={next.banner_image} alt={next.title} className="w-full h-full object-cover" />
                <span className="absolute top-3 left-3 bg-rose-600 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> {started ? "HAPPENING NOW" : "NEXT UP"}
                </span>
              </div>
              <div className="p-5 flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 leading-snug line-clamp-2">{next.title}</h3>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-2">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />
                    {startOf(next).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                  {next.venue && <span className="flex items-center gap-1.5 min-w-0"><MapPin className="w-4 h-4 shrink-0" /><span className="truncate">{next.venue}</span></span>}
                  <span className="font-semibold text-green-600">{next.registration_fee === 0 ? "Free" : `€${next.registration_fee}`}</span>
                </div>
                {!started && (
                  <div className="grid grid-cols-4 gap-2 mt-4 max-w-xs">
                    {[["d", "days"], ["h", "hrs"], ["m", "min"], ["s", "sec"]].map(([k, label]) => (
                      <div key={k} className="bg-gray-50 rounded-xl py-2 text-center">
                        <div className="text-xl font-bold text-gray-900 tabular-nums">{String(cd[k as "d" | "h" | "m" | "s"]).padStart(2, "0")}</div>
                        <div className="text-[10px] uppercase tracking-wide text-gray-400">{label}</div>
                      </div>
                    ))}
                  </div>
                )}
                <span className="inline-flex items-center gap-1.5 text-indigo-600 font-semibold text-sm mt-4">Sign up to save your spot <ArrowRight className="w-4 h-4" /></span>
              </div>
            </div>
          </Link>
        )}
      </section>

      {/* Upcoming list */}
      {upcoming.length > 0 && (
        <section id="coming-up" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <div className="flex items-end justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">Coming up</h2>
              <p className="text-gray-500 mt-1">Sign up to grab a spot before it&apos;s gone.</p>
            </div>
            <Link href="/register" className="hidden sm:inline-flex items-center gap-1.5 text-indigo-600 font-semibold text-sm hover:text-indigo-800">
              See everything <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcoming.slice(0, 6).map((e) => (
              <Link key={e.id} href="/register" className="group rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-indigo-100 transition-all">
                <div className="h-40 bg-gray-100 overflow-hidden">
                  <EventImage src={e.banner_image} alt={e.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-rose-600">{startOf(e).getTime() <= now ? "Happening now" : relative(startOf(e).getTime() - now)}</span>
                    <span className="text-green-600">{e.registration_fee === 0 ? "Free" : `€${e.registration_fee}`}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mt-1.5 line-clamp-2">{e.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 truncate">{e.venue}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Features */}
      <section id="features" className="scroll-mt-20 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center">Never miss out again</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
            {FEATURES.map(({ icon: Icon, title, body }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 p-6">
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
      <section id="how-it-works" className="scroll-mt-20 max-w-6xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center max-w-xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">How it works</h2>
          <p className="text-gray-500 mt-3">From sign-up to feedback, here&apos;s how you use Spirits.</p>
        </div>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
          {STEPS.map(({ icon: Icon, title, body, tag }, i) => (
            <li key={title} className="relative bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
                <span className="text-3xl font-bold text-gray-100">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1.5">{title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{body}</p>
              <span className="inline-block mt-4 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">{tag}</span>
              {i < STEPS.length - 1 && (
                <ArrowRight className="hidden lg:block absolute -right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 z-10" />
              )}
            </li>
          ))}
        </ol>
        <div className="text-center mt-10">
          <Link href="/register" className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-700 transition-colors">
            Start with step 1 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl px-6 sm:px-8 py-14 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white">
            {next && !started
              ? `${next.title.length > 60 ? "The next event" : next.title} starts ${relative(nextStart - now)}.`
              : "The next one is coming. Be ready this time."}
          </h2>
          <p className="text-indigo-200 mt-3 max-w-md mx-auto">
            Join in 30 seconds. Next time, you&apos;re the one who knew.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-indigo-700 font-semibold px-7 py-3.5 rounded-xl hover:bg-indigo-50 transition-colors mt-7">
            Join free <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <GraduationCap className="w-4 h-4" /> Spirits
          </div>
          <div className="flex items-center gap-6 text-sm text-gray-400">
            <Link href="/privacy-policy" className="hover:text-gray-600 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-600 transition-colors">Terms &amp; Conditions</Link>
          </div>
        </div>
      </footer>

      {/* Sticky mobile CTA */}
      {next && (
        <div className="sm:hidden fixed bottom-0 inset-x-0 z-30 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-rose-600">{started ? "Happening now" : `Next event ${relative(nextStart - now)}`}</p>
            <p className="text-sm font-medium text-gray-900 truncate">{next.title}</p>
          </div>
          <Link href="/register" className="shrink-0 bg-indigo-600 text-white text-sm font-semibold px-4 py-2.5 rounded-lg">Join free</Link>
        </div>
      )}
    </div>
  );
}
