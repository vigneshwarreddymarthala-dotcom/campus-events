"use client";

import { use, useState } from "react";
import Link from "next/link";
import { MOCK_EVENTS, MOCK_REGISTRANTS } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft, Search, Download, CheckCircle2, XCircle, QrCode, Users } from "lucide-react";

export default function RegistrantsPage({ params }: PageProps<"/admin/events/[id]/registrants">) {
  const { id } = use(params);
  const event = MOCK_EVENTS.find((e) => e.id === id);
  const registrants = MOCK_REGISTRANTS.filter((r) => r.eventId === id);
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>(
    Object.fromEntries(registrants.map((r) => [r.id, r.attended]))
  );

  if (!event) {
    return <div className="text-center py-20 text-gray-500">Event not found.</div>;
  }

  const filtered = registrants.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.email.toLowerCase().includes(search.toLowerCase()) ||
      r.department.toLowerCase().includes(search.toLowerCase())
  );

  const attendedCount = Object.values(attendance).filter(Boolean).length;

  const exportCSV = () => {
    const headers = ["Name", "Email", "Phone", "Year", "Department", "Registered At", "Attended"];
    const rows = registrants.map((r) => [
      r.name, r.email, r.phone, r.year, r.department,
      format(new Date(r.registeredAt), "yyyy-MM-dd HH:mm"),
      attendance[r.id] ? "Yes" : "No",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "_")}_registrants.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/events/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Event
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Registrants</h1>
            <p className="text-gray-500 text-sm mt-1 truncate max-w-[200px] sm:max-w-none">{event.title}</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="outline" className="gap-2 text-sm px-2 sm:px-4">
              <QrCode className="w-4 h-4" />
              <span className="hidden sm:inline">QR Check-in</span>
            </Button>
            <Button variant="outline" className="gap-2 text-sm px-2 sm:px-4" onClick={exportCSV}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total Registered", value: registrants.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Attended", value: attendedCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
          { label: "No-show", value: registrants.length - attendedCount, icon: XCircle, color: "text-gray-500", bg: "bg-gray-100" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search registrants..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["#", "Name", "Email", "Phone", "Year", "Dept.", "Registered", "Attended"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">No registrants found.</td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                        {r.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.email}</td>
                  <td className="px-4 py-3 text-gray-500">{r.phone}</td>
                  <td className="px-4 py-3 text-gray-500">{r.year}</td>
                  <td className="px-4 py-3 text-gray-500">{r.department}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {format(new Date(r.registeredAt), "MMM d, HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setAttendance((prev) => ({ ...prev, [r.id]: !prev[r.id] }))}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                        attendance[r.id]
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {attendance[r.id] ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Present</>
                      ) : (
                        <><XCircle className="w-3.5 h-3.5" /> Mark</>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {registrants.length === 0 && (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No registrations yet for this event.</p>
          </div>
        )}
      </div>
    </div>
  );
}
