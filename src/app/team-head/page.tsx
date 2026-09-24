"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { type Event } from "@/lib/mock-data";
import { createEvent, getMyEventId } from "@/lib/db";
import EventForm from "@/components/shared/EventForm";
import EventManagementPanel from "@/components/shared/EventManagementPanel";

export default function TeamHeadPage() {
  const { user } = useAuth();
  const [eventId, setEventId] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    if (!user) return;
    const id = await getMyEventId(user.id).catch(() => null);
    setEventId(id);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  if (!user || eventId === undefined) {
    return <div className="text-center py-20 text-gray-400">Loading...</div>;
  }

  if (eventId) {
    return <EventManagementPanel id={eventId} afterSave={load} />;
  }

  const handleSubmit = async (data: Partial<Event>) => {
    setSaving(true);
    setError("");
    const base = {
      title: data.title!,
      description: data.description!,
      date: data.date!,
      end_date: data.endDate || null,
      time: data.time!,
      end_time: null,
      venue: data.venue!,
      category: data.category!,
      status: data.publishAt ? "scheduled" : ((new Date(`${data.endDate || data.date}T${data.time}:00`) < new Date()) ? "completed" : "upcoming"),
      publish_at: data.publishAt ? new Date(data.publishAt).toISOString() : null,
      capacity: data.capacity!,
      registration_fee: data.registrationFee ?? 0,
      organizer_name: data.organizer!,
      organizer_email: data.contactEmail!,
      organizer_department: "",
      tags: data.tags ?? [],
      banner_image: data.bannerImage ?? "",
      requirements: [],
      created_by: user.id,
    };
    try {
      await createEvent({ ...base, banner_link: data.bannerLink || null, ticket_url: data.ticketUrl || null });
      await load();
    } catch {
      try {
        await createEvent(base);
        await load();
      } catch (err: unknown) {
        console.error(err);
        setError(err instanceof Error ? err.message : "Failed to create event.");
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create your event</h1>
        <p className="text-gray-500 text-sm mt-1">
          You can create and manage one event — fill in the details below to get started.
        </p>
      </div>
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">{error}</div>
      )}
      <EventForm submitLabel={saving ? "Publishing…" : "Publish Event"} onSubmit={handleSubmit} />
    </div>
  );
}
