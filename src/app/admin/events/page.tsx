"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CATEGORY_COLORS, CATEGORIES, isEventPast, type Event } from "@/lib/mock-data";
import { getAdaptedEvents, deleteEvent, cloneEvent } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { Plus, Search, Users, Eye, Edit, Trash2, Calendar, Copy } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  upcoming: "bg-blue-100 text-blue-700",
  ongoing: "bg-green-100 text-green-700",
  completed: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-100 text-red-700",
  postponed: "bg-yellow-100 text-yellow-700",
};

export default function AdminEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    getAdaptedEvents().then(setEvents).catch(console.error);
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

  const upcomingCount = events.filter((e) => !isEventPast(e)).length;
  const pastCount = events.filter((e) => isEventPast(e)).length;

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
          <table className="w-full text-sm min-w-[700px]">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {["Event", "Category", "Date", "Capacity", "Status", "Actions"].map((h) => (
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
                return (
                  <tr key={event.id} className={`hover:bg-gray-50 transition-colors ${past ? "opacity-60" : ""}`}>
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
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-gray-600">
                        <Users className="w-3.5 h-3.5" />
                        <span>{event.registrations}</span>
                        <span className="text-gray-400">/ {event.capacity}</span>
                      </div>
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
                        <Link href={`/admin/events/${event.id}/registrants`}>
                          <button className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors" title="Registrants">
                            <Users className="w-4 h-4" />
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
    </div>
  );
}
