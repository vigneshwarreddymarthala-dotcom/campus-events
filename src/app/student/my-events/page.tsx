"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, parseISO, differenceInDays, isToday, isTomorrow } from "date-fns";
import { isEventPast, type Event } from "@/lib/mock-data";
import EventCard from "@/components/shared/EventCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Calendar, Bookmark, History, CalendarCheck, Clock,
  CheckCircle2, MapPin, Star, Award, ChevronRight,
} from "lucide-react";
import {
  getAdaptedEvents, getMyBookmarks, getMyRegistrations,
  getMyRegistrationsWithEvents, addBookmark, removeBookmark,
  type StudentRegistrationWithEvent,
} from "@/lib/db";
import { useAuth } from "@/contexts/auth-context";

const SEMESTER_GOAL_HOURS = 20;

function calcHours(time: string, endTime: string | null): number {
  if (!endTime) return 2;
  const [sh, sm] = time.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? Math.round((diff / 60) * 10) / 10 : 2;
}

function countdownLabel(dateStr: string): { text: string; urgent: boolean } {
  const d = new Date(dateStr);
  if (isToday(d)) return { text: "Today!", urgent: true };
  if (isTomorrow(d)) return { text: "Tomorrow", urgent: true };
  const days = differenceInDays(d, new Date());
  if (days <= 7) return { text: `${days} days away`, urgent: true };
  return { text: format(d, "EEE, MMM d"), urgent: false };
}

export default function MyEventsPage() {
  const { user } = useAuth();
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [regsWithEvents, setRegsWithEvents] = useState<StudentRegistrationWithEvent[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);

  useEffect(() => {
    getAdaptedEvents().then(setAllEvents).catch(console.error);
    getMyBookmarks().then(setBookmarks).catch(console.error);
    getMyRegistrations().then((regs) => setRegisteredIds(regs.map((r) => r.event_id))).catch(console.error);
    getMyRegistrationsWithEvents().then(setRegsWithEvents).catch(console.error);
  }, []);

  const toggleBookmark = async (id: string) => {
    if (bookmarks.includes(id)) {
      setBookmarks((prev) => prev.filter((b) => b !== id));
      await removeBookmark(id).catch(console.error);
    } else {
      setBookmarks((prev) => [...prev, id]);
      await addBookmark(id).catch(console.error);
    }
  };

  const registeredEvents = allEvents.filter((e) => registeredIds.includes(e.id) && !isEventPast(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const bookmarkedEvents = allEvents.filter((e) => bookmarks.includes(e.id));
  const attendedRegs = regsWithEvents.filter((r) => r.attended);
  const totalHours = attendedRegs.reduce((acc, r) => acc + calcHours(r.event_time, r.event_end_time), 0);
  const attendanceRate = regsWithEvents.length > 0
    ? Math.round((attendedRegs.length / regsWithEvents.length) * 100)
    : 0;
  const progressPct = Math.min(Math.round((totalHours / SEMESTER_GOAL_HOURS) * 100), 100);
  const firstName = user?.name?.split(" ")[0] ?? "you";

  return (
    <div className="space-y-6 max-w-4xl">

      {/* Personal score card */}
      <div className="bg-gradient-to-br from-indigo-600 to-indigo-500 rounded-2xl p-5 text-white">
        <p className="text-indigo-200 text-sm mb-1">Your campus journey, {firstName}</p>
        <div className="grid grid-cols-3 gap-4 mt-3">
          <div>
            <p className="text-3xl font-bold">{regsWithEvents.length}</p>
            <p className="text-indigo-200 text-xs mt-0.5">Events Registered</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{attendedRegs.length}</p>
            <p className="text-indigo-200 text-xs mt-0.5">Attended</p>
          </div>
          <div>
            <p className="text-3xl font-bold">{totalHours}h</p>
            <p className="text-indigo-200 text-xs mt-0.5">Hours Earned</p>
          </div>
        </div>

        {/* Hours progress bar */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-indigo-200">Semester goal: {SEMESTER_GOAL_HOURS}h</span>
            <span className="text-xs font-semibold text-white">{totalHours}/{SEMESTER_GOAL_HOURS}h</span>
          </div>
          <div className="h-2 bg-indigo-400/50 rounded-full">
            <div
              className="h-full bg-white rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Attendance rate */}
        {regsWithEvents.length > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-indigo-200" />
            <span className="text-sm text-indigo-100">
              {attendanceRate}% attendance rate
              {attendanceRate >= 80 && " · Great work! 🎉"}
              {attendanceRate >= 60 && attendanceRate < 80 && " · Keep it up!"}
            </span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="upcoming">
        <TabsList className="bg-white border border-gray-100 rounded-2xl p-1 w-full flex shadow-sm">
          {[
            { value: "upcoming", label: "Upcoming", icon: CalendarCheck, count: registeredEvents.length },
            { value: "history", label: "History", icon: History, count: attendedRegs.length },
            { value: "saved", label: "Saved", icon: Bookmark, count: bookmarks.length },
          ].map(({ value, label, icon: Icon, count }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="flex-1 gap-1.5 rounded-xl data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-sm py-2.5 transition-all"
            >
              <Icon className="w-4 h-4" />
              {label}
              {count > 0 && (
                <span className="text-xs opacity-70">({count})</span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Upcoming tab */}
        <TabsContent value="upcoming" className="mt-5">
          {registeredEvents.length === 0 ? (
            <Empty icon={<CalendarCheck className="w-10 h-10 text-gray-300" />} title="Nothing coming up" desc="Register for events to see them here." href="/student/events" cta="Browse Events" />
          ) : (
            <div className="space-y-3">
              {registeredEvents.map((event) => {
                const { text, urgent } = countdownLabel(event.date);
                return (
                  <Link key={event.id} href={`/student/events/${event.id}`}>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-4 hover:border-indigo-200 hover:shadow-sm transition-all group">
                      <img src={event.bannerImage} alt={event.title} className="w-14 h-14 rounded-xl object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">{event.title}</h3>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                          <span className={`flex items-center gap-1 font-medium ${urgent ? "text-orange-500" : "text-gray-500"}`}>
                            <Clock className="w-3 h-3" />{text}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />{event.venue}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs bg-green-50 text-green-600 font-semibold px-2 py-1 rounded-full">✓ Registered</span>
                        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* History tab */}
        <TabsContent value="history" className="mt-5">
          {attendedRegs.length === 0 ? (
            <Empty icon={<History className="w-10 h-10 text-gray-300" />} title="No attended events yet" desc="Events you check in to will appear here with your hours." href="/student/events" cta="Find Events" />
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              {/* Header */}
              <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900 text-sm">Attendance History</h3>
                <span className="text-xs text-gray-400">{totalHours}h total</span>
              </div>

              {attendedRegs.map((r, i) => {
                const hours = calcHours(r.event_time, r.event_end_time);
                return (
                  <Link key={r.id} href={`/student/events/${r.event_id}`}>
                    <div className={`flex items-center gap-4 px-5 py-4 hover:bg-gray-50 transition-colors ${i < attendedRegs.length - 1 ? "border-b border-gray-50" : ""} group`}>
                      <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">{r.event_title}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.event_date ? format(parseISO(r.event_date), "MMMM d, yyyy") : "—"} · {r.event_venue}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-bold text-indigo-600">{hours}h</p>
                          <p className="text-xs text-gray-400">earned</p>
                        </div>
                        <Link
                          href={`/student/events/${r.event_id}/survey`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1 text-xs text-amber-500 hover:text-amber-600 bg-amber-50 hover:bg-amber-100 px-2.5 py-1.5 rounded-xl transition-colors font-medium"
                          title="Rate this event"
                        >
                          <Star className="w-3 h-3" /> Rate
                        </Link>
                        <Award className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 transition-colors" />
                      </div>
                    </div>
                  </Link>
                );
              })}

              {/* Summary footer */}
              <div className="px-5 py-3 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500">{attendedRegs.length} events attended</span>
                <span className="text-xs font-semibold text-indigo-600">{totalHours} / {SEMESTER_GOAL_HOURS}h semester goal</span>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Saved tab */}
        <TabsContent value="saved" className="mt-5">
          {bookmarkedEvents.length === 0 ? (
            <Empty icon={<Bookmark className="w-10 h-10 text-gray-300" />} title="No saved events" desc="Bookmark events to find them here later." href="/student/events" cta="Browse Events" />
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {bookmarkedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  basePath="student"
                  isBookmarked
                  isRegistered={registeredIds.includes(event.id)}
                  onBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Empty({ icon, title, desc, href, cta }: {
  icon: React.ReactNode; title: string; desc: string; href: string; cta: string;
}) {
  return (
    <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
      <div className="flex justify-center mb-3 opacity-60">{icon}</div>
      <h3 className="text-base font-semibold text-gray-700 mb-1">{title}</h3>
      <p className="text-gray-400 text-sm mb-5">{desc}</p>
      <Link href={href} className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 transition-colors">
        {cta}
      </Link>
    </div>
  );
}
