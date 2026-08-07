"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  getAdaptedEvent, submitSurvey, getMyEventSurvey, isRegisteredForEvent,
  getSurveyQuestions, type DbSurveyQuestion,
} from "@/lib/db";
import { isEventPast, type Event } from "@/lib/mock-data";
import { ArrowLeft, Star, CheckCircle2, ThumbsUp, ThumbsDown } from "lucide-react";
import { format } from "date-fns";

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => onChange(n)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star className={`w-8 h-8 transition-colors ${n <= (hover || value) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 self-center text-sm text-gray-500">
            {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][value]}
          </span>
        )}
      </div>
    </div>
  );
}

function CustomQuestion({
  q, qNum, value, onChange,
}: {
  q: DbSurveyQuestion;
  qNum: number;
  value: string | number | boolean | null;
  onChange: (val: string | number | boolean) => void;
}) {
  const [hover, setHover] = useState(0);
  const label = `${qNum}. ${q.question}${q.required ? " *" : ""}`;

  if (q.type === "rating") {
    const num = Number(value ?? 0);
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => onChange(n)}
              className="p-0.5 transition-transform hover:scale-110"
            >
              <Star className={`w-8 h-8 transition-colors ${n <= (hover || num) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
            </button>
          ))}
          {num > 0 && (
            <span className="ml-2 self-center text-sm text-gray-500">
              {["", "Poor", "Fair", "Good", "Very Good", "Excellent"][num]}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (q.type === "yesno") {
    return (
      <div className="space-y-2">
        <p className="text-sm font-medium text-gray-700">{label}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onChange(true)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              value === true ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600"
            }`}
          >
            <ThumbsUp className="w-4 h-4" /> Yes
          </button>
          <button
            type="button"
            onClick={() => onChange(false)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
              value === false ? "bg-red-500 text-white border-red-500" : "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500"
            }`}
          >
            <ThumbsDown className="w-4 h-4" /> No
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <textarea
        value={(value as string) ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Your answer…"
        rows={3}
        maxLength={500}
        className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
      />
    </div>
  );
}

export default function SurveyPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [registered, setRegistered] = useState(false);
  const [alreadySubmitted, setAlreadySubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [questions, setQuestions] = useState<DbSurveyQuestion[]>([]);

  const [rating, setRating] = useState(0);
  const [orgRating, setOrgRating] = useState(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [likedMost, setLikedMost] = useState("");
  const [couldImprove, setCouldImprove] = useState("");
  const [otherFeedback, setOtherFeedback] = useState("");
  const [customAnswers, setCustomAnswers] = useState<Record<string, string | number | boolean | null>>({});
  const [error, setError] = useState("");

  useEffect(() => {
    getAdaptedEvent(id).then(setEvent).catch(() => setEvent(null));
    isRegisteredForEvent(id).then(setRegistered).catch(console.error);
    getMyEventSurvey(id).then((s) => setAlreadySubmitted(!!s)).catch(console.error);
    getSurveyQuestions(id).then(setQuestions).catch(() => setQuestions([]));
  }, [id]);

  if (event === undefined) return <div className="text-center py-20 text-gray-400">Loading…</div>;
  if (!event) return <div className="text-center py-20 text-gray-500">Event not found.</div>;

  const isPast = isEventPast(event);

  if (!isPast) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-3">
        <p className="text-gray-700 font-medium">Survey not available yet.</p>
        <p className="text-gray-500 text-sm">The survey opens after the event ends.</p>
        <button onClick={() => router.back()} className="text-indigo-600 text-sm hover:underline">Go back</button>
      </div>
    );
  }

  if (!registered) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-3">
        <p className="text-gray-700 font-medium">Survey is only for registered attendees.</p>
        <button onClick={() => router.back()} className="text-indigo-600 text-sm hover:underline">Go back</button>
      </div>
    );
  }

  if (alreadySubmitted || done) {
    return (
      <div className="max-w-xl mx-auto text-center py-20 space-y-4">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-gray-900">
          {done ? "Thank you for your feedback!" : "Survey already submitted"}
        </h2>
        <p className="text-gray-500 text-sm">Your response for <span className="font-medium">{event.title}</span> has been recorded.</p>
        <button
          onClick={() => router.push(`/student/events/${id}`)}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          Back to Event
        </button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (rating === 0) { setError("Please rate the event."); return; }
    if (orgRating === 0) { setError("Please rate the organization."); return; }
    if (recommend === null) { setError("Please answer the recommendation question."); return; }

    // Validate required custom questions
    for (const q of questions) {
      if (q.required) {
        const ans = customAnswers[q.id];
        if (ans === null || ans === undefined || ans === "") {
          setError(`Please answer: "${q.question}"`);
          return;
        }
      }
    }

    setError("");
    setSubmitting(true);
    try {
      const filteredCustom: Record<string, string | number | boolean> = {};
      for (const [k, v] of Object.entries(customAnswers)) {
        if (v !== null && v !== undefined && v !== "") filteredCustom[k] = v;
      }
      await submitSurvey(id, {
        rating,
        organization_rating: orgRating,
        would_recommend: recommend,
        liked_most: likedMost,
        could_improve: couldImprove,
        other_feedback: otherFeedback,
        custom_answers: filteredCustom,
      });
      setDone(true);
    } catch {
      setError("Failed to submit. Please try again.");
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <button
        onClick={() => router.push(`/student/events/${id}`)}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Event
      </button>

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
            <Star className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Event Feedback</h1>
            <p className="text-sm text-gray-500">{event.title} · {format(new Date(event.date), "dd MMM yyyy")}</p>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-3">Your honest feedback helps us improve future events. Takes under 2 minutes.</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-7">
        <StarRating value={rating} onChange={setRating} label="1. How would you rate the overall event? *" />
        <StarRating value={orgRating} onChange={setOrgRating} label="2. How well was the event organized? *" />

        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">3. Would you recommend this event to others? *</p>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setRecommend(true)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                recommend === true ? "bg-green-600 text-white border-green-600" : "border-gray-200 text-gray-600 hover:border-green-300 hover:text-green-600"
              }`}
            >
              <ThumbsUp className="w-4 h-4" /> Yes
            </button>
            <button
              type="button"
              onClick={() => setRecommend(false)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border text-sm font-medium transition-colors ${
                recommend === false ? "bg-red-500 text-white border-red-500" : "border-gray-200 text-gray-600 hover:border-red-300 hover:text-red-500"
              }`}
            >
              <ThumbsDown className="w-4 h-4" /> No
            </button>
          </div>
        </div>

        {[
          { label: "4. What did you like most?", value: likedMost, onChange: setLikedMost, placeholder: "Highlights, speakers, activities…" },
          { label: "5. What could be improved?", value: couldImprove, onChange: setCouldImprove, placeholder: "Venue, timing, content, communication…" },
          { label: "6. Any other feedback?", value: otherFeedback, onChange: setOtherFeedback, placeholder: "Anything else you'd like to share…" },
        ].map((f) => (
          <div key={f.label} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">{f.label}</label>
            <textarea
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              placeholder={f.placeholder}
              rows={3}
              maxLength={500}
              className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
            />
          </div>
        ))}

        {/* Custom questions */}
        {questions.length > 0 && (
          <>
            <div className="border-t border-gray-100 pt-2" />
            {questions.map((q, idx) => (
              <CustomQuestion
                key={q.id}
                q={q}
                qNum={idx + 7}
                value={customAnswers[q.id] ?? null}
                onChange={(val) => setCustomAnswers((prev) => ({ ...prev, [q.id]: val }))}
              />
            ))}
          </>
        )}

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-indigo-700 disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
        >
          {submitting
            ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Submitting…</>
            : "Submit Feedback"}
        </button>
      </div>
    </div>
  );
}
