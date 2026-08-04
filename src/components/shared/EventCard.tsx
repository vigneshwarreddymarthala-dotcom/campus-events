"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Event, CATEGORY_COLORS } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Bookmark, BookmarkCheck, Share2 } from "lucide-react";

type Props = {
  event: Event;
  basePath: "admin" | "student";
  isBookmarked?: boolean;
  isRegistered?: boolean;
  onBookmark?: (id: string) => void;
};

export default function EventCard({ event, basePath, isBookmarked, isRegistered, onBookmark }: Props) {
  const fillPct = Math.round((event.registrations / event.capacity) * 100);
  const isFull = event.registrations >= event.capacity;

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(window.location.origin + `/${basePath}/events/${event.id}`);
  };

  return (
    <Link href={`/${basePath}/events/${event.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-indigo-200 transition-all">
        {/* Banner */}
        <div className="relative h-44 bg-gray-100 overflow-hidden">
          <img
            src={event.bannerImage}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-3 left-3">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${CATEGORY_COLORS[event.category]}`}>
              {event.category.replace("-", " ")}
            </span>
          </div>
          {event.registrationFee === 0 ? (
            <div className="absolute top-3 right-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              FREE
            </div>
          ) : (
            <div className="absolute top-3 right-3 bg-gray-900/80 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              ₹{event.registrationFee}
            </div>
          )}
          {event.status !== "upcoming" && (
            <div className={`absolute inset-0 flex items-center justify-center bg-black/40`}>
              <span className="bg-white text-gray-800 font-bold text-sm px-4 py-1.5 rounded-full capitalize">
                {event.status}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 text-base leading-snug group-hover:text-indigo-700 transition-colors line-clamp-2 mb-2">
            {event.title}
          </h3>

          <div className="space-y-1.5 mb-3">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Calendar className="w-3.5 h-3.5 shrink-0" />
              <span>
                {format(new Date(event.date), "EEE, MMM d, yyyy")}
                {event.endDate && ` – ${format(new Date(event.endDate), "MMM d")}`}
                {" "}at {event.time}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <MapPin className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{event.venue}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>{event.registrations}/{event.capacity} registered</span>
              {isFull && <Badge className="ml-1 text-xs bg-red-100 text-red-700 border-0">Full</Badge>}
            </div>
          </div>

          {/* Fill bar */}
          <div className="h-1.5 bg-gray-100 rounded-full mb-3">
            <div
              className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-red-400" : fillPct >= 70 ? "bg-yellow-400" : "bg-indigo-400"}`}
              style={{ width: `${Math.min(fillPct, 100)}%` }}
            />
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex gap-1.5 flex-wrap">
              {event.tags.slice(0, 2).map((tag) => (
                <span key={tag} className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  #{tag}
                </span>
              ))}
            </div>
            <div className="flex items-center gap-1">
              {isRegistered && (
                <Badge className="bg-green-100 text-green-700 border-0 text-xs mr-1">Registered</Badge>
              )}
              <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleShare(e); }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                title="Copy link"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {basePath === "student" && onBookmark && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onBookmark(event.id); }}
                  className={`p-1.5 rounded-lg hover:bg-indigo-50 transition-colors ${isBookmarked ? "text-indigo-600" : "text-gray-400 hover:text-indigo-600"}`}
                  title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                >
                  {isBookmarked ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
