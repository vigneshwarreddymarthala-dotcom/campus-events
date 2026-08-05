"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getAdaptedEvent, markMyAttendance } from "@/lib/db";
import { type Event } from "@/lib/mock-data";
import { CheckCircle2, XCircle, GraduationCap, MapPin, Calendar } from "lucide-react";
import { format, parseISO } from "date-fns";

type Status = "loading" | "ready" | "marking" | "ok" | "already" | "not_registered" | "not_auth" | "error";

export default function AttendPage({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = use(params);
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [event, setEvent] = useState<Event | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  useEffect(() => {
    getAdaptedEvent(eventId).then(setEvent).catch(() => setEvent(null));
  }, [eventId]);

  useEffect(() => {
    if (authLoading || !event) return;

    if (!user) {
      router.replace(`/login?redirect=/attend/${eventId}`);
      return;
    }

    if (user.role !== "student") {
      setStatus("not_auth");
      return;
    }

    // Don't auto-mark — just show the confirm button
    setStatus("ready");
  }, [authLoading, user, event, eventId, router]);

  const handleConfirm = async () => {
    setStatus("marking");
    markMyAttendance(eventId)
      .then((result) => {
        if (result === "ok") setStatus("ok");
        else if (result === "already_marked") setStatus("already");
        else setStatus("not_registered");
      })
      .catch(() => setStatus("error"));
  };

  const content = () => {
    if (status === "loading") {
      return (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Loading event…</p>
        </div>
      );
    }

    if (status === "ready") {
      return (
        <div className="text-center space-y-5">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Check in to</h2>
            <p className="text-lg font-semibold text-indigo-700 mt-1">{event?.title}</p>
            {event && (
              <div className="mt-3 space-y-1">
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(parseISO(event.date), "EEEE, MMMM d, yyyy")} · {event.time}
                </p>
                <p className="text-sm text-gray-500 flex items-center justify-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" />
                  {event.venue}
                </p>
              </div>
            )}
          </div>
          <p className="text-sm text-gray-400">Logged in as <span className="font-medium text-gray-700">{user?.name}</span></p>
          <button
            onClick={handleConfirm}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-2xl font-bold text-lg hover:bg-indigo-700 active:scale-95 transition-all shadow-lg shadow-indigo-200"
          >
            Mark me Present ✓
          </button>
        </div>
      );
    }

    if (status === "marking") {
      return (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">Checking you in…</p>
        </div>
      );
    }

    if (status === "ok") {
      return (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">You&apos;re checked in!</h2>
            <p className="text-gray-500 mt-1">Attendance marked for</p>
            <p className="text-lg font-semibold text-indigo-700 mt-1">{event?.title}</p>
          </div>
          <button
            onClick={() => router.push("/student/my-events")}
            className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            My Events
          </button>
        </div>
      );
    }

    if (status === "already") {
      return (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-blue-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Already checked in</h2>
            <p className="text-gray-500 mt-1">Your attendance was already recorded for</p>
            <p className="text-lg font-semibold text-indigo-700 mt-1">{event?.title}</p>
          </div>
          <button
            onClick={() => router.push("/student/my-events")}
            className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            My Events
          </button>
        </div>
      );
    }

    if (status === "not_registered") {
      return (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-orange-500" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Not registered</h2>
            <p className="text-gray-500 mt-1">You are not registered for</p>
            <p className="text-lg font-semibold text-indigo-700 mt-1">{event?.title}</p>
            <p className="text-sm text-gray-400 mt-2">Please register for the event first.</p>
          </div>
          <button
            onClick={() => router.push(`/student/events/${eventId}`)}
            className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            View Event
          </button>
        </div>
      );
    }

    if (status === "not_auth") {
      return (
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <XCircle className="w-10 h-10 text-gray-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Not allowed</h2>
          <p className="text-gray-500">This check-in link is for students only.</p>
        </div>
      );
    }

    return (
      <div className="text-center space-y-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Something went wrong</h2>
        <p className="text-gray-500">Could not mark your attendance. Please try again.</p>
        <button
          onClick={() => { setStatus("ready"); }}
          className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="mb-8 flex items-center gap-2">
        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <span className="text-xl font-bold text-gray-900">CampusEvents</span>
      </div>

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 w-full max-w-sm">
        {content()}
      </div>
    </div>
  );
}
