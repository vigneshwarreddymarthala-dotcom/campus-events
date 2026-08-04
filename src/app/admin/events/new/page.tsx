"use client";

import { useRouter } from "next/navigation";
import EventForm from "@/components/shared/EventForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();

  const handleSubmit = (data: unknown) => {
    console.log("New event data:", data);
    // In production this would POST to the API
    router.push("/admin/events");
  };

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Events
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Create New Event</h1>
        <p className="text-gray-500 text-sm mt-1">Fill in the details below to post a new event for students.</p>
      </div>
      <EventForm submitLabel="Publish Event" onSubmit={handleSubmit} />
    </div>
  );
}
