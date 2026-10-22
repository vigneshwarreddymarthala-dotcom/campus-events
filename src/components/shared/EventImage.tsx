"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

type Props = {
  src?: string | null;
  alt: string;
  className?: string;
  // "cover" fills the box and may crop (small thumbnails).
  // "contain" shows the whole picture on a soft blurred backdrop (banners and posters).
  fit?: "cover" | "contain";
};

export const isHttpUrl = (v?: string | null): v is string => !!v && /^https?:\/\//i.test(v.trim());

// Shows the event image, or a placeholder when the URL is missing, invalid or fails to load.
export function EventImage({ src, alt, className = "", fit = "cover" }: Props) {
  const [failed, setFailed] = useState(false);
  if (!isHttpUrl(src) || failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${className} bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center`}
      >
        <CalendarDays className="w-1/3 h-1/3 max-w-10 max-h-10 text-indigo-300" />
      </div>
    );
  }
  const url = src.trim();
  if (fit === "contain") {
    return (
      <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt="" aria-hidden="true" className="absolute inset-0 w-full h-full object-cover blur-2xl scale-125 opacity-60" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={alt} className="relative w-full h-full object-contain" onError={() => setFailed(true)} />
      </div>
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={alt} className={className} onError={() => setFailed(true)} />;
}
