"use client";

import { useState } from "react";
import { STUDY_PROGRAMS, STUDY_OTHER_LABEL, isPresetProgram } from "@/lib/profile-options";

const OTHER = "__other__";

type Props = {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
};

// Preset programmes plus "Other – please specify" with a free-text box.
// The stored value is the preset name or whatever the student typed.
export function StudyProgramField({ value, onChange, className = "", placeholder = "Select" }: Props) {
  const [otherPicked, setOtherPicked] = useState(false);
  const isOther = otherPicked || (value !== "" && !isPresetProgram(value));

  return (
    <div className="space-y-2">
      <select
        value={isOther ? OTHER : value}
        onChange={(e) => {
          if (e.target.value === OTHER) {
            setOtherPicked(true);
            if (isPresetProgram(value)) onChange("");
          } else {
            setOtherPicked(false);
            onChange(e.target.value);
          }
        }}
        className={className}
      >
        <option value="">{placeholder}</option>
        {STUDY_PROGRAMS.map((o) => <option key={o} value={o}>{o}</option>)}
        <option value={OTHER}>{STUDY_OTHER_LABEL}</option>
      </select>
      {isOther && (
        <input
          type="text"
          value={isPresetProgram(value) ? "" : value}
          onChange={(e) => onChange(e.target.value)}
          maxLength={100}
          placeholder="Your study programme / Dein Studiengang"
          aria-label="Other study programme"
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
      )}
    </div>
  );
}
