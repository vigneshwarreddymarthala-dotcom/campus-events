"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/auth-context";
import { getAdaptedEvent, markMyAttendance } from "@/lib/db";
import { type Event } from "@/lib/mock-data";
import { CheckCircle2, XCircle, Clock, GraduationCap } from "lucide-react";

type Status = "loading" | "marking" | "ok" | "already" | "not_registered" | "not_auth" | "error";

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
      // Redirect to login, come back after
      router.replace(`/login?redirect=/attend/${eventId}`);
      return;
    }

    if (user.role !== "student") {
      setStatus("not_auth");
      return;
    }

    setStatus("marking");
    markMyAttendance(eventId)
      .then((result) => {
        if (result === "ok") setStatus("ok");
        else if (result === "already_marked") setStatus("already");
        else setStatus("not_registered");
      })
      .catch(() => setStatus("error"));
  }, [authLoading, user, event, eventId, router]);

  const content = () => {
    if (status === "loading" || status === "marking") {
      return (
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-600 font-medium">
            {status === "loading" ? "Loading event…" : "Checking you in…"}
          </p>
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
            className="mt-2 bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
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
            <p className="text-sm text-gray-400 mt-2">Please register for the event first to check in.</p>
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
          onClick={() => window.location.reload()}
          className="bg-indigo-600 text-white px-8 py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
        >
          Retry
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

      <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-10 w-full max-w-md">
        {content()}
      </div>

      {event && (
        <div className="mt-6 flex items-center gap-1.5 text-sm text-gray-400">
          <Clock className="w-3.5 h-3.5" />
          {event.date} · {event.venue}
        </div>
      )}
    </div>
  );
}
