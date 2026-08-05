"use client";

import { useState, useEffect } from "react";
import { getAdaptedEvents, getAllStudents, getEventRegistrations, sendNotificationToUsers, type DbProfile, type DbRegistration } from "@/lib/db";
import { type Event } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Bell, Users, BookOpen, CalendarDays, Send, Search, CheckSquare, Square } from "lucide-react";

const DEPARTMENTS = [
  "Computer Science", "Electrical Engineering", "Mechanical Engineering",
  "Civil Engineering", "Business Administration", "Arts & Humanities",
  "Medical Sciences", "Law", "Architecture", "Other",
];

type TargetType = "all" | "department" | "event" | "custom";

export default function AdminNotificationsPage() {
  const [students, setStudents] = useState<DbProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [eventRegistrations, setEventRegistrations] = useState<DbRegistration[]>([]);
  const [targetType, setTargetType] = useState<TargetType>("all");
  const [selectedDept, setSelectedDept] = useState("");
  const [selectedEvent, setSelectedEvent] = useState("");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    getAllStudents().then(setStudents).catch(console.error);
    getAdaptedEvents().then(setEvents).catch(console.error);
  }, []);

  useEffect(() => {
    if (targetType === "event" && selectedEvent) {
      getEventRegistrations(selectedEvent).then(setEventRegistrations).catch(console.error);
    } else {
      setEventRegistrations([]);
    }
  }, [targetType, selectedEvent]);

  // compute recipients based on target type
  const recipients: DbProfile[] = (() => {
    if (targetType === "all") return students;
    if (targetType === "department") return students.filter((s) => s.department === selectedDept);
    if (targetType === "event") return eventRegistrations
      .filter((r) => r.user_id)
      .map((r) => ({
        id: r.user_id,
        name: r.student_name,
        email: r.student_email,
        role: "student",
        department: r.student_department,
        year: r.student_year,
        phone: null,
      }));
    if (targetType === "custom") {
      const q = search.toLowerCase();
      return students.filter(
        (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }
    return [];
  })();

  const toggleStudent = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(recipients.map((s) => s.id)));
  const clearAll = () => setSelected(new Set());

  const finalRecipients =
    targetType === "custom"
      ? recipients.filter((s) => selected.has(s.id))
      : recipients;

  const recipientCount =
    targetType === "custom" ? finalRecipients.length : recipients.length;

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    const ids = finalRecipients.map((s) => s.id);
    if (ids.length === 0) return;
    setSending(true);
    try {
      await sendNotificationToUsers(ids, title.trim(), message.trim(), selectedEvent || undefined);
      setSent(true);
      setTitle("");
      setMessage("");
      setSelected(new Set());
      setTimeout(() => setSent(false), 3000);
    } catch (e) {
      console.error(e);
    }
    setSending(false);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Send Notifications</h1>
        <p className="text-gray-500 text-sm mt-1">Compose and send messages to students</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Target selector */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">1. Choose Recipients</h3>

          <div className="grid grid-cols-2 gap-2">
            {([
              { key: "all", label: "All Students", icon: Users },
              { key: "department", label: "By Department", icon: BookOpen },
              { key: "event", label: "By Event", icon: CalendarDays },
              { key: "custom", label: "Pick Students", icon: Search },
            ] as { key: TargetType; label: string; icon: React.FC<{ className?: string }> }[]).map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => { setTargetType(key); setSelected(new Set()); }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-sm font-medium transition-colors ${
                  targetType === key
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "border-gray-200 text-gray-600 hover:border-indigo-300"
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>

          {/* Department picker */}
          {targetType === "department" && (
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select department…</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          )}

          {/* Event picker */}
          {targetType === "event" && (
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select event…</option>
              {events.map((ev) => <option key={ev.id} value={ev.id}>{ev.title}</option>)}
            </select>
          )}

          {/* Custom student picker */}
          {targetType === "custom" && (
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search students…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 px-0.5">
                <span>{selected.size} selected</span>
                <div className="flex gap-3">
                  <button onClick={selectAll} className="text-indigo-600 hover:underline">Select all</button>
                  <button onClick={clearAll} className="text-gray-400 hover:underline">Clear</button>
                </div>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-2">
                {recipients.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">{search ? "No results" : "No students"}</p>
                ) : recipients.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => toggleStudent(s.id)}
                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    {selected.has(s.id)
                      ? <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      : <Square className="w-4 h-4 text-gray-300 shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400 truncate">{s.department ?? s.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recipient count summary */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600 shrink-0" />
            <p className="text-sm text-indigo-800 font-medium">
              {targetType === "event" && !selectedEvent
                ? "Select an event to see recipients"
                : targetType === "event" && selectedEvent && eventRegistrations.length === 0
                ? "Loading registrants…"
                : `${recipientCount} student${recipientCount !== 1 ? "s" : ""} will receive this notification`}
            </p>
          </div>
        </div>

        {/* Compose */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
          <h3 className="font-semibold text-gray-900">2. Compose Message</h3>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Event Reminder, Important Update…"
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Message *</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here…"
              rows={6}
              maxLength={500}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{message.length}/500</p>
          </div>

          {/* Quick templates */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">Quick templates</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Reminder", t: "Event Reminder", m: "Don't forget! The event is happening soon. Make sure to confirm your attendance." },
                { label: "Update", t: "Important Update", m: "There's an important update regarding the upcoming event. Please check the event page for details." },
                { label: "Thank you", t: "Thank You!", m: "Thank you for attending our event! We hope you had a great time. Your feedback matters — fill the survey!" },
              ].map((tpl) => (
                <button
                  key={tpl.label}
                  onClick={() => { setTitle(tpl.t); setMessage(tpl.m); }}
                  className="text-xs bg-gray-100 hover:bg-indigo-50 hover:text-indigo-700 text-gray-600 px-3 py-1.5 rounded-lg transition-colors font-medium"
                >
                  {tpl.label}
                </button>
              ))}
            </div>
          </div>

          {sent ? (
            <div className="flex items-center justify-center gap-2 py-3 bg-green-50 border border-green-200 rounded-xl text-green-700 font-medium text-sm">
              <Send className="w-4 h-4" /> Sent successfully!
            </div>
          ) : (
            <button
              onClick={handleSend}
              disabled={
                sending ||
                !title.trim() ||
                !message.trim() ||
                (targetType === "custom" && selected.size === 0) ||
                (targetType === "department" && !selectedDept) ||
                (targetType === "event" && !selectedEvent) ||
                recipientCount === 0
              }
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
              {sending ? "Sending…" : `Send to ${recipientCount} student${recipientCount !== 1 ? "s" : ""}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
