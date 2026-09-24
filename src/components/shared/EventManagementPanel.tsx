"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { type Event } from "@/lib/mock-data";
import { getAdaptedEvent, updateEvent } from "@/lib/db";
import EventForm from "@/components/shared/EventForm";
import { ArrowLeft, Users, Star, QrCode, Activity, Edit3, X } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import QRCode from "react-qr-code";
import RegistrantsTab from "@/app/admin/events/[id]/RegistrantsTab";
import SurveysTab from "@/app/admin/events/[id]/SurveysTab";

export default function EventManagementPanel({
  id, backHref, afterSave,
}: {
  id: string;
  backHref?: string;
  afterSave?: () => void;
}) {
  const router = useRouter();
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    getAdaptedEvent(id).then(setEvent).catch(() => setEvent(null));
  }, [id]);

  if (event === undefined) return <div className="text-center py-20 text-gray-400">Loading...</div>;

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Event not found.</p>
        {backHref && <Link href={backHref} className="text-indigo-600 hover:underline mt-2 inline-block">Back to Events</Link>}
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
      status: data.publishAt ? "scheduled" : ((new Date(`${data.endDate || data.date}T${data.time}:00`) < new Date()) ? "completed" : "upcoming"),
      publish_at: data.publishAt ? new Date(data.publishAt).toISOString() : null,
      capacity: data.capacity,
      registration_fee: data.registrationFee,
      organizer_name: data.organizer,
      organizer_email: data.contactEmail,
      tags: data.tags,
      banner_image: data.bannerImage,
    };
    try {
      await updateEvent(id, { ...base, banner_link: data.bannerLink || null, ticket_url: data.ticketUrl || null });
      afterSave ? afterSave() : router.push(backHref ?? "/admin/events");
    } catch {
      try {
        await updateEvent(id, base);
        afterSave ? afterSave() : router.push(backHref ?? "/admin/events");
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
          {backHref && (
            <Link href={backHref} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-4">
              <ArrowLeft className="w-4 h-4" /> Back to Events
            </Link>
          )}
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{event.title}</h1>
          <p className="text-gray-500 text-sm mt-1 truncate max-w-[300px] sm:max-w-none">
            {event.date} • {event.time} • {event.venue}
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6 bg-gray-100/50 p-1 rounded-xl flex items-center gap-1 w-fit flex-wrap">
          <TabsList className="bg-transparent p-0 h-auto m-0 gap-1 flex-wrap">
            <TabsTrigger value="overview" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Activity className="w-4 h-4 mr-2" /> Overview
            </TabsTrigger>
          </TabsList>

          <button
            type="button"
            onClick={(e) => { e.preventDefault(); setShowQR(true); }}
            className="flex items-center rounded-lg px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors"
          >
            <QrCode className="w-4 h-4 mr-2" /> QR Check-in
          </button>

          <TabsList className="bg-transparent p-0 h-auto m-0 gap-1 flex-wrap">
            <TabsTrigger value="attendees" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Users className="w-4 h-4 mr-2" /> Attendees
            </TabsTrigger>
            <TabsTrigger value="surveys" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Star className="w-4 h-4 mr-2" /> Surveys
            </TabsTrigger>
            <TabsTrigger value="edit" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              <Edit3 className="w-4 h-4 mr-2" /> Edit Details
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{event.registrations} <span className="text-sm font-normal text-gray-500">/ {event.capacity}</span></p>
                <p className="text-sm text-gray-500">Total Registered</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-6 flex items-center gap-4 cursor-pointer hover:border-indigo-200 transition-colors" onClick={() => setActiveTab("surveys")}>
              <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center text-yellow-600">
                <Star className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">Surveys & Feedback</p>
                <p className="text-sm text-gray-500">View responses</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-lg mb-4">Event Description</h2>
            <div className="prose prose-sm max-w-none text-gray-600" dangerouslySetInnerHTML={{ __html: event.description }} />
          </div>
        </TabsContent>

        <TabsContent value="attendees">
           <div className="bg-white p-6 rounded-2xl border border-gray-200">
             <RegistrantsTab id={id} />
           </div>
        </TabsContent>

        <TabsContent value="surveys">
           <div className="bg-white p-6 rounded-2xl border border-gray-200">
             <SurveysTab id={id} />
           </div>
        </TabsContent>

        <TabsContent value="edit">
           <div className="bg-white p-6 rounded-2xl border border-gray-200">
            <EventForm
              initial={event}
              submitLabel={saving ? "Saving…" : "Save Changes"}
              onSubmit={handleSubmit}
            />
           </div>
        </TabsContent>
      </Tabs>
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">QR Check-in</h3>
              <button onClick={() => setShowQR(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-8 flex flex-col items-center">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <QRCode
                  value={`https://campus-events-peach.vercel.app/attend/${id}`}
                  size={240}
                  level="H"
                />
              </div>
              <p className="text-gray-900 font-bold text-lg text-center">{event.title}</p>
              <p className="text-gray-500 text-sm text-center mt-2 px-4">
                Students can scan this code to mark their attendance.
              </p>
            </div>
            <div className="bg-gray-50 p-6 flex gap-3">
              <button
                onClick={() => setShowQR(false)}
                className="w-full bg-indigo-600 text-white py-2.5 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
