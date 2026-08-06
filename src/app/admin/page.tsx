"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isEventPast, type Event, CATEGORIES } from "@/lib/mock-data";
import { getAdaptedEvents, getEventRegistrations, getEventSurveys, type DbRegistration } from "@/lib/db";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format, isToday } from "date-fns";
import {
  CalendarDays, Users, TrendingUp, Plus, ArrowRight,
  Clock, Star, CheckCircle2, BarChart2, Zap,
} from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [recentRegs, setRecentRegs] = useState<(DbRegistration & { eventTitle: string })[]>([]);
  const [totalRegs, setTotalRegs] = useState(0);
  const [totalAttended, setTotalAttended] = useState(0);
  const [avgSurveyRating, setAvgSurveyRating] = useState<number | null>(null);
  const [categoryStats, setCategoryStats] = useState<{ label: string; count: number }[]>([]);
  const [topEvents, setTopEvents] = useState<{ title: string; regs: number; capacity: number }[]>([]);

  useEffect(() => {
    getAdaptedEvents().then(async (evs) => {
      setEvents(evs);

      // Build per-event registration data
      const allRegs: (DbRegistration & { eventTitle: string })[] = [];
      let attended = 0;
      const eventRegCounts: { title: string; regs: number; capacity: number }[] = [];

      await Promise.all(evs.map(async (ev) => {
        const regs = await getEventRegistrations(ev.id).catch(() => []);
        regs.forEach((r) => {
          allRegs.push({ ...r, eventTitle: ev.title });
          if (r.attended) attended++;
        });
        eventRegCounts.push({ title: ev.title, regs: regs.length, capacity: ev.capacity });
      }));

      allRegs.sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());
      setTotalRegs(allRegs.length);
      setTotalAttended(attended);
      setRecentRegs(allRegs.slice(0, 6));
      setTopEvents(eventRegCounts.sort((a, b) => b.regs - a.regs).slice(0, 5));

      // Category breakdown
      const catCounts: Record<string, number> = {};
      evs.forEach((e) => { catCounts[e.category] = (catCounts[e.category] ?? 0) + 1; });
      const catStats = Object.entries(catCounts)
        .map(([val, count]) => ({ label: CATEGORIES.find((c) => c.value === val)?.label ?? val, count }))
        .sort((a, b) => b.count - a.count);
      setCategoryStats(catStats);

      // Survey avg rating across all events
      const pastEvIds = evs.filter((e) => isEventPast(e)).map((e) => e.id);
      const surveyRatings: number[] = [];
      await Promise.all(pastEvIds.map(async (eid) => {
        const surveys = await getEventSurveys(eid).catch(() => []);
        surveys.forEach((s) => surveyRatings.push(s.rating));
      }));
      if (surveyRatings.length > 0) {
        setAvgSurveyRating(+(surveyRatings.reduce((a, b) => a + b, 0) / surveyRatings.length).toFixed(1));
      }
    }).catch(console.error);
  }, []);

  const upcomingCount = events.filter((e) => !isEventPast(e)).length;
  const pastCount = events.filter((e) => isEventPast(e)).length;
  const attendanceRate = totalRegs > 0 ? Math.round((totalAttended / totalRegs) * 100) : 0;
  const upcomingEvents = events.filter((e) => !isEventPast(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);
  const todaysEvents = events.filter((e) => isToday(new Date(e.date)));
  const maxCat = categoryStats[0]?.count || 1;

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, {user?.name.split(" ")[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening across your events.</p>
        </div>
        <Link href="/admin/events/new" className="shrink-0">
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 text-sm px-3 sm:px-4">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Event</span>
          </Button>
        </Link>
      </div>

      {/* Today's Focus */}
      {todaysEvents.length > 0 && (
        <div className="bg-indigo-600 rounded-2xl p-4 sm:p-5 text-white">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-indigo-200" />
            <span className="text-sm font-semibold text-indigo-100">Today&apos;s Focus</span>
            <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full font-medium">{todaysEvents.length} event{todaysEvents.length > 1 ? "s" : ""}</span>
          </div>
          <div className="space-y-2">
            {todaysEvents.map((e) => (
              <Link key={e.id} href={`/admin/events/${e.id}`}>
                <div className="flex items-center gap-3 bg-white/10 hover:bg-white/20 transition-colors rounded-xl p-3">
                  <img src={e.bannerImage} alt={e.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{e.title}</p>
                    <p className="text-xs text-indigo-200">{e.time} · {e.venue}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-indigo-200">{e.registrations}/{e.capacity}</p>
                    <p className="text-xs text-indigo-300">registered</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Total Events", value: events.length, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Upcoming", value: upcomingCount, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Registrations", value: totalRegs, icon: Users, color: "text-green-600", bg: "bg-green-50" },
          { label: "Attendance Rate", value: `${attendanceRate}%`, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Avg Survey Rating", value: avgSurveyRating !== null ? `${avgSurveyRating}/5` : "—", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 sm:p-4 flex items-center gap-3">
            <div className={`w-9 h-9 sm:w-10 sm:h-10 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-lg sm:text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 leading-tight">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Upcoming events */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link href="/admin/events" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          {upcomingEvents.length === 0 ? (
            <Card className="p-8 text-center text-gray-400 text-sm">
              {events.length === 0 ? "Loading..." : "No upcoming events."}
            </Card>
          ) : (
            <div className="space-y-3">
              {upcomingEvents.map((event) => {
                const fillPct = Math.min(Math.round((event.registrations / event.capacity) * 100), 100);
                return (
                  <Link key={event.id} href={`/admin/events/${event.id}`}>
                    <Card className="p-3 sm:p-4 hover:shadow-sm hover:border-indigo-200 transition-all">
                      <div className="flex items-center gap-3">
                        <img src={event.bannerImage} alt={event.title} className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{event.title}</p>
                          <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                            {format(new Date(event.date), "MMM d, yyyy")} · {event.time}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="h-1.5 flex-1 bg-gray-100 rounded-full">
                              <div
                                className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-red-400" : fillPct >= 70 ? "bg-yellow-400" : "bg-indigo-400"}`}
                                style={{ width: `${fillPct}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 shrink-0">{event.registrations}/{event.capacity}</span>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-5">
          {/* Recent registrations */}
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">Recent Registrations</h2>
            {recentRegs.length === 0 ? (
              <Card className="p-6 text-center text-gray-400 text-sm">No registrations yet.</Card>
            ) : (
              <Card className="divide-y divide-gray-100">
                {recentRegs.map((r) => (
                  <div key={r.id} className="p-3 flex items-start gap-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                      {r.student_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{r.student_name}</p>
                      <p className="text-xs text-gray-400 truncate">{r.eventTitle}</p>
                    </div>
                  </div>
                ))}
              </Card>
            )}
          </div>

          {/* Quick stats */}
          <Card className="p-4 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-indigo-500" /> Quick Stats
            </h3>
            {[
              { label: "Past Events", value: pastCount },
              { label: "Total Attended", value: totalAttended },
              { label: "Survey Responses", value: avgSurveyRating !== null ? "See surveys" : "None yet" },
            ].map((s) => (
              <div key={s.label} className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{s.label}</span>
                <span className="font-semibold text-gray-900">{s.value}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>

      {/* Category breakdown + Top events */}
      <div className="grid sm:grid-cols-2 gap-6">
        {/* Category breakdown */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Events by Category</h3>
          {categoryStats.length === 0 ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <div className="space-y-3">
              {categoryStats.map((c) => (
                <div key={c.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600 capitalize">{c.label}</span>
                    <span className="font-semibold text-gray-900">{c.count}</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${Math.round((c.count / maxCat) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Top events by registrations */}
        <Card className="p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Top Events by Registrations</h3>
          {topEvents.length === 0 ? (
            <p className="text-sm text-gray-400">Loading…</p>
          ) : (
            <div className="space-y-3">
              {topEvents.map((e, i) => {
                const pct = e.capacity > 0 ? Math.min(Math.round((e.regs / e.capacity) * 100), 100) : 0;
                return (
                  <div key={e.title} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate max-w-[60%] flex items-center gap-1.5">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${i === 0 ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-500"}`}>
                          {i + 1}
                        </span>
                        {e.title}
                      </span>
                      <span className="font-semibold text-gray-900 shrink-0">{e.regs}/{e.capacity}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${pct >= 90 ? "bg-red-400" : pct >= 70 ? "bg-yellow-400" : "bg-green-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
