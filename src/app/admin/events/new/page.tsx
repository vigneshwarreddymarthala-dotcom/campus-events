"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { type Event } from "@/lib/mock-data";
import { createEvent } from "@/lib/db";
import EventForm from "@/components/shared/EventForm";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewEventPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (data: Partial<Event>) => {
    setSaving(true);
    const base = {
      title: data.title!,
      description: data.description!,
      date: data.date!,
      end_date: data.endDate ?? null,
      time: data.time!,
      end_time: null,
      venue: data.venue!,
      category: data.category!,
      status: data.status ?? "upcoming",
      capacity: data.capacity!,
      registration_fee: data.registrationFee ?? 0,
      organizer_name: data.organizer!,
      organizer_email: data.contactEmail!,
      organizer_department: "",
      tags: data.tags ?? [],
      banner_image: data.bannerImage ?? "",
      requirements: [],
      created_by: null,
    };
    try {
      await createEvent({ ...base, banner_link: data.bannerLink || null, ticket_url: data.ticketUrl || null });
      router.push("/admin/events");
    } catch {
      try {
        // Retry without optional columns in case they haven't been added to the DB yet
        await createEvent(base);
        router.push("/admin/events");
      } catch (err) {
        console.error(err);
        setSaving(false);
      }
    }
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
      <EventForm submitLabel={saving ? "Publishing…" : "Publish Event"} onSubmit={handleSubmit} />
    </div>
  );
}
