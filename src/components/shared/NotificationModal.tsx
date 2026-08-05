"use client";

import { useState } from "react";
import { X, Send, Bell } from "lucide-react";
import { Input } from "@/components/ui/input";
import { sendNotification, sendNotificationToUsers } from "@/lib/db";

type Props = {
  recipients: { userId: string; name: string }[];
  defaultTitle?: string;
  defaultMessage?: string;
  eventId?: string;
  onClose: () => void;
  onSent?: () => void;
};

export default function NotificationModal({ recipients, defaultTitle = "", defaultMessage = "", eventId, onClose, onSent }: Props) {
  const [title, setTitle] = useState(defaultTitle);
  const [message, setMessage] = useState(defaultMessage);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true);
    try {
      if (recipients.length === 1) {
        await sendNotification(recipients[0].userId, title.trim(), message.trim(), eventId);
      } else {
        await sendNotificationToUsers(recipients.map((r) => r.userId), title.trim(), message.trim(), eventId);
      }
      setDone(true);
      setTimeout(() => { onSent?.(); onClose(); }, 1200);
    } catch {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 text-sm">
              Send Notification
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Recipient chip(s) */}
          <div>
            <p className="text-xs font-medium text-gray-500 mb-2">To</p>
            <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
              {recipients.map((r) => (
                <span key={r.userId} className="bg-indigo-100 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                  {r.name}
                </span>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Notification title"
              maxLength={100}
            />
          </div>

          {/* Message */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message…"
              maxLength={500}
              rows={4}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-1">{message.length}/500</p>
          </div>

          {done ? (
            <div className="flex items-center justify-center gap-2 py-2 text-green-600 font-medium text-sm">
              <Send className="w-4 h-4" /> Sent successfully!
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={handleSend}
                disabled={sending || !title.trim() || !message.trim()}
                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-4 h-4" />
                {sending ? "Sending…" : `Send to ${recipients.length === 1 ? recipients[0].name : `${recipients.length} students`}`}
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2.5 text-gray-600 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
