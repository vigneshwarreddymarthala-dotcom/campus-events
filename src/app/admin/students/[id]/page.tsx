"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getStudentProfile, getStudentRegistrationsWithEvents, type DbProfile, type StudentRegistrationWithEvent } from "@/lib/db";
import { format, parseISO } from "date-fns";
import {
  ArrowLeft, Mail, Phone, BookOpen, GraduationCap,
  Calendar, CheckCircle, Clock, Printer, User, Bell, Award,
} from "lucide-react";
import NotificationModal from "@/components/shared/NotificationModal";
function calcHours(time: string, endTime: string | null): number {
  if (!endTime) return 2;
  const [sh, sm] = time.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  return diff > 0 ? Math.round(diff / 60 * 10) / 10 : 2;
}

export default function StudentReportPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [student, setStudent] = useState<DbProfile | null>(null);
  const [regs, setRegs] = useState<StudentRegistrationWithEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [showCert, setShowCert] = useState(false);

  useEffect(() => {
    params.then(({ id }) => {
      Promise.all([
        getStudentProfile(id),
        getStudentRegistrationsWithEvents(id),
      ]).then(([profile, registrations]) => {
        setStudent(profile);
        setRegs(registrations);
        setLoading(false);
      }).catch(() => setLoading(false));
    });
  }, [params]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-20 text-gray-400">
        <p>Student not found.</p>
        <button onClick={() => router.back()} className="mt-4 text-indigo-600 text-sm hover:underline">Go back</button>
      </div>
    );
  }

  const attended = regs.filter((r) => r.attended);
  const totalHours = attended.reduce((acc, r) => acc + calcHours(r.event_time, r.event_end_time), 0);

  const initials = student.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back + actions */}
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => router.push("/admin/students")}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Students
        </button>
        <div className="flex gap-2">
          <button
            onClick={() => setNotifyOpen(true)}
            className="flex items-center gap-2 border border-orange-200 text-orange-600 hover:bg-orange-50 px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Bell className="w-4 h-4" /> Notify
          </button>
          <button
            onClick={() => setShowCert(true)}
            className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-yellow-600 transition-colors"
          >
            <Award className="w-4 h-4" /> Certificate
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <Printer className="w-4 h-4" /> Print Report
          </button>
        </div>
      </div>

      {/* Print header (only visible when printing) */}
      <div className="hidden print:block text-center mb-6 border-b pb-4">
        <h1 className="text-xl font-bold">CampusEvents — Student Report</h1>
        <p className="text-sm text-gray-500">Generated {format(new Date(), "dd MMM yyyy, h:mm a")}</p>
      </div>

      {/* Student card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-indigo-700">{initials}</span>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{student.name}</h2>
            <p className="text-sm text-gray-500">{student.email}</p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <InfoPill icon={<Mail className="w-3.5 h-3.5" />} label={student.email} />
              {student.phone && <InfoPill icon={<Phone className="w-3.5 h-3.5" />} label={student.phone} />}
              {student.department && <InfoPill icon={<BookOpen className="w-3.5 h-3.5" />} label={student.department} />}
              {student.year && <InfoPill icon={<GraduationCap className="w-3.5 h-3.5" />} label={student.year} />}
            </div>
          </div>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Events Registered", value: regs.length, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Events Attended", value: attended.length, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Hours", value: `${totalHours}h`, icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 text-center">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Events table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Event History</h3>
        </div>
        {regs.length === 0 ? (
          <div className="py-12 text-center text-gray-400">No event registrations.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                <tr>
                  <th className="text-left px-5 py-3">Event</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Date</th>
                  <th className="text-left px-4 py-3 hidden sm:table-cell">Venue</th>
                  <th className="text-center px-4 py-3">Attended</th>
                  <th className="text-center px-4 py-3 hidden sm:table-cell">Hours</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {regs.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-gray-900">{r.event_title || "—"}</p>
                      <p className="text-xs text-gray-400 sm:hidden">
                        {r.event_date ? format(parseISO(r.event_date), "dd MMM yyyy") : "—"}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600">
                      {r.event_date ? format(parseISO(r.event_date), "dd MMM yyyy") : "—"}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-gray-600 max-w-[160px] truncate">
                      {r.event_venue || "—"}
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      {r.attended ? (
                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
                          <CheckCircle className="w-3 h-3" /> Yes
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-500 text-xs font-semibold px-2 py-0.5 rounded-full">
                          <User className="w-3 h-3" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell text-center text-gray-600">
                      {r.attended ? `${calcHours(r.event_time, r.event_end_time)}h` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Print footer */}
      <div className="hidden print:block text-center text-xs text-gray-400 pt-4 border-t">
        CampusEvents Platform · Confidential
      </div>

      {/* Certificate modal */}
      {showCert && student && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 overflow-y-auto py-8">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden">
            {/* Certificate content */}
            <div id="certificate" className="p-12 text-center border-8 border-double border-yellow-400 m-4 rounded-2xl">
              <div className="mb-4 flex justify-center">
                <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center">
                  <Award className="w-7 h-7 text-white" />
                </div>
              </div>
              <p className="text-xs tracking-[0.3em] text-gray-400 uppercase font-semibold mb-2">CampusEvents</p>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">Certificate of Participation</h1>
              <p className="text-gray-500 text-sm mb-6">This is to certify that</p>
              <p className="text-4xl font-bold text-indigo-700 mb-2">{student.name}</p>
              {student.department && <p className="text-gray-500 text-sm mb-6">{student.department} · {student.year}</p>}
              <p className="text-gray-600 mb-6">
                has successfully participated in <strong>{attended.length} event{attended.length !== 1 ? "s" : ""}</strong>{" "}
                and completed a total of <strong>{totalHours} hours</strong> of campus engagement.
              </p>

              {attended.length > 0 && (
                <div className="text-left bg-gray-50 rounded-xl p-4 mb-6 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Events Participated</p>
                  {attended.map((r) => (
                    <div key={r.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-800 font-medium">{r.event_title}</span>
                      <span className="text-gray-400">{r.event_date ? format(parseISO(r.event_date), "dd MMM yyyy") : "—"} · {calcHours(r.event_time, r.event_end_time)}h</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
                <div className="text-left">
                  <div className="w-32 h-0.5 bg-gray-400 mb-1" />
                  <p className="text-xs text-gray-500">Organizer Signature</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400">{format(new Date(), "MMMM d, yyyy")}</p>
                  <p className="text-xs text-gray-400">Date Issued</p>
                </div>
                <div className="text-right">
                  <div className="w-32 h-0.5 bg-gray-400 mb-1 ml-auto" />
                  <p className="text-xs text-gray-500">CampusEvents</p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 px-6 pb-6">
              <button
                onClick={() => setShowCert(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const el = document.getElementById("certificate");
                  if (!el) return;
                  const win = window.open("", "_blank");
                  if (!win) return;
                  win.document.write(`<html><head><title>Certificate - ${student.name}</title><style>body{font-family:sans-serif;margin:0;padding:20px;} *{box-sizing:border-box;}</style></head><body>${el.outerHTML}</body></html>`);
                  win.document.close();
                  win.print();
                }}
                className="flex-1 py-2.5 rounded-xl bg-yellow-500 text-white text-sm font-semibold hover:bg-yellow-600 transition-colors flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" /> Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification modal */}
      {notifyOpen && student && (
        <NotificationModal
          recipients={[{ userId: student.id, name: student.name }]}
          defaultTitle="Message from Campus Events"
          defaultMessage={`Hi ${student.name.split(" ")[0]}, `}
          onClose={() => setNotifyOpen(false)}
        />
      )}
    </div>
  );
}

function InfoPill({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-gray-500 truncate">
      <span className="text-gray-400 shrink-0">{icon}</span>
      <span className="truncate">{label}</span>
    </div>
  );
}
