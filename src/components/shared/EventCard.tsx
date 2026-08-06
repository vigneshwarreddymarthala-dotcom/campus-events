"use client";

import Link from "next/link";
import { format, differenceInDays, isToday, isTomorrow } from "date-fns";
import { Event, CATEGORY_COLORS, isEventPast } from "@/lib/mock-data";
import { MapPin, Bookmark, BookmarkCheck, Users, Clock } from "lucide-react";

type Props = {
  event: Event;
  basePath: "admin" | "student";
  isBookmarked?: boolean;
  isRegistered?: boolean;
  onBookmark?: (id: string) => void;
  layout?: "grid" | "list";
};

const CATEGORY_DOT: Record<string, string> = {
  workshop:      "bg-blue-500",
  seminar:       "bg-purple-500",
  competition:   "bg-orange-500",
  cultural:      "bg-pink-500",
  sports:        "bg-green-500",
  "guest-lecture": "bg-teal-500",
  hackathon:     "bg-indigo-500",
  other:         "bg-gray-400",
};

function countdown(dateStr: string): { label: string; urgent: boolean } {
  const eventDate = new Date(dateStr);
  if (isToday(eventDate)) return { label: "Today", urgent: true };
  if (isTomorrow(eventDate)) return { label: "Tomorrow", urgent: true };
  const days = differenceInDays(eventDate, new Date());
  if (days <= 7) return { label: `${days}d away`, urgent: true };
  return { label: format(eventDate, "EEE, MMM d"), urgent: false };
}

export default function EventCard({
  event, basePath, isBookmarked, isRegistered, onBookmark, layout = "grid",
}: Props) {
  const fillPct = Math.min(Math.round((event.registrations / event.capacity) * 100), 100);
  const isFull = event.registrations >= event.capacity;
  const isPast = isEventPast(event);
  const { label: countdownLabel, urgent } = countdown(event.date);
  const spotsLeft = event.capacity - event.registrations;

  if (layout === "list") {
    return (
      <Link href={`/${basePath}/events/${event.id}`} className="block group">
        <div className="bg-white rounded-2xl border border-gray-100 flex gap-4 p-3 hover:border-indigo-200 hover:shadow-sm transition-all">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-gray-100">
            <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {isPast && <div className="absolute inset-0 bg-black/30" />}
          </div>
          <div className="flex-1 min-w-0 py-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-1.5 mb-1">
                <span className={`w-2 h-2 rounded-full shrink-0 ${CATEGORY_DOT[event.category] ?? "bg-gray-400"}`} />
                <span className="text-xs text-gray-400 capitalize">{event.category.replace("-", " ")}</span>
                {isRegistered && (
                  <span className="text-xs text-green-600 font-medium bg-green-50 px-1.5 py-0.5 rounded-full">✓ Registered</span>
                )}
              </div>
              {basePath === "student" && onBookmark && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(event.id); }}
                  className="shrink-0 p-1 text-gray-300 hover:text-indigo-500 transition-colors"
                >
                  {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-indigo-500" /> : <Bookmark className="w-4 h-4" />}
                </button>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-1 group-hover:text-indigo-700 transition-colors">
              {event.title}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                <span className={urgent && !isPast ? "text-orange-500 font-medium" : ""}>{isPast ? format(new Date(event.date), "MMM d, yyyy") : countdownLabel}</span>
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                <span className="truncate max-w-[120px]">{event.venue}</span>
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {isFull ? <span className="text-red-500 font-medium">Full</span> : <span>{event.registrations}/{event.capacity}</span>}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <div className="h-1 w-24 bg-gray-100 rounded-full">
                <div
                  className={`h-full rounded-full ${fillPct >= 90 ? "bg-red-400" : fillPct >= 70 ? "bg-amber-400" : "bg-indigo-400"}`}
                  style={{ width: `${fillPct}%` }}
                />
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${event.registrationFee === 0 ? "bg-green-50 text-green-600" : "bg-gray-100 text-gray-600"}`}>
                {event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}
              </span>
            </div>
          </div>
        </div>
      </Link>
    );
  }

  // Grid layout
  return (
    <Link href={`/${basePath}/events/${event.id}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-lg hover:shadow-indigo-50 hover:border-indigo-100 transition-all duration-200">

        {/* Banner — tall, full bleed */}
        <div className="relative h-48 bg-gray-100 overflow-hidden">
          <img
            src={event.bannerImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
            style={{ transform: undefined }}
          />

          {/* dim overlay for past events */}
          {isPast && <div className="absolute inset-0 bg-black/30" />}

          {/* Top-left: category pill */}
          <div className="absolute top-3 left-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm bg-white/80 text-gray-700`}>
              <span className={`w-1.5 h-1.5 rounded-full ${CATEGORY_DOT[event.category] ?? "bg-gray-400"}`} />
              {event.category.replace("-", " ")}
            </span>
          </div>

          {/* Top-right: bookmark */}
          {basePath === "student" && onBookmark && (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(event.id); }}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 backdrop-blur-sm flex items-center justify-center text-gray-500 hover:text-indigo-600 transition-colors shadow-sm"
            >
              {isBookmarked ? <BookmarkCheck className="w-4 h-4 text-indigo-600" /> : <Bookmark className="w-4 h-4" />}
            </button>
          )}

          {/* Bottom-left: fee badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${event.registrationFee === 0 ? "bg-green-500 text-white" : "bg-gray-900/75 text-white backdrop-blur-sm"}`}>
              {event.registrationFee === 0 ? "Free" : `₹${event.registrationFee}`}
            </span>
          </div>

          {/* Bottom-right: registered badge */}
          {isRegistered && (
            <div className="absolute bottom-3 right-3">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-600 text-white flex items-center gap-1">
                ✓ Registered
              </span>
            </div>
          )}

          {/* Past / cancelled / postponed overlay text */}
          {(isPast || event.status === "cancelled" || event.status === "postponed") && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-white/90 text-gray-700 font-bold text-sm px-4 py-1.5 rounded-full capitalize tracking-wide">
                {isPast ? "Ended" : event.status}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">

          {/* Countdown — urgent = orange */}
          {!isPast && (
            <div className={`inline-flex items-center gap-1 text-xs font-medium mb-2 ${urgent ? "text-orange-500" : "text-gray-400"}`}>
              <Clock className="w-3 h-3" />
              {countdownLabel}
            </div>
          )}

          {/* Title */}
          <h3 className="font-semibold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors mb-3">
            {event.title}
          </h3>

          {/* Meta row */}
          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              <span className="truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Users className="w-3.5 h-3.5 shrink-0 text-gray-400" />
              {isFull ? (
                <span className="text-red-500 font-medium text-xs">Event Full</span>
              ) : (
                <span>{event.registrations} going · <span className="text-gray-400">{spotsLeft} spots left</span></span>
              )}
            </div>
          </div>

          {/* Fill bar */}
          <div className="h-1 bg-gray-100 rounded-full">
            <div
              className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-red-400" : fillPct >= 70 ? "bg-amber-400" : "bg-indigo-400"}`}
              style={{ width: `${fillPct}%` }}
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
