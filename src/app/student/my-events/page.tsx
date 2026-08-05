"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { isEventPast, type Event } from "@/lib/mock-data";
import EventCard from "@/components/shared/EventCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Bookmark, History, CalendarCheck } from "lucide-react";
import {
  getAdaptedEvents, getMyBookmarks, getMyRegistrations,
  addBookmark, removeBookmark,
} from "@/lib/db";

export default function MyEventsPage() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [registeredIds, setRegisteredIds] = useState<string[]>([]);
  const [attendedIds, setAttendedIds] = useState<string[]>([]);

  useEffect(() => {
    getAdaptedEvents().then(setAllEvents).catch(console.error);
    getMyBookmarks().then(setBookmarks).catch(console.error);
    getMyRegistrations().then((regs) => {
      setRegisteredIds(regs.map((r) => r.event_id));
      setAttendedIds(regs.filter((r) => r.attended).map((r) => r.event_id));
    }).catch(console.error);
  }, []);

  const toggleBookmark = async (id: string) => {
    if (bookmarks.includes(id)) {
      setBookmarks((prev) => prev.filter((b) => b !== id));
      await removeBookmark(id).catch(console.error);
    } else {
      setBookmarks((prev) => [...prev, id]);
      await addBookmark(id).catch(console.error);
    }
  };

  const registeredEvents = allEvents.filter((e) => registeredIds.includes(e.id) && !isEventPast(e));
  const bookmarkedEvents = allEvents.filter((e) => bookmarks.includes(e.id));
  const attendedEvents = allEvents
    .filter((e) => attendedIds.includes(e.id))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Events</h1>
        <p className="text-gray-500 text-sm mt-1">Your registrations, bookmarks, and history.</p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[
          { label: "Upcoming Registered", value: registeredEvents.length, icon: CalendarCheck, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Saved", value: bookmarks.length, icon: Bookmark, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Past Attended", value: attendedEvents.length, icon: History, color: "text-green-600", bg: "bg-green-50" },
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

      <Tabs defaultValue="registered">
        <TabsList className="bg-white border border-gray-200 rounded-xl p-1 w-full sm:w-auto overflow-x-auto flex">
          <TabsTrigger value="registered" className="gap-1.5 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap">
            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Upcoming</span>
            <span className="hidden sm:inline">({registeredEvents.length})</span>
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="gap-1.5 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap">
            <Bookmark className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Saved</span>
            <span className="hidden sm:inline">({bookmarks.length})</span>
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 rounded-lg data-[state=active]:bg-indigo-600 data-[state=active]:text-white text-xs sm:text-sm flex-1 sm:flex-none whitespace-nowrap">
            <History className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Past Attended ({attendedEvents.length})</span>
            <span className="sm:hidden">Past</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="registered" className="mt-6">
          {registeredEvents.length === 0 ? (
            <EmptyState
              icon={<Calendar className="w-12 h-12 text-gray-300" />}
              title="No registrations yet"
              description="Browse upcoming events and register to see them here."
              linkHref="/student/events"
              linkLabel="Discover Events"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {registeredEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  basePath="student"
                  isBookmarked={bookmarks.includes(event.id)}
                  isRegistered
                  onBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarks" className="mt-6">
          {bookmarkedEvents.length === 0 ? (
            <EmptyState
              icon={<Bookmark className="w-12 h-12 text-gray-300" />}
              title="No saved events"
              description="Bookmark events you&apos;re interested in to find them quickly later."
              linkHref="/student/events"
              linkLabel="Browse Events"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {bookmarkedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  basePath="student"
                  isBookmarked
                  isRegistered={registeredIds.includes(event.id)}
                  onBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {attendedEvents.length === 0 ? (
            <EmptyState
              icon={<History className="w-12 h-12 text-gray-300" />}
              title="No past events"
              description="Events you&apos;ve attended will appear here."
              linkHref="/student/events"
              linkLabel="Find Events"
            />
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {attendedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  basePath="student"
                  isBookmarked={bookmarks.includes(event.id)}
                  onBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ icon, title, description, linkHref, linkLabel }: {
  icon: React.ReactNode; title: string; description: string; linkHref: string; linkLabel: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-gray-700 mb-2">{title}</h3>
      <p className="text-gray-400 text-sm mb-6">{description}</p>
      <Link
        href={linkHref}
        className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        {linkLabel}
      </Link>
    </div>
  );
}
