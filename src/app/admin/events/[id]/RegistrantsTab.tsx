"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { type Event, isEventOver } from "@/lib/mock-data";
import { getAdaptedEvent, getEventRegistrations, toggleAttendance, setRegistrationStatus, type DbRegistration } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ArrowLeft, Search, Download, CheckCircle2, XCircle, QrCode, Users, Bell, X, Award, Clock, Ban } from "lucide-react";
import NotificationModal from "@/components/shared/NotificationModal";
import QRCode from "react-qr-code";

type ModalTarget = { recipients: { userId: string; name: string }[]; defaultTitle: string; defaultMessage: string };

export default function RegistrantsTab({ id }: { id: string }) {
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [registrants, setRegistrants] = useState<DbRegistration[]>([]);
  const [search, setSearch] = useState("");
  const [attendance, setAttendance] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<ModalTarget | null>(null);
  const [view, setView] = useState<"registered" | "waiting" | "cancelled">("registered");
  const [moving, setMoving] = useState<string | null>(null);


  const load = () => {
    getAdaptedEvent(id).then(setEvent).catch(() => setEvent(null));
    return getEventRegistrations(id).then((regs) => {
      setRegistrants(regs);
      setAttendance(Object.fromEntries(regs.map((r) => [r.id, r.attended])));
    }).catch(console.error);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (event === undefined) return <div className="text-center py-20 text-gray-400">Loading...</div>;
  if (!event) return <div className="text-center py-20 text-gray-500">Event not found.</div>;

  // Three groups: people with a seat, people waiting (in join order), and people who cancelled (newest first).
  const confirmedList = registrants.filter((r) => r.status === "confirmed");
  const waitingList = registrants.filter((r) => r.status === "waitlist")
    .sort((a, b) => new Date(a.registered_at).getTime() - new Date(b.registered_at).getTime());
  const cancelledList = registrants.filter((r) => r.status === "cancelled")
    .sort((a, b) => new Date(b.cancelled_at ?? 0).getTime() - new Date(a.cancelled_at ?? 0).getTime());

  const matches = (r: DbRegistration) =>
    r.student_name.toLowerCase().includes(search.toLowerCase()) ||
    r.student_email.toLowerCase().includes(search.toLowerCase()) ||
    (r.student_department ?? "").toLowerCase().includes(search.toLowerCase());
  const filtered = confirmedList.filter(matches);
  const filteredWaiting = waitingList.filter(matches);
  const filteredCancelled = cancelledList.filter(matches);

  const attendedCount = confirmedList.filter((r) => attendance[r.id]).length;
  const noShows = confirmedList.filter((r) => !attendance[r.id] && r.user_id);
  const isFull = event.registrations >= event.capacity;
  const over = isEventOver(event); // "no-show" only makes sense once the event has ended

  const moveUp = async (r: DbRegistration) => {
    if (isFull && !window.confirm(`The event is full (${event.registrations}/${event.capacity}). Move ${r.student_name} to registered anyway?`)) return;
    setMoving(r.id);
    try {
      await setRegistrationStatus(r.id, "confirmed");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Could not move this student.");
    }
    setMoving(null);
  };

  const handleToggleAttendance = async (regId: string) => {
    const newVal = !attendance[regId];
    setAttendance((prev) => ({ ...prev, [regId]: newVal }));
    await toggleAttendance(regId, newVal).catch(console.error);
  };

  const openNotifyOne = (r: DbRegistration) => {
    setModal({
      recipients: [{ userId: r.user_id, name: r.student_name }],
      defaultTitle: `You missed: ${event.title}`,
      defaultMessage: `Hi ${r.student_name.split(" ")[0]}, we noticed you didn't check in for "${event.title}" on ${format(new Date(event.date), "dd MMM yyyy")}. We hope you're doing well — see you at our next event!`,
    });
  };

  const openNotifyNoShows = () => {
    if (noShows.length === 0) return;
    setModal({
      recipients: noShows.map((r) => ({ userId: r.user_id, name: r.student_name })),
      defaultTitle: `You missed: ${event.title}`,
      defaultMessage: `Hi, we noticed you didn't check in for "${event.title}" on ${format(new Date(event.date), "dd MMM yyyy")}. We hope you're doing well — see you at our next event!`,
    });
  };

  const openNotifyAll = () => {
    const withUserId = confirmedList.filter((r) => r.user_id);
    if (withUserId.length === 0) return;
    setModal({
      recipients: withUserId.map((r) => ({ userId: r.user_id, name: r.student_name })),
      defaultTitle: `Update from ${event.title}`,
      defaultMessage: `Hi, thank you for registering for "${event.title}". Here's an update from the organizers.`,
    });
  };

  const printBulkCertificates = () => {
    const attended = confirmedList.filter((r) => r.attended);
    if (attended.length === 0) { alert("No attended students to generate certificates for."); return; }
    const win = window.open("", "_blank");
    if (!win) return;
    const eventTitle = event?.title ?? "";
    const certsHtml = attended.map((r, i) => `
      <div style="page-break-after:${i < attended.length - 1 ? "always" : "auto"};padding:60px;text-align:center;border:8px double #f59e0b;margin:20px;border-radius:16px;font-family:Georgia,serif;">
        <div style="font-size:14px;color:#6b7280;letter-spacing:4px;text-transform:uppercase;margin-bottom:24px;">Spirits</div>
        <div style="font-size:13px;color:#374151;margin-bottom:32px;">This is to certify that</div>
        <div style="font-size:32px;font-weight:bold;color:#1f2937;border-bottom:2px solid #e5e7eb;padding-bottom:12px;margin-bottom:12px;">${r.student_name}</div>
        <div style="font-size:13px;color:#6b7280;margin-bottom:32px;">${r.student_department ?? ""}${r.student_year ? " · " + r.student_year : ""}</div>
        <div style="font-size:14px;color:#374151;margin-bottom:8px;">has successfully participated in</div>
        <div style="font-size:22px;font-weight:bold;color:#4f46e5;margin-bottom:32px;">${eventTitle}</div>
        <div style="font-size:13px;color:#6b7280;">Issued on ${new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
      </div>
    `).join("");
    win.document.write(`<html><head><title>Certificates — ${eventTitle}</title><style>@media print{.no-print{display:none}body{margin:0}}</style></head><body>${certsHtml}<div class="no-print" style="text-align:center;padding:20px"><button onclick="window.print()" style="background:#4f46e5;color:white;border:none;padding:12px 32px;border-radius:8px;font-size:16px;cursor:pointer">Print All ${attended.length} Certificates</button></div></body></html>`);
    win.document.close();
  };

  const exportCSV = () => {
    const headers = ["Name", "Email", "Year", "Department", "Payment", "Registered At", "Attended", "Status", "Cancel reason", "Cancelled At"];
    const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [...confirmedList, ...waitingList, ...cancelledList].map((r) => [
      r.student_name, r.student_email, r.student_year ?? "", r.student_department ?? "",
      r.payment_status, format(new Date(r.registered_at), "yyyy-MM-dd HH:mm"),
      attendance[r.id] ? "Yes" : "No",
      r.status === "confirmed" ? "Registered" : r.status === "waitlist" ? "Waiting" : "Cancelled",
      r.cancel_reason ?? "", r.cancelled_at ? format(new Date(r.cancelled_at), "yyyy-MM-dd HH:mm") : "",
    ].map((v) => q(String(v))));
    const csv = [headers.map(q), ...rows].map((row) => row.join(",")).join("\n");
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
        
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Registrants</h1>
            <p className="text-gray-500 text-sm mt-1 truncate max-w-[200px] sm:max-w-none">{event.title}</p>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap">
            {over && noShows.length > 0 && (
              <Button
                variant="outline"
                className="gap-2 text-sm px-3 border-orange-200 text-orange-600 hover:bg-orange-50"
                onClick={openNotifyNoShows}
              >
                <Bell className="w-4 h-4" />
                <span className="hidden sm:inline">Notify No-shows</span>
                <span className="sm:hidden">No-shows</span>
                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {noShows.length}
                </span>
              </Button>
            )}
            <Button variant="outline" className="gap-2 text-sm px-2 sm:px-4" onClick={openNotifyAll}>
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notify All</span>
            </Button>

            <Button variant="outline" className="gap-2 text-sm px-2 sm:px-4" onClick={exportCSV}>
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
            <Button variant="outline" className="gap-2 text-sm px-2 sm:px-4" onClick={printBulkCertificates}>
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Bulk Certificates</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        {[
          { label: "Registered", value: `${confirmedList.length}`, sub: `of ${event.capacity} seats`, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", go: "registered" as const },
          { label: "Attended", value: `${attendedCount}`, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", go: "registered" as const },
          { label: over ? "No-show" : "Not checked in yet", value: `${confirmedList.length - attendedCount}`, icon: XCircle, color: "text-gray-500", bg: "bg-gray-100", go: "registered" as const },
          { label: "Waiting list", value: `${waitingList.length}`, icon: Clock, color: "text-amber-600", bg: "bg-amber-50", go: "waiting" as const },
          { label: "Cancelled", value: `${cancelledList.length}`, icon: Ban, color: "text-red-500", bg: "bg-red-50", go: "cancelled" as const },
        ].map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => setView(s.go)}
            className="text-left bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3 hover:border-indigo-200 transition-colors"
          >
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500 truncate">{s.label}{"sub" in s && s.sub ? ` · ${s.sub}` : ""}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Which list to show */}
      <div className="flex gap-1.5 bg-gray-100/70 p-1 rounded-xl w-fit max-w-full overflow-x-auto">
        {([
          ["registered", `Registered (${confirmedList.length})`],
          ["waiting", `Waiting list (${waitingList.length})`],
          ["cancelled", `Cancelled (${cancelledList.length})`],
        ] as const).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setView(k)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${view === k ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-800"}`}
          >
            {label}
          </button>
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
      {view === "registered" && (
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["#", "Name", "Email", "Year", "Dept.", "Registered", "Attended", "Notify"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                    {confirmedList.length === 0 ? "No registrations yet." : "No results found."}
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-gray-400 font-mono">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-semibold text-xs shrink-0">
                        {r.student_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">{r.student_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{r.student_email}</td>
                  <td className="px-4 py-3 text-gray-500">{r.student_year ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500">{r.student_department ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                    {format(new Date(r.registered_at), "MMM d, HH:mm")}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggleAttendance(r.id)}
                      className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                        attendance[r.id]
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {attendance[r.id] ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Present</>
                      ) : (
                        <><XCircle className="w-3.5 h-3.5" /> Absent</>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    {r.user_id && (
                      <button
                        onClick={() => openNotifyOne(r)}
                        title="Send notification"
                        className={`p-1.5 rounded-lg transition-colors ${
                          !attendance[r.id]
                            ? "text-orange-500 hover:bg-orange-50"
                            : "text-gray-300 hover:bg-gray-100"
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      )}

      {view === "waiting" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-amber-50/50 text-sm text-amber-900">
            In join order. When someone cancels, the first person here takes the seat automatically. You can also move someone up yourself.
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{["Place", "Name", "Email", "Dept.", "Joined", ""].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredWaiting.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">{waitingList.length === 0 ? "Nobody is waiting." : "No results found."}</td></tr>
                )}
                {filteredWaiting.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 font-mono">#{waitingList.indexOf(r) + 1}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{r.student_name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.student_email}</td>
                    <td className="px-4 py-3 text-gray-500">{r.student_department ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{format(new Date(r.registered_at), "MMM d, HH:mm")}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => moveUp(r)}
                        disabled={moving === r.id}
                        className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold hover:bg-indigo-700 disabled:opacity-60 whitespace-nowrap"
                      >
                        {moving === r.id ? "Moving…" : "Move to registered"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === "cancelled" && (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[720px]">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>{["Name", "Email", "Reason", "Cancelled", "Was"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredCancelled.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400">{cancelledList.length === 0 ? "No cancellations." : "No results found."}</td></tr>
                )}
                {filteredCancelled.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{r.student_name}</td>
                    <td className="px-4 py-3 text-gray-500">{r.student_email}</td>
                    <td className="px-4 py-3 text-gray-700 max-w-xs">{r.cancel_reason ?? <span className="text-gray-400">No reason given</span>}</td>
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{r.cancelled_at ? format(new Date(r.cancelled_at), "MMM d, HH:mm") : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${r.cancelled_from === "waitlist" ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-700"}`}>
                        {r.cancelled_from === "waitlist" ? "Was waiting" : "Was registered"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notification modal */}
      {modal && (
        <NotificationModal
          recipients={modal.recipients}
          defaultTitle={modal.defaultTitle}
          defaultMessage={modal.defaultMessage}
          eventId={id}
          onClose={() => setModal(null)}
        />
      )}


    </div>
  );
}
