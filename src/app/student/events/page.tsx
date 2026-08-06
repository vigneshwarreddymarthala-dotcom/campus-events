"use client";

import { useState, useEffect, Suspense } from "react";
import { CATEGORIES, Category, isEventPast, type Event } from "@/lib/mock-data";
import { getAdaptedEvents, getMyBookmarks, getMyRegistrations, addBookmark, removeBookmark } from "@/lib/db";
import EventCard from "@/components/shared/EventCard";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, List, SlidersHorizontal, ChevronDown, ChevronUp, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths, isToday } from "date-fns";

type SortMode = "newest" | "date" | "trending";
type ViewMode = "grid" | "list" | "calendar";

export default function StudentEventsPage() {
  return (
    <Suspense>
      <StudentEventsPageInner />
    </Suspense>
  );
}

function StudentEventsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [events, setEvents] = useState<Event[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [feeFilter, setFeeFilter] = useState<"all" | "free" | "paid">("all");
  const [sort, setSort] = useState<SortMode>("date");
  const [view, setView] = useState<ViewMode>((searchParams.get("view") as ViewMode) || "grid");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [registrations, setRegistrations] = useState<string[]>([]);
  const [calMonth, setCalMonth] = useState(new Date());
  const [showPast, setShowPast] = useState(false);

  const setViewAndUrl = (v: ViewMode) => {
    setView(v);
    const params = new URLSearchParams(window.location.search);
    params.set("view", v);
    router.replace(`/student/events?${params.toString()}`, { scroll: false });
  };

  useEffect(() => {
    getAdaptedEvents().then(setEvents).catch(console.error);
    getMyBookmarks().then(setBookmarks).catch(console.error);
    getMyRegistrations().then((regs) => setRegistrations(regs.map((r) => r.event_id))).catch(console.error);
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

  const matchesFilters = (e: Event) => {
    const matchSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.tags.some((t) => t.includes(search.toLowerCase())) ||
      e.venue.toLowerCase().includes(search.toLowerCase());
    const matchCat = category === "all" || e.category === category;
    const matchFee = feeFilter === "all" || (feeFilter === "free" ? e.registrationFee === 0 : e.registrationFee > 0);
    return matchSearch && matchCat && matchFee;
  };

  const sortFn = (a: Event, b: Event) => {
    if (sort === "date") return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sort === "trending") return b.views - a.views;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  };

  const upcoming = events.filter((e) => !isEventPast(e) && matchesFilters(e)).sort(sortFn);
  const past = events.filter((e) => isEventPast(e) && matchesFilters(e))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // most recent past first

  const allFiltered = [...upcoming, ...past];

  // Calendar — show all events (upcoming + past) for the month
  const monthDays = eachDayOfInterval({ start: startOfMonth(calMonth), end: endOfMonth(calMonth) });
  const startDow = startOfMonth(calMonth).getDay();

  const EventGrid = ({ events }: { events: Event[] }) => (
    <div className={view === "grid" ? "grid sm:grid-cols-2 lg:grid-cols-3 gap-5" : "space-y-3"}>
      {events.map((event) => (
        <EventCard
          key={event.id}
          event={event}
          basePath="student"
          isBookmarked={bookmarks.includes(event.id)}
          isRegistered={registrations.includes(event.id)}
          onBookmark={toggleBookmark}
          layout={view === "list" ? "list" : "grid"}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Discover Events</h1>
        <p className="text-gray-500 text-sm mt-1">
          {upcoming.length} upcoming · {past.length} past
        </p>
      </div>

      {/* Filters bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search events, tags, venues..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as "all" | Category)}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select
            value={feeFilter}
            onChange={(e) => setFeeFilter(e.target.value as "all" | "free" | "paid")}
            className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring w-full sm:w-auto"
          >
            <option value="all">Free &amp; Paid</option>
            <option value="free">Free Only</option>
            <option value="paid">Paid Only</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Sort:</span>
            <div className="flex gap-1">
              {(["date", "trending", "newest"] as SortMode[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg font-medium transition-colors capitalize ${
                    sort === s ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {(["grid", "list", "calendar"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewAndUrl(v)}
                className={`p-1.5 rounded-lg transition-colors ${view === v ? "bg-indigo-600 text-white" : "text-gray-400 hover:bg-gray-100"} ${v === "grid" ? "hidden sm:flex" : "flex"}`}
                title={v.charAt(0).toUpperCase() + v.slice(1)}
              >
                {v === "grid" && <LayoutGrid className="w-4 h-4" />}
                {v === "list" && <List className="w-4 h-4" />}
                {v === "calendar" && (
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={2} />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth={2} />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Category chips — sticky below the top nav */}
      <div className="sticky top-14 sm:top-16 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 bg-gray-50 pt-2 pb-2 flex gap-2 overflow-x-auto scrollbar-hide border-b border-gray-100">
        {[{ value: "all", label: "All" }, ...CATEGORIES].map((c) => (
          <button
            key={c.value}
            onClick={() => setCategory(c.value as "all" | Category)}
            className={`shrink-0 text-xs font-medium px-4 py-2 rounded-full border transition-colors ${
              category === c.value
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white text-gray-600 border-gray-200 hover:border-indigo-300"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Calendar view */}
      {view === "calendar" && (
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          {/* Month nav */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-gray-900">{format(calMonth, "MMMM yyyy")}</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => setCalMonth((m) => subMonths(m, 1))} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setCalMonth(new Date())} className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                Today
              </button>
              <button onClick={() => setCalMonth((m) => addMonths(m, 1))} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Day headers — weekends highlighted */}
          <div className="grid grid-cols-7 mb-1">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d, i) => (
              <div key={d} className={`text-center text-xs font-semibold py-2 ${i === 0 || i === 6 ? "text-indigo-400" : "text-gray-400"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-xl overflow-hidden border border-gray-100">
            {Array.from({ length: startDow }).map((_, i) => (
              <div key={`empty-${i}`} className="bg-gray-50 min-h-[72px]" />
            ))}
            {monthDays.map((day) => {
              const dayEvents = allFiltered.filter((e) => isSameDay(parseISO(e.date), day));
              const isWeekend = day.getDay() === 0 || day.getDay() === 6;
              const todayDate = isToday(day);
              const categoryColors: Record<string, string> = {
                workshop: "bg-blue-500", seminar: "bg-purple-500", competition: "bg-orange-500",
                cultural: "bg-pink-500", sports: "bg-green-500", "guest-lecture": "bg-teal-500",
                hackathon: "bg-indigo-500", other: "bg-gray-400",
              };
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => dayEvents.length > 0 && router.push(`/student/events/${dayEvents[0].id}?from=calendar`)}
                  className={`min-h-[72px] p-2 text-left transition-colors flex flex-col
                    ${isWeekend ? "bg-indigo-50/40" : "bg-white"}
                    ${dayEvents.length > 0 ? "hover:bg-indigo-50 cursor-pointer" : "cursor-default"}
                  `}
                >
                  {/* Day number */}
                  <span className={`text-xs font-semibold w-6 h-6 flex items-center justify-center rounded-full mb-1
                    ${todayDate ? "bg-indigo-600 text-white" : isWeekend ? "text-indigo-500" : "text-gray-500"}
                  `}>
                    {format(day, "d")}
                  </span>

                  {/* Category dots */}
                  {dayEvents.length > 0 && (
                    <div className="flex flex-wrap gap-0.5 mt-auto">
                      {dayEvents.slice(0, 4).map((e) => (
                        <span
                          key={e.id}
                          className={`w-2 h-2 rounded-full ${isEventPast(e) ? "bg-gray-300" : categoryColors[e.category] ?? "bg-gray-400"}`}
                          title={e.title}
                        />
                      ))}
                      {dayEvents.length > 4 && (
                        <span className="text-[10px] text-indigo-500 font-bold leading-none self-center">+{dayEvents.length - 4}</span>
                      )}
                    </div>
                  )}

                  {/* Show event title if only 1 event */}
                  {dayEvents.length === 1 && (
                    <span className="text-[10px] text-gray-500 truncate w-full leading-tight mt-0.5">{dayEvents[0].title}</span>
                  )}
                  {dayEvents.length > 1 && (
                    <span className="text-[10px] text-indigo-500 font-medium mt-0.5">{dayEvents.length} events</span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-100">
            {[
              { label: "Workshop", color: "bg-blue-500" },
              { label: "Cultural", color: "bg-pink-500" },
              { label: "Sports", color: "bg-green-500" },
              { label: "Hackathon", color: "bg-indigo-500" },
              { label: "Competition", color: "bg-orange-500" },
              { label: "Seminar", color: "bg-purple-500" },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${l.color}`} />
                <span className="text-xs text-gray-400">{l.label}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-xs text-gray-400">Past</span>
            </div>
          </div>
        </div>
      )}

      {/* Grid / List views */}
      {view !== "calendar" && (
        <div className="space-y-8">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Events</h2>
                <span className="bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                  {upcoming.length}
                </span>
              </div>
              <EventGrid events={upcoming} />
            </div>
          )}

          {upcoming.length === 0 && past.length === 0 && (
            <div className="text-center py-16 text-gray-400">No events match your filters.</div>
          )}

          {/* Past events collapsible section */}
          {past.length > 0 && (
            <div>
              <button
                onClick={() => setShowPast(!showPast)}
                className="flex items-center gap-3 mb-4 group w-full text-left"
              >
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 w-8 bg-gray-300" />
                  <span className="text-base font-semibold text-gray-500 group-hover:text-gray-700 transition-colors">
                    Past Events
                  </span>
                  <span className="bg-gray-200 text-gray-600 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                    {past.length}
                  </span>
                </div>
                <div className="flex-1 h-px bg-gray-200" />
                <div className="text-gray-400 group-hover:text-gray-600 transition-colors">
                  {showPast
                    ? <ChevronUp className="w-4 h-4" />
                    : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showPast && (
                <div className="opacity-75">
                  <EventGrid events={past} />
                </div>
              )}

              {!showPast && (
                <button
                  onClick={() => setShowPast(true)}
                  className="w-full py-3 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-gray-400 hover:text-gray-600 transition-colors"
                >
                  Show {past.length} past event{past.length !== 1 ? "s" : ""}
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
