"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { getAdaptedEvents, getEventRegistrations, type DbRegistration } from "@/lib/db";
import { type Event, isEventPast } from "@/lib/mock-data";
import { CheckCircle2, XCircle, Users, TrendingUp, CalendarDays, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";

type EventSummary = {
  event: Event;
  regs: DbRegistration[];
  attended: number;
  rate: number;
};

export default function AttendancePage() {
  const [summaries, setSummaries] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "past" | "upcoming">("all");

  useEffect(() => {
    getAdaptedEvents().then(async (events) => {
      const results = await Promise.all(
        events.map(async (event) => {
          const regs = await getEventRegistrations(event.id).catch(() => [] as DbRegistration[]);
          const attended = regs.filter((r) => r.attended).length;
          return {
            event,
            regs,
            attended,
            rate: regs.length > 0 ? Math.round((attended / regs.length) * 100) : 0,
          };
        })
      );
      // Sort: past events first (most recent), then upcoming
      results.sort((a, b) => {
        const aPast = isEventPast(a.event);
        const bPast = isEventPast(b.event);
        if (aPast && !bPast) return -1;
        if (!aPast && bPast) return 1;
        return new Date(b.event.date).getTime() - new Date(a.event.date).getTime();
      });
      setSummaries(results);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalRegs = summaries.reduce((s, x) => s + x.regs.length, 0);
  const totalAttended = summaries.reduce((s, x) => s + x.attended, 0);
  const overallRate = totalRegs > 0 ? Math.round((totalAttended / totalRegs) * 100) : 0;
  const pastWithRegs = summaries.filter((s) => isEventPast(s.event) && s.regs.length > 0);

  const filtered = summaries.filter((s) => {
    const matchSearch = s.event.title.toLowerCase().includes(search.toLowerCase());
    const matchFilter =
      filter === "all" ||
      (filter === "past" && isEventPast(s.event)) ||
      (filter === "upcoming" && !isEventPast(s.event));
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Attendance</h1>
        <p className="text-gray-500 text-sm mt-1">Track check-ins across all your events</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Registrations", value: totalRegs, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Attended", value: totalAttended, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "Overall Rate", value: `${overallRate}%`, icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Events Tracked", value: pastWithRegs.length, icon: CalendarDays, color: "text-purple-600", bg: "bg-purple-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 leading-tight">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Overall rate bar */}
      {totalRegs > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">Overall Attendance Rate</p>
            <span className={`text-sm font-bold ${overallRate >= 70 ? "text-green-600" : overallRate >= 40 ? "text-amber-600" : "text-red-500"}`}>
              {overallRate}%
            </span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full">
            <div
              className={`h-full rounded-full transition-all ${overallRate >= 70 ? "bg-green-500" : overallRate >= 40 ? "bg-amber-400" : "bg-red-400"}`}
              style={{ width: `${overallRate}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-2">
            <span>{totalAttended} checked in</span>
            <span>{totalRegs - totalAttended} no-shows</span>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1 bg-white border border-gray-100 rounded-xl p-1 shadow-sm">
          {(["all", "past", "upcoming"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-sm font-medium transition-colors capitalize ${
                filter === f ? "bg-indigo-600 text-white" : "text-gray-500 hover:bg-gray-100"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Event list */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 bg-white rounded-2xl border border-gray-100">No events found.</div>
        ) : (
          filtered.map(({ event, regs, attended, rate }) => {
            const isPast = isEventPast(event);
            const noShows = regs.length - attended;
            return (
              <Link key={event.id} href={`/admin/events/${event.id}/registrants`}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 hover:shadow-md transition-all group p-4">
                  <div className="flex items-center gap-4">
                    <img src={event.bannerImage} alt={event.title} className="w-12 h-12 rounded-xl object-cover shrink-0" />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-semibold text-gray-900 text-sm truncate group-hover:text-indigo-700 transition-colors">
                          {event.title}
                        </h3>
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${isPast ? "bg-gray-100 text-gray-500" : "bg-indigo-50 text-indigo-600"}`}>
                          {isPast ? "Past" : "Upcoming"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {format(parseISO(event.date), "MMM d, yyyy")} · {event.venue}
                      </p>

                      {/* Attendance bar */}
                      {regs.length > 0 ? (
                        <>
                          <div className="h-1.5 bg-gray-100 rounded-full mb-1.5">
                            <div
                              className={`h-full rounded-full ${rate >= 70 ? "bg-green-500" : rate >= 40 ? "bg-amber-400" : "bg-red-400"}`}
                              style={{ width: `${rate}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span className="flex items-center gap-1 text-green-600 font-medium">
                              <CheckCircle2 className="w-3 h-3" /> {attended} attended
                            </span>
                            {noShows > 0 && (
                              <span className="flex items-center gap-1 text-gray-400">
                                <XCircle className="w-3 h-3" /> {noShows} no-show
                              </span>
                            )}
                            <span className="ml-auto font-semibold text-gray-700">{rate}%</span>
                          </div>
                        </>
                      ) : (
                        <p className="text-xs text-gray-400 italic">No registrations yet</p>
                      )}
                    </div>

                    <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
