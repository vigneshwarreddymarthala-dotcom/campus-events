"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Event, CATEGORIES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { X, Plus, Upload, Link as LinkIcon, Loader2, ImageDown } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

type BannerMode = "upload" | "url" | "instagram";

type Props = {
  initial?: Partial<Event>;
  onSubmit: (data: Partial<Event>) => void;
  submitLabel: string;
};

export default function EventForm({ initial, onSubmit, submitLabel }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    bannerLink: initial?.bannerLink ?? "",
    ticketUrl: initial?.ticketUrl ?? "",
  });
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [bannerMode, setBannerMode] = useState<BannerMode>("upload");
  const [instagramUrl, setInstagramUrl] = useState("");

  const set = (key: string, value: unknown) => setForm((prev) => ({ ...prev, [key]: value }));

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) {
      set("tags", [...form.tags, t]);
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => set("tags", form.tags.filter((t) => t !== tag));

  const uploadFile = async (file: File): Promise<boolean> => {
    setUploading(true);
    setUploadError("");
    try {
      const supabase = createClient();
      const ext = file.type.split("/")[1]?.split("+")[0] ?? "jpg";
      const path = `banners/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("event-banners").upload(path, file, { upsert: false });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("event-banners").getPublicUrl(path);
      set("bannerImage", publicUrl);
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadError(
        msg.includes("Bucket not found")
          ? "Storage bucket not set up yet — using direct image URL."
          : msg
      );
      return false;
    } finally {
      setUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    e.preventDefault();
    setBannerMode("upload");
    await uploadFile(file);
  };

  const [instagramBlocked, setInstagramBlocked] = useState(false);

  const importFromInstagram = async () => {
    if (!instagramUrl.trim()) return;
    setUploading(true);
    setUploadError("");
    setInstagramBlocked(false);
    try {
      const encodedUrl = encodeURIComponent(instagramUrl.trim());

      // Step 1: get the CDN URL as JSON — reliable fallback regardless of Supabase status
      const jsonRes = await fetch(`/api/instagram-image?url=${encodedUrl}&mode=json`);
      const json = await jsonRes.json();

      if (json.error === "blocked" || jsonRes.status === 403) {
        setInstagramBlocked(true);
        return;
      }
      if (!json.imageUrl) {
        setUploadError(json.message ?? "Could not import from Instagram.");
        return;
      }
      const cdnUrl: string = json.imageUrl;

      // Step 2: try to proxy + upload to Supabase for permanent storage
      try {
        const proxyRes = await fetch(`/api/instagram-image?url=${encodedUrl}`);
        const ct = proxyRes.headers.get("content-type") ?? "";
        if (ct.startsWith("image/")) {
          const blob = await proxyRes.blob();
          const ext = ct.split("/")[1]?.split("+")[0] ?? "jpg";
          const file = new File([blob], `instagram-${Date.now()}.${ext}`, { type: ct });
          const uploaded = await uploadFile(file);
          if (uploaded) {
            set("bannerLink", instagramUrl.trim());
            return;
          }
        }
      } catch {
        // Supabase upload path failed — fall through to CDN URL
      }

      // Step 3: fallback — use CDN URL directly (works in <img> tags without CORS issues)
      set("bannerImage", cdnUrl);
      set("bannerLink", instagramUrl.trim());
      setUploadError("");
    } catch {
      setUploadError("Failed to reach Instagram. Check the URL and try again.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form as Partial<Event>);
  };

  const tabs: { id: BannerMode; label: string; icon: React.ReactNode }[] = [
    { id: "upload", label: "Upload", icon: <Upload className="w-3 h-3" /> },
    { id: "instagram", label: "Instagram", icon: <ImageDown className="w-3 h-3" /> },
    { id: "url", label: "URL", icon: <LinkIcon className="w-3 h-3" /> },
  ];

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

            {/* Banner Image */}
            <div onPaste={handlePaste}>
              <div className="flex items-center justify-between mb-2">
                <Label>Banner Image</Label>
                {/* Mode tabs */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => { setBannerMode(tab.id); setUploadError(""); }}
                      className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md transition-colors ${
                        bannerMode === tab.id
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      {tab.icon} {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Upload mode */}
              {bannerMode === "upload" && (
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl py-8 flex flex-col items-center gap-2 text-gray-400 hover:border-indigo-300 hover:text-indigo-500 transition-colors disabled:opacity-50"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span className="text-sm">Uploading…</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-6 h-6" />
                        <span className="text-sm font-medium">Click to upload · or paste (⌘V)</span>
                        <span className="text-xs">PNG, JPG, WEBP up to 10 MB</span>
                      </>
                    )}
                  </button>
                  {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
                </div>
              )}

              {/* Instagram mode */}
              {bannerMode === "instagram" && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      value={instagramUrl}
                      onChange={(e) => { setInstagramUrl(e.target.value); setInstagramBlocked(false); setUploadError(""); }}
                      placeholder="https://www.instagram.com/p/..."
                      className="flex-1"
                      disabled={uploading}
                    />
                    <Button
                      type="button"
                      onClick={importFromInstagram}
                      disabled={uploading || !instagramUrl.trim()}
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shrink-0"
                    >
                      {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                    </Button>
                  </div>

                  {!instagramBlocked && !uploadError && (
                    <p className="text-xs text-gray-400">
                      Paste the URL of any public Instagram post and click Import.
                    </p>
                  )}

                  {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}

                  {/* Fallback guide when Instagram blocks */}
                  {instagramBlocked && (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                      <p className="text-sm font-medium text-amber-800">Instagram blocked the import — use this instead:</p>
                      <ol className="text-sm text-amber-700 space-y-1 list-decimal list-inside">
                        <li>Go to the Instagram post in your browser</li>
                        <li>Right-click the photo → <strong>Copy Image</strong></li>
                        <li>
                          <button
                            type="button"
                            onClick={() => { setBannerMode("upload"); setInstagramBlocked(false); }}
                            className="underline font-medium hover:text-amber-900"
                          >
                            Switch to Upload tab
                          </button>
                          {" "}and press <strong>⌘V</strong> (or Ctrl+V)
                        </li>
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* URL mode */}
              {bannerMode === "url" && (
                <Input
                  value={form.bannerImage}
                  onChange={(e) => set("bannerImage", e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="mt-1"
                />
              )}

              {/* Preview */}
              {form.bannerImage && (
                <div className="mt-2 relative group">
                  <img
                    src={form.bannerImage}
                    alt="Banner preview"
                    className="w-full h-40 object-cover rounded-xl border border-gray-200"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-xl transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <button
                      type="button"
                      onClick={() => set("bannerImage", "")}
                      className="bg-red-500 text-white text-xs px-3 py-1.5 rounded-lg font-medium"
                    >
                      Remove
                    </button>
                  </div>
                </div>
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

            {form.registrationFee > 0 && (
              <div>
                <Label htmlFor="ticketUrl">Ticket / Payment URL</Label>
                <Input
                  id="ticketUrl"
                  value={form.ticketUrl}
                  onChange={(e) => set("ticketUrl", e.target.value)}
                  placeholder="https://tickets.example.com/..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">Students will be directed here to buy tickets</p>
              </div>
            )}

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
