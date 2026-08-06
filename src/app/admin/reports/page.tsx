"use client";

import { useState, useEffect } from "react";
import { getAdaptedEvents, getEventRegistrations, getEventSurveys } from "@/lib/db";
import { isEventPast, type Event, CATEGORIES } from "@/lib/mock-data";
import { format } from "date-fns";
import { BarChart2, Users, Star, CalendarDays, Printer, TrendingUp } from "lucide-react";

type EventRow = {
  event: Event;
  regs: number;
  attended: number;
  rate: number;
  avgRating: number | null;
};

export default function ReportsPage() {
  const [rows, setRows] = useState<EventRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAdaptedEvents().then(async (events) => {
      const built = await Promise.all(events.map(async (ev) => {
        const regs = await getEventRegistrations(ev.id).catch(() => []);
        const attended = regs.filter((r) => r.attended).length;
        const surveys = isEventPast(ev) ? await getEventSurveys(ev.id).catch(() => []) : [];
        const avgRating = surveys.length > 0
          ? +(surveys.reduce((s, x) => s + x.rating, 0) / surveys.length).toFixed(1)
          : null;
        return {
          event: ev,
          regs: regs.length,
          attended,
          rate: regs.length > 0 ? Math.round((attended / regs.length) * 100) : 0,
          avgRating,
        };
      }));
      built.sort((a, b) => new Date(a.event.date).getTime() - new Date(b.event.date).getTime());
      setRows(built);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const totalEvents = rows.length;
  const totalRegs = rows.reduce((s, r) => s + r.regs, 0);
  const totalAttended = rows.reduce((s, r) => s + r.attended, 0);
  const overallRate = totalRegs > 0 ? Math.round((totalAttended / totalRegs) * 100) : 0;
  const allRatings = rows.flatMap((r) => (r.avgRating !== null ? [r.avgRating] : []));
  const avgRating = allRatings.length > 0
    ? +(allRatings.reduce((a, b) => a + b, 0) / allRatings.length).toFixed(1)
    : null;

  const catMap: Record<string, { count: number; regs: number; attended: number }> = {};
  rows.forEach((r) => {
    const cat = r.event.category;
    if (!catMap[cat]) catMap[cat] = { count: 0, regs: 0, attended: 0 };
    catMap[cat].count++;
    catMap[cat].regs += r.regs;
    catMap[cat].attended += r.attended;
  });

  if (loading) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Semester Report</h1>
          <p className="text-gray-500 text-sm mt-1">Full summary of all events and engagement</p>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Printer className="w-4 h-4" />
          Print / Export PDF
        </button>
      </div>

      {/* Print header */}
      <div className="hidden print:block text-center border-b pb-6 mb-6">
        <h1 className="text-3xl font-bold">CampusEvents — Semester Report</h1>
        <p className="text-gray-500 mt-1">Generated on {format(new Date(), "MMMM d, yyyy")}</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Events", value: totalEvents, icon: CalendarDays, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Registrations", value: totalRegs, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Attendance Rate", value: `${overallRate}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
          { label: "Avg Survey Rating", value: avgRating !== null ? `${avgRating}/5` : "—", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center gap-3 shadow-sm print:shadow-none print:border-gray-300">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0 print:hidden`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Category breakdown */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 print:shadow-none print:border-gray-300">
        <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart2 className="w-4 h-4 text-indigo-500 print:hidden" /> Events by Category
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {Object.entries(catMap).sort((a, b) => b[1].count - a[1].count).map(([cat, data]) => {
            const label = CATEGORIES.find((c) => c.value === cat)?.label ?? cat;
            return (
              <div key={cat} className="border border-gray-100 rounded-xl p-3 print:border-gray-300">
                <p className="text-sm font-semibold text-gray-900 capitalize">{label}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {data.count} events · {data.regs} registered · {data.attended} attended
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Full event table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden print:shadow-none print:border-gray-300">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">All Events</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead className="bg-gray-50 border-b border-gray-100 print:bg-gray-100">
              <tr>
                {["Event", "Date", "Category", "Registered", "Attended", "Rate", "Avg Rating"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 print:divide-gray-200">
              {rows.map(({ event, regs, attended, rate, avgRating }) => (
                <tr key={event.id} className={isEventPast(event) ? "opacity-70" : ""}>
                  <td className="px-4 py-3 font-medium text-gray-900 max-w-[200px]">
                    <p className="truncate">{event.title}</p>
                    <p className="text-xs text-gray-400 truncate">{event.venue}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {format(new Date(event.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{event.category.replace("-", " ")}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{regs}</td>
                  <td className="px-4 py-3 text-gray-900 font-medium">{attended}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${rate >= 70 ? "text-green-600" : rate >= 40 ? "text-amber-600" : "text-red-500"}`}>
                      {regs > 0 ? `${rate}%` : "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{avgRating !== null ? `${avgRating}/5` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print footer */}
      <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t mt-8">
        CampusEvents · Confidential · {format(new Date(), "yyyy")}
      </div>
    </div>
  );
}
