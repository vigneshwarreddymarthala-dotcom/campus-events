"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Event, CATEGORIES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Plus } from "lucide-react";

type Props = {
  initial?: Partial<Event>;
  onSubmit: (data: Partial<Event>) => void;
  submitLabel: string;
};

export default function EventForm({ initial, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const [form, setForm] = useState({
    title: initial?.title ?? "",
    category: initial?.category ?? "workshop",
    description: initial?.description ?? "",
    date: initial?.date ?? "",
    endDate: initial?.endDate ?? "",
    time: initial?.time ?? "09:00",
    venue: initial?.venue ?? "",
    mapLink: initial?.mapLink ?? "",
    organizer: initial?.organizer ?? "",
    contactEmail: initial?.contactEmail ?? "",
    registrationDeadline: initial?.registrationDeadline ?? "",
    capacity: initial?.capacity ?? 100,
    registrationFee: initial?.registrationFee ?? 0,
    eligibility: initial?.eligibility ?? "Open to all",
    tags: initial?.tags ?? ([] as string[]),
    status: initial?.status ?? "upcoming",
    bannerImage: initial?.bannerImage ?? "",
  });
  const [tagInput, setTagInput] = useState("");

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => set("tags", form.tags.filter((t) => t !== tag));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form as Partial<Event>);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main fields */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4 sm:p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Basic Information</h2>

            <div>
              <Label htmlFor="title">Event Title *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="e.g. National Hackathon 2026"
                required
                className="mt-1"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => set("category", e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  required
                >
                  {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) => set("status", e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  {["upcoming", "ongoing", "completed", "cancelled", "postponed"].map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Describe the event, what attendees can expect, prizes, etc."
                rows={5}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="banner">Banner Image URL</Label>
              <Input
                id="banner"
                value={form.bannerImage}
                onChange={(e) => set("bannerImage", e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="mt-1"
              />
              {form.bannerImage && (
                <img
                  src={form.bannerImage}
                  alt="Banner preview"
                  className="mt-2 w-full h-36 object-cover rounded-lg border border-gray-200"
                />
              )}
            </div>
          </Card>

          <Card className="p-4 sm:p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Date, Time &amp; Venue</h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="date">Start Date *</Label>
                <Input type="date" id="date" value={form.date} onChange={(e) => set("date", e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input type="date" id="endDate" value={form.endDate} onChange={(e) => set("endDate", e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="time">Start Time *</Label>
                <Input type="time" id="time" value={form.time} onChange={(e) => set("time", e.target.value)} required className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="venue">Venue *</Label>
              <Input id="venue" value={form.venue} onChange={(e) => set("venue", e.target.value)} placeholder="Main Auditorium, Block A" required className="mt-1" />
            </div>

            <div>
              <Label htmlFor="mapLink">Map / Location Link</Label>
              <Input id="mapLink" value={form.mapLink} onChange={(e) => set("mapLink", e.target.value)} placeholder="https://maps.google.com/..." className="mt-1" />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 space-y-4">
            <h2 className="font-semibold text-gray-900">Tags</h2>
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag (e.g. coding)"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {form.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 text-sm px-3 py-1 rounded-full">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                </span>
              ))}
            </div>
          </Card>
        </div>

        {/* Side panel */}
        <div className="space-y-6">
          <Card className="p-4 sm:p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Registration</h2>

            <div>
              <Label htmlFor="deadline">Registration Deadline *</Label>
              <Input type="date" id="deadline" value={form.registrationDeadline} onChange={(e) => set("registrationDeadline", e.target.value)} required className="mt-1" />
            </div>

            <div>
              <Label htmlFor="capacity">Capacity (max. participants) *</Label>
              <Input
                id="capacity"
                type="number"
                min={1}
                value={form.capacity}
                onChange={(e) => set("capacity", parseInt(e.target.value))}
                required
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="fee">Registration Fee (₹)</Label>
              <Input
                id="fee"
                type="number"
                min={0}
                value={form.registrationFee}
                onChange={(e) => set("registrationFee", parseInt(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-gray-400 mt-1">Set to 0 for free events</p>
            </div>

            <div>
              <Label htmlFor="eligibility">Eligibility</Label>
              <Input
                id="eligibility"
                value={form.eligibility}
                onChange={(e) => set("eligibility", e.target.value)}
                placeholder="e.g. 3rd and 4th year, CS/IT"
                className="mt-1"
              />
            </div>
          </Card>

          <Card className="p-4 sm:p-6 space-y-5">
            <h2 className="font-semibold text-gray-900">Organizer</h2>

            <div>
              <Label htmlFor="organizer">Organizer Name *</Label>
              <Input id="organizer" value={form.organizer} onChange={(e) => set("organizer", e.target.value)} required className="mt-1" />
            </div>

            <div>
              <Label htmlFor="contactEmail">Contact Email *</Label>
              <Input id="contactEmail" type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} required className="mt-1" />
            </div>
          </Card>

          <div className="flex gap-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => router.back()}>
              Cancel
            </Button>
            <Button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700">
              {submitLabel}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
