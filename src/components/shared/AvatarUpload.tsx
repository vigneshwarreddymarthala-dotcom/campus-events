"use client";

import { useState } from "react";
import { Camera, Loader2 } from "lucide-react";

type Props = {
  userId: string;
  initials: string;
  onError?: (message: string) => void;
};

const BUCKET_URL = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars`;

export function AvatarUpload({ userId, initials, onError }: Props) {
  const [version, setVersion] = useState(0);
  const [hasImage, setHasImage] = useState(true);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const body = new FormData();
    body.append("file", file);
    body.append("kind", "avatar");
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Upload failed.");
      setHasImage(true);
      setVersion(Date.now());
    } catch (err) {
      onError?.(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative w-16 h-16 shrink-0">
      <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center overflow-hidden">
        {hasImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`${BUCKET_URL}/${userId}${version ? `?v=${version}` : ""}`}
            alt="Profile picture"
            className="w-full h-full object-cover"
            onError={() => setHasImage(false)}
          />
        ) : (
          <span className="text-2xl font-bold text-indigo-700">{initials}</span>
        )}
      </div>
      <label
        className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 shadow"
        title="Change profile picture"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          onChange={handleFile}
          disabled={uploading}
        />
      </label>
    </div>
  );
}
