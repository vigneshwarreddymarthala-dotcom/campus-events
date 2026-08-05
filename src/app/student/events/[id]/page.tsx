"use client";

import { use, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CATEGORY_COLORS, type Event } from "@/lib/mock-data";
import { useAuth } from "@/contexts/auth-context";
import { getAdaptedEvent, isRegisteredForEvent, getMyBookmarks, addBookmark, removeBookmark, registerForEvent, cancelRegistration, getMyEventSurvey } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { isEventPast } from "@/lib/mock-data";
import {
  ArrowLeft, Calendar, MapPin, Users, Clock, Mail,
  Bookmark, BookmarkCheck, Share2, ExternalLink, CheckCircle2,
  AlertCircle, FileText, Tag, History, Star,
} from "lucide-react";

export default function StudentEventDetailPage({ params }: PageProps<"/student/events/[id]">) {
  return (
    <Suspense>
      <StudentEventDetailPageInner params={params} />
    </Suspense>
  );
}

function StudentEventDetailPageInner({ params }: { params: PageProps<"/student/events/[id]">["params"] }) {
  const { id } = use(params);
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const fromCalendar = searchParams.get("from") === "calendar";
  const backHref = fromCalendar ? "/student/events?view=calendar" : "/student/events";
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [surveySubmitted, setSurveySubmitted] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [shareMsg, setShareMsg] = useState("");

  useEffect(() => {
    getAdaptedEvent(id).then(setEvent).catch(() => setEvent(null));
    isRegisteredForEvent(id).then(setIsRegistered).catch(console.error);
    getMyBookmarks().then((ids) => setIsBookmarked(ids.includes(id))).catch(console.error);
    getMyEventSurvey(id).then((s) => setSurveySubmitted(!!s)).catch(console.error);
  }, [id]);

  if (event === undefined) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Event not found.</p>
        <Link href="/student/events" className="text-indigo-600 hover:underline mt-2 inline-block">Browse Events</Link>
      </div>
    );
  }

  const fillPct = Math.round((event.registrations / event.capacity) * 100);
  const isFull = event.registrations >= event.capacity;
  const isPast = isEventPast(event);
  const isPastDeadline = new Date(event.registrationDeadline) < new Date();

  const handleRegister = async () => {
    if (isRegistered || !user) return;
    setRegistering(true);
    try {
      await registerForEvent(id, {
        name: user.name,
        email: user.email,
        department: user.department,
        year: user.year,
        fee: event.registrationFee,
      });
      setIsRegistered(true);
      setShowConfirm(false);
    } catch (err) {
      console.error(err);
    }
    setRegistering(false);
  };

  const handleAddToCalendar = () => {
    const start = new Date(`${event.date}T${event.time}`);
    const end = event.endDate
      ? new Date(`${event.endDate}T${event.time}`)
      : new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const fmt = (d: Date) => d.toISOString().replace(/[-:]/g, "").slice(0, 15);
    const url = new URL("https://www.google.com/calendar/render");
    url.searchParams.set("action", "TEMPLATE");
    url.searchParams.set("text", event.title);
    url.searchParams.set("dates", `${fmt(start)}/${fmt(end)}`);
    url.searchParams.set("details", event.description);
    url.searchParams.set("location", event.venue);
    window.open(url.toString(), "_blank");
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareMsg("Link copied!");
    setTimeout(() => setShareMsg(""), 2000);
  };

  const registrationButton = () => {
    if (isRegistered) return null;
    if (isPast) return <Button className="w-full" variant="outline" disabled>Event Ended</Button>;
    if (isFull) return <Button className="w-full" variant="outline" disabled>Event Full</Button>;
    if (isPastDeadline) return <Button className="w-full" variant="outline" disabled>Registration Closed</Button>;

    // Paid event with ticket URL — redirect to external purchase link
    if (event.registrationFee > 0 && event.ticketUrl) {
      return (
        <a href={event.ticketUrl} target="_blank" rel="noopener noreferrer" className="block w-full">
          <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2">
            Buy Ticket — ₹{event.registrationFee}
          </Button>
        </a>
      );
    }

    if (showConfirm) {
      return (
        <div className="border border-indigo-200 rounded-xl p-4 space-y-3 bg-indigo-50">
          <p className="text-sm font-semibold text-indigo-900">Confirm your registration</p>
          <div className="bg-white rounded-lg px-3 py-2.5 text-sm text-gray-900 font-medium border border-gray-200">
            {user?.name}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)} disabled={registering}>
              Cancel
            </Button>
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={handleRegister} disabled={registering}>
              {registering
                ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : "Confirm"}
            </Button>
          </div>
        </div>
      );
    }

    return (
      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2" onClick={() => setShowConfirm(true)}>
        {event.registrationFee === 0 ? "Register for Free" : `Register — ₹${event.registrationFee}`}
      </Button>
    );
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Back */}
      <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600">
        <ArrowLeft className="w-4 h-4" /> Back to Events
      </Link>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Banner */}
          <div className="relative rounded-2xl overflow-hidden h-64 sm:h-80 bg-gray-100">
            {event.bannerLink ? (
              <a href={event.bannerLink} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
              </a>
            ) : (
              <img src={event.bannerImage} alt={event.title} className="w-full h-full object-cover" />
            )}
            <div className="absolute top-4 left-4">
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${CATEGORY_COLORS[event.category]}`}>
                {event.category.replace("-", " ")}
              </span>
            </div>
            {event.registrationFee === 0 ? (
              <div className="absolute top-4 right-4 bg-green-500 text-white text-sm font-bold px-3 py-1 rounded-full">FREE</div>
            ) : (
              <div className="absolute top-4 right-4 bg-gray-900/80 text-white text-sm font-bold px-3 py-1 rounded-full">₹{event.registrationFee}</div>
            )}
          </div>

          {/* Past event banner */}
          {isPast && (
            <div className="flex items-center gap-3 bg-gray-100 border border-gray-200 rounded-xl px-4 py-3">
              <History className="w-5 h-5 text-gray-500 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-gray-700">This event has already taken place.</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  It ended on {format(new Date(event.endDate ?? event.date), "MMMM d, yyyy")}. Registration is no longer available.
                </p>
              </div>
            </div>
          )}

          {/* Title + actions */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">{event.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={async () => {
                  if (isBookmarked) {
                    setIsBookmarked(false);
                    await removeBookmark(id).catch(console.error);
                  } else {
                    setIsBookmarked(true);
                    await addBookmark(id).catch(console.error);
                  }
                }}
                className={`p-2 rounded-xl transition-colors ${isBookmarked ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600"}`}
              >
                {isBookmarked ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
              </button>
              <button
                onClick={handleShare}
                className="p-2 rounded-xl bg-gray-100 text-gray-500 hover:bg-indigo-50 hover:text-indigo-600 transition-colors relative"
              >
                <Share2 className="w-5 h-5" />
                {shareMsg && (
                  <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {shareMsg}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Key info grid */}
          <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
            {[
              {
                icon: Calendar,
                label: "Date",
                value: format(new Date(event.date), "EEEE, MMMM d, yyyy") +
                  (event.endDate ? ` – ${format(new Date(event.endDate), "MMMM d")}` : ""),
              },
              { icon: Clock, label: "Time", value: event.time },
              { icon: MapPin, label: "Venue", value: event.venue },
              { icon: Users, label: "Capacity", value: `${event.registrations}/${event.capacity} registered` },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3 bg-gray-50 rounded-xl p-4">
                <div className="w-9 h-9 bg-indigo-100 rounded-lg flex items-center justify-center shrink-0">
                  <item.icon className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{item.label}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Fill bar */}
          <div>
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-gray-600">Spots filled</span>
              <span className="font-medium text-gray-900">{fillPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full">
              <div
                className={`h-full rounded-full transition-all ${fillPct >= 90 ? "bg-red-400" : fillPct >= 70 ? "bg-yellow-400" : "bg-indigo-400"}`}
                style={{ width: `${Math.min(fillPct, 100)}%` }}
              />
            </div>
            {fillPct >= 80 && !isFull && (
              <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> Filling up fast — only {event.capacity - event.registrations} spots left!
              </p>
            )}
          </div>

          {/* Description */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-3">About this Event</h2>
            <p className="text-gray-600 leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>

          {/* Tags */}
          {event.tags.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <span key={tag} className="text-sm text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">#{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Attachments */}
          {event.attachments.length > 0 && (
            <div>
              <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Downloads
              </h2>
              <div className="space-y-2">
                {event.attachments.map((att) => (
                  <a
                    key={att.name}
                    href={att.url}
                    className="flex items-center gap-3 bg-gray-50 hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-xl px-4 py-3 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-800">{att.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-400 ml-auto" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar — appears below main content on mobile */}
        <div className="space-y-5 order-last lg:order-none">
          {/* Registration card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-6 space-y-4 lg:sticky lg:top-24">
            <div>
              <p className="text-sm text-gray-500 mb-1">Registration closes</p>
              <p className="font-semibold text-gray-900">
                {format(new Date(event.registrationDeadline), "MMMM d, yyyy")}
              </p>
            </div>

            {isRegistered && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                <p className="text-sm font-medium text-green-800">You&apos;re registered!</p>
              </div>
            )}

            {/* Survey button — only for past events the student registered for */}
            {isPast && isRegistered && (
              surveySubmitted ? (
                <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-2.5">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-400 shrink-0" />
                  <p className="text-sm font-medium text-yellow-800">Feedback submitted — thank you!</p>
                </div>
              ) : (
                <Link
                  href={`/student/events/${id}/survey`}
                  className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-500 text-yellow-900 font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors"
                >
                  <Star className="w-4 h-4" /> Fill Feedback Survey
                </Link>
              )
            )}

            {registrationButton()}

            <button
              onClick={handleAddToCalendar}
              className="w-full py-2 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
            >
              <Calendar className="w-4 h-4" /> Add to Calendar
            </button>

            {event.mapLink && (
              <a
                href={event.mapLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
              >
                <MapPin className="w-4 h-4" /> View on Map
              </a>
            )}
          </div>

          {/* Organizer */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
            <h3 className="font-semibold text-gray-900">Organizer</h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                {event.organizer.split(" ").map((n) => n[0]).join("").slice(0, 2)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{event.organizer}</p>
                <a href={`mailto:${event.contactEmail}`} className="text-xs text-indigo-600 flex items-center gap-1 hover:underline">
                  <Mail className="w-3 h-3" /> {event.contactEmail}
                </a>
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
            <h3 className="font-semibold text-amber-900 mb-1.5">Eligibility</h3>
            <p className="text-sm text-amber-800">{event.eligibility}</p>
          </div>
        </div>
      </div>

      {/* Mobile sticky bottom register bar */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur border-t border-gray-200 px-4 py-3 z-50">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          {!isPast && !isFull && !isPastDeadline && !isRegistered && (
            <div className="shrink-0 text-xs text-gray-500 leading-tight">
              <p className="font-medium text-gray-700">Closes</p>
              <p>{format(new Date(event.registrationDeadline), "MMM d")}</p>
            </div>
          )}
          <div className="flex-1">{registrationButton()}</div>
        </div>
      </div>
    </div>
  );
}
