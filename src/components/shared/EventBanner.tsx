"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Maximize2, X } from "lucide-react";
import { EventImage, isHttpUrl } from "@/components/shared/EventImage";

// Full-screen viewer: shows the whole picture, closes with the X, a tap outside the picture, or Esc.
export function ImageLightbox({ src, alt, onClose }: { src: string; alt: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-3 sm:p-6"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close image"
        className="absolute top-3 right-3 sm:top-5 sm:right-5 w-11 h-11 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur"
      >
        <X className="w-6 h-6" />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="absolute bottom-4 left-0 right-0 text-center text-xs text-white/60 pointer-events-none">Tap outside the picture to close</p>
    </div>
  );
}

// A banner that always shows the whole picture, fits any screen, and opens full screen when tapped.
// `children` are overlays (badges) drawn on top.
export function EventBanner({ src, alt, className = "", children }: { src?: string | null; alt: string; className?: string; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  const canOpen = isHttpUrl(src);
  return (
    <>
      <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
        <EventImage src={src} alt={alt} fit="contain" className="w-full h-full" />
        {canOpen && (
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open image full screen"
            className="absolute inset-0 w-full h-full cursor-zoom-in focus-visible:outline-2 focus-visible:outline-indigo-500"
          />
        )}
        {children}
        {canOpen && (
          <span className="pointer-events-none absolute bottom-3 right-3 inline-flex items-center gap-1.5 bg-black/60 text-white text-xs font-medium px-2.5 py-1.5 rounded-full backdrop-blur">
            <Maximize2 className="w-3.5 h-3.5" /> Tap to enlarge
          </span>
        )}
      </div>
      {open && canOpen && <ImageLightbox src={src!.trim()} alt={alt} onClose={() => setOpen(false)} />}
    </>
  );
}
