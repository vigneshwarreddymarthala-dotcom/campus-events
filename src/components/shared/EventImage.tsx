"use client";

import { useState } from "react";
import { CalendarDays } from "lucide-react";

type Props = { src?: string | null; alt: string; className?: string };

const isHttpUrl = (v?: string | null): v is string => !!v && /^https?:\/\//i.test(v.trim());

// Shows the event image, or a placeholder when the URL is missing, invalid or fails to load.
export function EventImage({ src, alt, className = "" }: Props) {
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
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src.trim()} alt={alt} className={className} onError={() => setFailed(true)} />;
}
