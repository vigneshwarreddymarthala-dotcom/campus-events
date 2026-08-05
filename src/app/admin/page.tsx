"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isEventPast, type Event } from "@/lib/mock-data";
import { getAdaptedEvents, getEventRegistrations, type DbRegistration } from "@/lib/db";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarDays, Users, TrendingUp, Plus, ArrowRight, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [recentRegs, setRecentRegs] = useState<(DbRegistration & { eventTitle: string })[]>([]);
  const [totalRegs, setTotalRegs] = useState(0);

  useEffect(() => {
    getAdaptedEvents().then(async (evs) => {
      setEvents(evs);
      const allRegs: (DbRegistration & { eventTitle: string })[] = [];
      await Promise.all(
        evs.map(async (ev) => {
          const regs = await getEventRegistrations(ev.id).catch(() => []);
          regs.forEach((r) => allRegs.push({ ...r, eventTitle: ev.title }));
        })
      );
      allRegs.sort((a, b) => new Date(b.registered_at).getTime() - new Date(a.registered_at).getTime());
      setTotalRegs(allRegs.length);
      setRecentRegs(allRegs.slice(0, 5));
    }).catch(console.error);
  }, []);

  const upcomingCount = events.filter((e) => !isEventPast(e)).length;
  const upcomingEvents = events.filter((e) => !isEventPast(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

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

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total Events", value: events.length, icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Upcoming", value: upcomingCount, icon: TrendingUp, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Registrations", value: totalRegs, icon: Users, color: "text-green-600", bg: "bg-green-50" },
        ].map((stat) => (
          <Card key={stat.label} className="p-3 sm:p-5 flex items-center gap-3">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-tight">{stat.label}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Upcoming events + Recent registrations */}
      <div className="grid lg:grid-cols-3 gap-6">
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
              {upcomingEvents.map((event) => (
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
                              className="h-full rounded-full bg-indigo-400"
                              style={{ width: `${Math.min(Math.round((event.registrations / event.capacity) * 100), 100)}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 shrink-0">{event.registrations}/{event.capacity}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Recent registrations */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Registrations</h2>
          {recentRegs.length === 0 ? (
            <Card className="p-6 text-center text-gray-400 text-sm">No registrations yet.</Card>
          ) : (
            <Card className="divide-y divide-gray-100">
              {recentRegs.map((r) => (
                <div key={r.id} className="p-3 sm:p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                    {r.student_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.student_name}</p>
                    <p className="text-xs text-gray-400 truncate">{r.eventTitle}</p>
                    <p className="text-xs text-gray-400">{r.student_year ?? ""} · {r.student_department ?? ""}</p>
                  </div>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Events table */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">All Events</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto -mx-0">
            <table className="w-full text-sm min-w-[540px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Event", "Date", "Capacity", "Fee"].map((h) => (
                    <th key={h} className="text-left px-3 sm:px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {events.length === 0 && (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">Loading events...</td></tr>
                )}
                {events.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{event.title}</td>
                    <td className="px-3 sm:px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(event.date), "MMM d")}</td>
                    <td className="px-3 sm:px-4 py-3 text-gray-500">{event.capacity}</td>
                    <td className="px-3 sm:px-4 py-3">
                      {event.registrationFee === 0 ? (
                        <span className="text-green-600 font-medium">Free</span>
                      ) : (
                        <span>₹{event.registrationFee}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
