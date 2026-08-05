"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, X, CheckCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import {
  getMyNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type DbNotification,
} from "@/lib/db";

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState<DbNotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const load = () => getMyNotifications().then(setNotifs).catch(() => {});

  useEffect(() => {
    load();
    const timer = setInterval(load, 30_000);
    return () => clearInterval(timer);
  }, []);

  // close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const unread = notifs.filter((n) => !n.read).length;

  const handleOpen = () => setOpen((o) => !o);

  const handleRead = async (n: DbNotification) => {
    if (!n.read) {
      setNotifs((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
      await markNotificationRead(n.id);
    }
  };

  const handleMarkAll = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
    await markAllNotificationsRead();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={handleOpen}
        className="relative p-1.5 rounded-lg hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900 text-sm">
              Notifications
              {unread > 0 && (
                <span className="ml-2 bg-red-100 text-red-600 text-xs font-bold px-1.5 py-0.5 rounded-full">{unread}</span>
              )}
            </h3>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  onClick={handleMarkAll}
                  className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto divide-y divide-gray-50">
            {notifs.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                No notifications yet
              </div>
            ) : (
              notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleRead(n)}
                  className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${!n.read ? "bg-indigo-50/50" : ""}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? "bg-indigo-500" : "bg-transparent"}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${!n.read ? "text-gray-900" : "text-gray-600"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-gray-400 mt-1">
                        {format(parseISO(n.created_at), "dd MMM, h:mm a")}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
