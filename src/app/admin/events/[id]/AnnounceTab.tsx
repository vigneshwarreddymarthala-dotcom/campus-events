"use client";

import { useEffect, useState } from "react";
import { Megaphone, Send, CheckCircle2, AlertCircle, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { getAllStudents, getEventRegistrations, sendNotificationToUsers } from "@/lib/db";

type Audience = "registered" | "all";

const TEMPLATES = [
  { label: "Reminder", title: "Reminder", message: "Don't forget: this event is coming up soon. See you there!" },
  { label: "Change", title: "Update: details changed", message: "There is a change to the time or venue. Please check the event page for the latest details." },
  { label: "Thank you", title: "Thank you for joining", message: "Thanks for being part of this event! Please share your feedback in the app." },
];

export default function AnnounceTab({ id, eventTitle }: { id: string; eventTitle: string }) {
  const [audience, setAudience] = useState<Audience>("registered");
  const [registeredIds, setRegisteredIds] = useState<string[] | null>(null);
  const [allIds, setAllIds] = useState<string[] | null>(null); // null = not allowed to list all students
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    getEventRegistrations(id)
      .then((regs) => setRegisteredIds([...new Set(regs.map((r) => r.user_id).filter(Boolean))]))
      .catch(() => setRegisteredIds([]));
    getAllStudents()
      .then((s) => setAllIds(s.map((p) => p.id)))
      .catch(() => setAllIds(null));
  }, [id]);

  const recipients = audience === "all" ? allIds ?? [] : registeredIds ?? [];

  const send = async () => {
    if (!title.trim() || !message.trim() || recipients.length === 0) return;
    setSending(true);
    setResult(null);
    try {
      await sendNotificationToUsers(recipients, title.trim(), message.trim(), id);
      setResult({ ok: true, text: `Sent to ${recipients.length} student${recipients.length === 1 ? "" : "s"}. They will see it in the app.` });
      setTitle("");
      setMessage("");
    } catch (e) {
      setResult({ ok: false, text: e instanceof Error ? e.message : "Could not send the message." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-5">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
          <Megaphone className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-semibold text-lg text-gray-900">Send an update about this event</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Students get this as a notification in the app, linked to <span className="font-medium text-gray-700">{eventTitle}</span>.
          </p>
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Who should get it?</p>
        <div className="grid sm:grid-cols-2 gap-2">
          {([
            { key: "registered", label: "Registered students", count: registeredIds?.length },
            { key: "all", label: "All students", count: allIds?.length, disabled: allIds === null },
          ] as { key: Audience; label: string; count?: number; disabled?: boolean }[]).map((o) => (
            <button
              key={o.key}
              type="button"
              disabled={o.disabled}
              onClick={() => setAudience(o.key)}
              className={`flex items-center justify-between gap-2 px-4 py-3 rounded-xl border text-sm font-medium text-left transition-colors disabled:opacity-40 ${
                audience === o.key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              }`}
            >
              <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {o.label}</span>
              <span className="text-xs font-semibold">{o.count ?? "–"}</span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-medium text-gray-500 mb-2">Quick templates</p>
        <div className="flex flex-wrap gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => { setTitle(t.title); setMessage(t.message); }}
              className="px-3 py-2 rounded-lg bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200"
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label htmlFor="ann-title" className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
          <Input id="ann-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="e.g. Venue changed to Hall B" />
        </div>
        <div>
          <label htmlFor="ann-msg" className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
          <textarea
            id="ann-msg"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
            rows={4}
            placeholder="Write what students need to know…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <p className="text-xs text-gray-400 text-right mt-1">{message.length}/500</p>
        </div>
      </div>

      {result && (
        <div className={`flex items-start gap-2 text-sm px-4 py-3 rounded-xl border ${result.ok ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>
          {result.ok ? <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" /> : <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />}
          {result.text}
        </div>
      )}

      <button
        type="button"
        onClick={send}
        disabled={sending || !title.trim() || !message.trim() || recipients.length === 0}
        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        <Send className="w-4 h-4" />
        {sending ? "Sending…" : `Send to ${recipients.length} student${recipients.length === 1 ? "" : "s"}`}
      </button>
      {audience === "registered" && registeredIds?.length === 0 && (
        <p className="text-xs text-gray-400">No one has registered for this event yet. Choose “All students” to reach everyone.</p>
      )}
    </div>
  );
}
