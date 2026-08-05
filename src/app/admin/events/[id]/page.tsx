"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type Event } from "@/lib/mock-data";
import { getAdaptedEvent, updateEvent } from "@/lib/db";
import EventForm from "@/components/shared/EventForm";
import { ArrowLeft, Users, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditEventPage({ params }: PageProps<"/admin/events/[id]">) {
  const { id } = use(params);
  const router = useRouter();
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getAdaptedEvent(id).then(setEvent).catch(() => setEvent(null));
  }, [id]);

  if (event === undefined) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Event not found.</p>
        <Link href="/admin/events" className="text-indigo-600 hover:underline mt-2 inline-block">Back to Events</Link>
      </div>
    );
  }

  const handleSubmit = async (data: Partial<Event>) => {
    setSaving(true);
    const base = {
      title: data.title,
      description: data.description,
      date: data.date,
      end_date: data.endDate ?? null,
      time: data.time,
      venue: data.venue,
      category: data.category,
      status: data.status,
      capacity: data.capacity,
      registration_fee: data.registrationFee,
      organizer_name: data.organizer,
      organizer_email: data.contactEmail,
      tags: data.tags,
      banner_image: data.bannerImage,
    };
    try {
      await updateEvent(id, { ...base, banner_link: data.bannerLink || null, ticket_url: data.ticketUrl || null });
      router.push("/admin/events");
    } catch {
      try {
        await updateEvent(id, base);
        router.push("/admin/events");
      } catch (err) {
        console.error(err);
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Link href="/admin/events" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Events
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Edit Event</h1>
          <p className="text-gray-500 text-sm mt-1 truncate max-w-[200px] sm:max-w-none">{event.title}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Link href={`/admin/events/${id}/surveys`}>
            <Button variant="outline" className="gap-1.5 px-2.5 sm:px-4">
              <Star className="w-4 h-4" />
              <span className="hidden sm:inline">Surveys</span>
            </Button>
          </Link>
          <Link href={`/admin/events/${id}/registrants`}>
            <Button variant="outline" className="gap-1.5 px-2.5 sm:px-4">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">Registrants ({event.registrations})</span>
              <span className="sm:hidden">{event.registrations}</span>
            </Button>
          </Link>
        </div>
      </div>
      <EventForm
        initial={event}
        submitLabel={saving ? "Saving…" : "Save Changes"}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
