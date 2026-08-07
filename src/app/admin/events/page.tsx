"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORY_COLORS, CATEGORIES, isEventPast, type Event } from "@/lib/mock-data";
import { getAdaptedEvents, deleteEvent, cloneEvent, getEventRegistrations, sendNotification, type DbRegistration } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Plus, Search, Users, Eye, Edit, Trash2, Calendar, Copy, X, Bell, CheckCircle2, UserX, Send, Star } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  postponed: "bg-yellow-100 text-yellow-700",
};

type AbsentInfo = {
  students: DbRegistration[];
  loaded: boolean;
};

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Absent panel state
  const [absentMap, setAbsentMap] = useState<Record<string, AbsentInfo>>({});
  const [panel, setPanel] = useState<{ eventId: string; title: string } | null>(null);
  const [notifiedAll, setNotifiedAll] = useState<Record<string, boolean>>({});
  const [notifiedStudent, setNotifiedStudent] = useState<Record<string, boolean>>({});
  const [sending, setSending] = useState<string | null>(null); // eventId or studentId being sent

  useEffect(() => {
    getAdaptedEvents().then((evs) => {
      setEvents(evs);
      // Load absent counts for past events
      const pastEvs = evs.filter((e) => isEventPast(e));
      pastEvs.forEach(async (ev) => {
        const regs = await getEventRegistrations(ev.id).catch(() => [] as DbRegistration[]);
        const absent = regs.filter((r) => !r.attended);
        setAbsentMap((prev) => ({ ...prev, [ev.id]: { students: absent, loaded: true } }));
      });
      // Restore notified state from localStorage
      try {
        const stored = JSON.parse(localStorage.getItem("absent_notified") ?? "{}");
        setNotifiedAll(stored);
      } catch {}
    }).catch(console.error);
  }, []);

  const sortedEvents = [...events].sort((a, b) => {
    const aPast = isEventPast(a);
    const bPast = isEventPast(b);
    if (aPast !== bPast) return aPast ? 1 : -1;
    return aPast
      ? new Date(b.date).getTime() - new Date(a.date).getTime()
      : new Date(a.date).getTime() - new Date(b.date).getTime();
  });

  const filtered = sortedEvents.filter((e) => {
    const matchSearch = e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some((t) => t.includes(search.toLowerCase()));
    const matchCat = categoryFilter === "all" || e.category === categoryFilter;
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    return matchSearch && matchCat && matchStatus;
  });

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    await deleteEvent(id).catch(console.error);
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleClone = async (id: string) => {
    const newId = await cloneEvent(id).catch(console.error);
    if (newId) router.push(`/admin/events/${newId}`);
  };

  const openAbsentPanel = async (eventId: string, title: string) => {
    setPanel({ eventId, title });
    // Load if not yet loaded
    if (!absentMap[eventId]?.loaded) {
      const regs = await getEventRegistrations(eventId).catch(() => [] as DbRegistration[]);
      const absent = regs.filter((r) => !r.attended);
      setAbsentMap((prev) => ({ ...prev, [eventId]: { students: absent, loaded: true } }));
    }
  };

  const notifyOne = async (student: DbRegistration, eventId: string, eventTitle: string) => {
    if (!student.user_id) return;
    setSending(student.id);
    await sendNotification(
      student.user_id,
      `You missed: ${eventTitle}`,
      `Hi ${student.student_name.split(" ")[0]}, you were registered but didn't attend "${eventTitle}". Check upcoming events to stay engaged!`,
      eventId
    ).catch(console.error);
    setNotifiedStudent((prev) => ({ ...prev, [student.id]: true }));
    setSending(null);
  };

  const notifyAll = async (eventId: string, eventTitle: string) => {
    const absent = absentMap[eventId]?.students ?? [];
    if (absent.length === 0) return;
    setSending(`all_${eventId}`);
    await Promise.all(
      absent.filter((s) => s.user_id && !notifiedStudent[s.id]).map((s) =>
        sendNotification(
          s.user_id,
          `You missed: ${eventTitle}`,
          `Hi ${s.student_name.split(" ")[0]}, you were registered but didn't attend "${eventTitle}". Check upcoming events to stay engaged!`,
          eventId
        ).catch(console.error)
      )
    );
    const updated = { ...notifiedAll, [eventId]: true };
    setNotifiedAll(updated);
    localStorage.setItem("absent_notified", JSON.stringify(updated));
    setSending(null);
  };

  const upcomingCount = events.filter((e) => !isEventPast(e)).length;
  const pastCount = events.filter((e) => isEventPast(e)).length;
  const panelAbsents = panel ? (absentMap[panel.eventId]?.students ?? []) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Events</h1>
          <p className="text-gray-500 text-sm mt-1">
            {upcomingCount} upcoming · {pastCount} past
          </p>
        </div>
        <Link href="/admin/events/new" className="shrink-0">
          <Button className="bg-indigo-600 hover:bg-indigo-700 gap-2 text-sm px-3 sm:px-4">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Event</span>
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto"
        >
          <option value="all">All Status</option>
          {["upcoming", "ongoing", "completed", "cancelled"].map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
      </div>

      {/* Events table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Event", "Category", "Date", "Attendance", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left px-4 py-3 font-medium text-gray-600 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    {events.length === 0 ? "Loading..." : "No events found matching your filters."}
                  </td>
                </tr>
              )}
              {filtered.map((event) => {
                const past = isEventPast(event);
                const absentInfo = absentMap[event.id];
                const absentCount = absentInfo?.students.length ?? 0;
                const alreadyNotified = notifiedAll[event.id];

                return (
                  <tr key={event.id} className={`hover:bg-gray-50 transition-colors ${past ? "opacity-75" : ""}`}>
                    <td className="px-4 py-3">
                      <Link href={`/admin/events/${event.id}`} className="flex items-center gap-3 group">
                        <img src={event.bannerImage} alt={event.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate max-w-[200px] group-hover:text-indigo-600 transition-colors">{event.title}</p>
                          <p className="text-xs text-gray-400 truncate">{event.venue}</p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[event.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {event.category.replace("-", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" />
                        {format(new Date(event.date), "MMM d, yyyy")}
                      </div>
                    </td>

                    {/* Attendance column */}
                    <td className="px-4 py-3">
                      {past && absentInfo?.loaded ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-gray-600 text-xs">
                            <Users className="w-3.5 h-3.5" />
                            <span>{event.registrations}</span>
                            <span className="text-gray-400">/ {event.capacity}</span>
                          </div>
                          {absentCount > 0 ? (
                            alreadyNotified ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                <CheckCircle2 className="w-3 h-3" /> {absentCount} notified
                              </span>
                            ) : (
                              <button
                                onClick={() => openAbsentPanel(event.id, event.title)}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full transition-colors"
                              >
                                <UserX className="w-3 h-3" /> {absentCount} absent
                              </button>
                            )
                          ) : (
                            <span className="text-xs text-green-600">All attended</span>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Users className="w-3.5 h-3.5" />
                          <span>{event.registrations}</span>
                          <span className="text-gray-400">/ {event.capacity}</span>
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_COLORS[past ? "completed" : event.status] ?? STATUS_COLORS.completed}`}>
                        {past ? "completed" : event.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/events/${event.id}/registrants`}>
                          <button className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors" title="View Registrants">
                            <Eye className="w-4 h-4" />
                          </button>
                        </Link>
                        {past && (
                          <Link href={`/admin/events/${event.id}/surveys`}>
                            <button className="p-1.5 rounded-lg hover:bg-yellow-50 text-gray-400 hover:text-yellow-500 transition-colors" title="View Surveys">
                              <Star className="w-4 h-4" />
                            </button>
                          </Link>
                        )}
                        <button
                          onClick={() => handleClone(event.id)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-400 hover:text-purple-600 transition-colors"
                          title="Clone Event"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <Link href={`/admin/events/${event.id}`}>
                          <button className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors" title="Edit">
                            <Edit className="w-4 h-4" />
                          </button>
                        </Link>
                        <button
                          onClick={() => handleDelete(event.id, event.title)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Absent students panel */}
      {panel && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setPanel(null)}
          />
          {/* Slide-in panel */}
          <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-white shadow-2xl z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-start justify-between p-5 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <UserX className="w-4 h-4 text-red-500" />
                  <h2 className="font-semibold text-gray-900 text-sm">Absent Students</h2>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{panel.title}</p>
              </div>
              <button
                onClick={() => setPanel(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 shrink-0 ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Notify all bar */}
            {panelAbsents.length > 0 && (
              <div className="px-5 py-3 bg-red-50 border-b border-red-100 flex items-center justify-between gap-3">
                <p className="text-xs text-red-700 font-medium">
                  {panelAbsents.length} student{panelAbsents.length > 1 ? "s" : ""} didn&apos;t attend
                </p>
                {notifiedAll[panel.eventId] ? (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-100 px-3 py-1.5 rounded-full">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Notified
                  </span>
                ) : (
                  <button
                    onClick={() => notifyAll(panel.eventId, panel.title)}
                    disabled={sending === `all_${panel.eventId}`}
                    className="flex items-center gap-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white px-3 py-1.5 rounded-full transition-colors"
                  >
                    {sending === `all_${panel.eventId}` ? (
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    Notify All
                  </button>
                )}
              </div>
            )}

            {/* Student list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {!absentMap[panel.eventId]?.loaded ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : panelAbsents.length === 0 ? (
                <div className="py-12 text-center text-gray-400 text-sm">No absent students</div>
              ) : (
                panelAbsents.map((s) => {
                  const done = notifiedAll[panel.eventId] || notifiedStudent[s.id];
                  return (
                    <div key={s.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-red-600">
                          {s.student_name.split(" ").map((n: string) => n[0]).join("").slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{s.student_name}</p>
                        <p className="text-xs text-gray-400 truncate">{s.student_department ?? s.student_email}</p>
                      </div>
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      ) : (
                        <button
                          onClick={() => notifyOne(s, panel.eventId, panel.title)}
                          disabled={sending === s.id}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-indigo-100 hover:text-indigo-600 text-gray-500 disabled:opacity-50 transition-colors shrink-0"
                          title="Send notification"
                        >
                          {sending === s.id
                            ? <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                            : <Bell className="w-3.5 h-3.5" />
                          }
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
