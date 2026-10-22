"use client";

import { useState } from "react";
import { X } from "lucide-react";

export const CANCEL_REASONS = ["I am sick", "Schedule clash", "I changed my mind", "Transport problem", "Other"];

type Props = {
  open: boolean;
  mode: "seat" | "waitlist";
  eventTitle: string;
  busy: boolean;
  error: string;
  onClose: () => void;
  onConfirm: (reason: string) => void;
};

// Asks a student why they are cancelling. A reason is required for a real seat and optional for the waiting list.
export default function CancelRegistrationDialog({ open, mode, eventTitle, busy, error, onClose, onConfirm }: Props) {
  const [choice, setChoice] = useState("");
  const [other, setOther] = useState("");
  if (!open) return null;

  const required = mode === "seat";
  const reason = choice === "Other" ? other.trim() : choice;
  const ok = !required || reason.length >= 3;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-gray-900/50" role="dialog" aria-modal="true">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-gray-100">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{mode === "seat" ? "Cancel your registration?" : "Leave the waiting list?"}</h3>
            <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{eventTitle}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-full text-gray-400 hover:bg-gray-100" aria-label="Close"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm font-semibold text-gray-900">
            {required ? "Please tell us why you are cancelling *" : "Reason (optional)"}
          </p>
          <div className="flex flex-wrap gap-2">
            {CANCEL_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setChoice(choice === r ? "" : r)}
                className={`px-3.5 py-2.5 rounded-full text-sm font-medium border transition-colors ${choice === r ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50"}`}
              >
                {r}
              </button>
            ))}
          </div>
          {choice === "Other" && (
            <textarea
              value={other}
              onChange={(e) => setOther(e.target.value)}
              maxLength={300}
              rows={3}
              placeholder="Write your reason"
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
            />
          )}
          {mode === "seat" && (
            <p className="text-xs text-gray-500">Your seat goes to the next person on the waiting list. The organizer sees your reason.</p>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} disabled={busy} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50">
            Keep it
          </button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={!ok || busy}
            className="flex-1 py-3 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? "Please wait…" : mode === "seat" ? "Cancel registration" : "Leave list"}
          </button>
        </div>
      </div>
    </div>
  );
}
