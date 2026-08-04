"use client";

import Link from "next/link";
import { MOCK_EVENTS, MOCK_REGISTRANTS, isEventPast } from "@/lib/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";
import { CalendarDays, Users, Eye, TrendingUp, Plus, ArrowRight, Clock } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();

  const totalViews = MOCK_EVENTS.reduce((s, e) => s + e.views, 0);
  const totalRegs = MOCK_EVENTS.reduce((s, e) => s + e.registrations, 0);
  const upcomingCount = MOCK_EVENTS.filter((e) => !isEventPast(e)).length;
  const avgFill = Math.round(
    (MOCK_EVENTS.reduce((s, e) => s + e.registrations / e.capacity, 0) / MOCK_EVENTS.length) * 100
  );

  const recentRegistrants = [...MOCK_REGISTRANTS]
    .sort((a, b) => new Date(b.registeredAt).getTime() - new Date(a.registeredAt).getTime())
    .slice(0, 5);

  const upcomingEvents = MOCK_EVENTS.filter((e) => !isEventPast(e))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 4);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Good morning, {user?.name.split(" ")[0]} 👋
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

      {/* Stats — 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Total Views", value: totalViews.toLocaleString(), icon: Eye, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Registrations", value: totalRegs.toLocaleString(), icon: Users, color: "text-green-600", bg: "bg-green-50" },
          { label: "Upcoming", value: upcomingCount, icon: CalendarDays, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Avg Fill Rate", value: `${avgFill}%`, icon: TrendingUp, color: "text-orange-600", bg: "bg-orange-50" },
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

      {/* Upcoming events + Recent registrations — stacks on mobile */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900">Upcoming Events</h2>
            <Link href="/admin/events" className="text-sm text-indigo-600 hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event) => {
              const fillPct = Math.round((event.registrations / event.capacity) * 100);
              return (
                <Link key={event.id} href={`/admin/events/${event.id}`}>
                  <Card className="p-3 sm:p-4 hover:shadow-sm hover:border-indigo-200 transition-all">
                    <div className="flex items-center gap-3">
                      <img
                        src={event.bannerImage}
                        alt={event.title}
                        className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate text-sm sm:text-base">{event.title}</p>
                        <p className="text-xs sm:text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
                          {format(new Date(event.date), "MMM d, yyyy")} · {event.time}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="h-1.5 flex-1 bg-gray-100 rounded-full">
                            <div
                              className={`h-full rounded-full ${fillPct >= 90 ? "bg-red-400" : fillPct >= 70 ? "bg-yellow-400" : "bg-indigo-400"}`}
                              style={{ width: `${Math.min(fillPct, 100)}%` }}
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
        </div>

        {/* Recent registrations */}
        <div className="space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900">Recent Registrations</h2>
          <Card className="divide-y divide-gray-100">
            {recentRegistrants.map((r) => {
              const event = MOCK_EVENTS.find((e) => e.id === r.eventId);
              return (
                <div key={r.id} className="p-3 sm:p-3.5 flex items-start gap-3">
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                    {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.name}</p>
                    <p className="text-xs text-gray-400 truncate">{event?.title}</p>
                    <p className="text-xs text-gray-400">{r.year} · {r.department}</p>
                  </div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      {/* Performance table — scrollable on mobile */}
      <div>
        <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Event Performance</h2>
        <Card className="overflow-hidden">
          <div className="overflow-x-auto -mx-0">
            <table className="w-full text-sm min-w-[540px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  {["Event", "Date", "Registrations", "Fill", "Views", "Fee"].map((h) => (
                    <th key={h} className="text-left px-3 sm:px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {MOCK_EVENTS.map((event) => (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-3 sm:px-4 py-3 font-medium text-gray-900 max-w-[160px] truncate">{event.title}</td>
                    <td className="px-3 sm:px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(event.date), "MMM d")}</td>
                    <td className="px-3 sm:px-4 py-3">
                      <span className="font-medium">{event.registrations}</span>
                      <span className="text-gray-400">/{event.capacity}</span>
                    </td>
                    <td className="px-3 sm:px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 bg-gray-100 rounded-full">
                          <div
                            className="h-full bg-indigo-400 rounded-full"
                            style={{ width: `${Math.round((event.registrations / event.capacity) * 100)}%` }}
                          />
                        </div>
                        <span className="text-gray-500 text-xs">{Math.round((event.registrations / event.capacity) * 100)}%</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 text-gray-500">{event.views.toLocaleString()}</td>
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
