"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAllStudents, getStudentRegistrationsWithEvents, type DbProfile } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Search, Users, GraduationCap, CheckCircle, ChevronRight } from "lucide-react";

type StudentWithStats = DbProfile & {
  totalRegistered: number;
  totalAttended: number;
};

export default function AdminStudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const profiles = await getAllStudents().catch(() => [] as DbProfile[]);
      const withStats = await Promise.all(
        profiles.map(async (p) => {
          const regs = await getStudentRegistrationsWithEvents(p.id).catch(() => []);
          return {
            ...p,
            totalRegistered: regs.length,
            totalAttended: regs.filter((r) => r.attended).length,
          };
        })
      );
      setStudents(withStats);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.department ?? "").toLowerCase().includes(q)
    );
  });

  const totalAttended = students.reduce((acc, s) => acc + s.totalAttended, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Students</h1>
          <p className="text-gray-500 text-sm mt-1">{students.length} registered students</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Total Students", value: students.length, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Total Registrations", value: students.reduce((a, s) => a + s.totalRegistered, 0), icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Attendances", value: totalAttended, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
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
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, email or department…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Student list */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex justify-center">
            <div className="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            {search ? "No students match your search." : "No students registered yet."}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-[1fr_1fr_auto_auto_auto] gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <span>Name / Email</span>
              <span>Department</span>
              <span className="text-center">Registered</span>
              <span className="text-center">Attended</span>
              <span />
            </div>

            {filtered.map((s) => (
              <button
                key={s.id}
                onClick={() => router.push(`/admin/students/${s.id}`)}
                className="w-full text-left px-5 py-4 hover:bg-indigo-50 transition-colors flex sm:grid sm:grid-cols-[1fr_1fr_auto_auto_auto] items-center gap-4"
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-indigo-700">
                      {s.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{s.name}</p>
                    <p className="text-xs text-gray-400 truncate">{s.email}</p>
                  </div>
                </div>

                {/* Department */}
                <div className="hidden sm:block min-w-0">
                  <p className="text-sm text-gray-600 truncate">{s.department || "—"}</p>
                  <p className="text-xs text-gray-400">{s.year || ""}</p>
                </div>

                {/* Stats */}
                <div className="hidden sm:flex flex-col items-center">
                  <span className="text-sm font-semibold text-gray-900">{s.totalRegistered}</span>
                  <span className="text-xs text-gray-400">events</span>
                </div>
                <div className="hidden sm:flex flex-col items-center">
                  <span className="text-sm font-semibold text-green-600">{s.totalAttended}</span>
                  <span className="text-xs text-gray-400">attended</span>
                </div>

                {/* Mobile stats */}
                <div className="sm:hidden flex items-center gap-3 shrink-0 text-xs text-gray-500">
                  <span>{s.totalRegistered} reg</span>
                  <span className="text-green-600">{s.totalAttended} att</span>
                </div>

                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
