"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import {
  getAdaptedEvent, getEventSurveys, getSurveyQuestions, addSurveyQuestion,
  deleteSurveyQuestion, updateSurveyQuestion, type DbSurvey, type DbSurveyQuestion,
} from "@/lib/db";
import { type Event } from "@/lib/mock-data";
import { format } from "date-fns";
import {
  ArrowLeft, Star, ThumbsUp, ThumbsDown, Download, BarChart2,
  MessageSquare, Plus, Trash2, GripVertical, Type, ToggleLeft, Settings,
} from "lucide-react";

function Stars({ value }: { value: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`w-4 h-4 ${n <= value ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`} />
      ))}
    </div>
  );
}

const TYPE_LABELS: Record<DbSurveyQuestion["type"], string> = {
  text: "Text answer",
  rating: "Star rating",
  yesno: "Yes / No",
};

const TYPE_ICONS: Record<DbSurveyQuestion["type"], React.ReactNode> = {
  text: <Type className="w-3.5 h-3.5" />,
  rating: <Star className="w-3.5 h-3.5" />,
  yesno: <ToggleLeft className="w-3.5 h-3.5" />,
};

export default function AdminSurveysPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [surveys, setSurveys] = useState<DbSurvey[]>([]);
  const [questions, setQuestions] = useState<DbSurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"questions" | "responses">("questions");

  // New question form
  const [newQ, setNewQ] = useState("");
  const [newType, setNewType] = useState<DbSurveyQuestion["type"]>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    getAdaptedEvent(id).then(setEvent).catch(() => setEvent(null));
    Promise.all([
      getEventSurveys(id).catch(() => [] as DbSurvey[]),
      getSurveyQuestions(id).catch(() => [] as DbSurveyQuestion[]),
    ]).then(([s, q]) => { setSurveys(s); setQuestions(q); setLoading(false); });
  }, [id]);

  if (event === undefined || loading) return <div className="text-center py-20 text-gray-400">Loading…</div>;
  if (!event) return <div className="text-center py-20 text-gray-500">Event not found.</div>;

  const avgRating = surveys.length
    ? (surveys.reduce((a, s) => a + s.rating, 0) / surveys.length).toFixed(1) : "—";
  const avgOrgRating = surveys.length
    ? (surveys.reduce((a, s) => a + s.organization_rating, 0) / surveys.length).toFixed(1) : "—";
  const recommendPct = surveys.length
    ? Math.round((surveys.filter((s) => s.would_recommend).length / surveys.length) * 100) : 0;

  const handleAddQuestion = async () => {
    if (!newQ.trim()) return;
    setAdding(true);
    try {
      const q = await addSurveyQuestion(id, newQ.trim(), newType, newRequired, questions.length);
      setQuestions((prev) => [...prev, q]);
      setNewQ("");
      setNewType("text");
      setNewRequired(false);
    } catch {}
    setAdding(false);
  };

  const handleDelete = async (qid: string) => {
    setDeletingId(qid);
    try {
      await deleteSurveyQuestion(qid);
      setQuestions((prev) => prev.filter((q) => q.id !== qid));
    } catch {}
    setDeletingId(null);
  };

  const handleToggleRequired = async (q: DbSurveyQuestion) => {
    setQuestions((prev) => prev.map((x) => x.id === q.id ? { ...x, required: !x.required } : x));
    await updateSurveyQuestion(q.id, { required: !q.required }).catch(() => {
      setQuestions((prev) => prev.map((x) => x.id === q.id ? { ...x, required: q.required } : x));
    });
  };

  const exportCSV = () => {
    const standardHeaders = ["Name", "Email", "Overall Rating", "Organization Rating",
      "Would Recommend", "Liked Most", "Could Improve", "Other Feedback"];
    const customHeaders = questions.map((q) => q.question);
    const headers = [...standardHeaders, ...customHeaders, "Submitted At"];
    const rows = surveys.map((s) => {
      const standard = [
        s.student_name, s.student_email, s.rating, s.organization_rating,
        s.would_recommend ? "Yes" : "No",
        `"${(s.liked_most ?? "").replace(/"/g, '""')}"`,
        `"${(s.could_improve ?? "").replace(/"/g, '""')}"`,
        `"${(s.other_feedback ?? "").replace(/"/g, '""')}"`,
      ];
      const custom = questions.map((q) => {
        const val = s.custom_answers?.[q.id] ?? "";
        return `"${String(val).replace(/"/g, '""')}"`;
      });
      return [...standard, ...custom, format(new Date(s.submitted_at), "yyyy-MM-dd HH:mm")];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.title.replace(/\s+/g, "_")}_surveys.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href={`/admin/events/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Event
        </Link>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Survey</h1>
            <p className="text-gray-500 text-sm mt-1 truncate max-w-xs sm:max-w-none">{event.title}</p>
          </div>
          {surveys.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
            >
              <Download className="w-4 h-4" /> Download CSV
            </button>
          )}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Responses", value: surveys.length, sub: "total", icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Avg Rating", value: avgRating, sub: "out of 5", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
          { label: "Avg Org Rating", value: avgOrgRating, sub: "out of 5", icon: BarChart2, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Recommend", value: surveys.length ? `${recommendPct}%` : "—", sub: "would recommend", icon: ThumbsUp, color: "text-green-600", bg: "bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        {[
          { key: "questions", label: "Form Questions", icon: Settings },
          { key: "responses", label: `Responses (${surveys.length})`, icon: MessageSquare },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as typeof tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* QUESTIONS TAB */}
      {tab === "questions" && (
        <div className="space-y-4">
          {/* Fixed questions info */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-700 mb-3">Default questions (always included)</p>
            <div className="space-y-2">
              {[
                "Overall event rating ★★★★★",
                "Organization rating ★★★★★",
                "Would you recommend this event? (Yes / No)",
                "What did you like most? (text)",
                "What could be improved? (text)",
                "Any other feedback? (text)",
              ].map((q, i) => (
                <div key={i} className="flex items-center gap-2 text-sm text-gray-500">
                  <span className="w-5 h-5 bg-gray-200 rounded-full text-xs flex items-center justify-center text-gray-500 shrink-0">{i + 1}</span>
                  {q}
                </div>
              ))}
            </div>
          </div>

          {/* Custom questions */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Custom Questions</h3>
              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">{questions.length} added</span>
            </div>

            {/* Existing questions */}
            {questions.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No custom questions yet. Add one below.</p>
            ) : (
              <div className="space-y-2">
                {questions.map((q, idx) => (
                  <div key={q.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3">
                    <GripVertical className="w-4 h-4 text-gray-300 shrink-0" />
                    <span className="w-5 h-5 bg-indigo-100 rounded-full text-xs flex items-center justify-center text-indigo-600 font-semibold shrink-0">
                      {idx + 7}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{q.question}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1 text-xs text-gray-400">
                          {TYPE_ICONS[q.type]} {TYPE_LABELS[q.type]}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleToggleRequired(q)}
                      className={`text-xs px-2 py-0.5 rounded-full font-medium border transition-colors ${
                        q.required
                          ? "bg-red-50 text-red-600 border-red-200 hover:bg-red-100"
                          : "bg-gray-100 text-gray-400 border-gray-200 hover:bg-gray-200"
                      }`}
                    >
                      {q.required ? "Required" : "Optional"}
                    </button>
                    <button
                      onClick={() => handleDelete(q.id)}
                      disabled={deletingId === q.id}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new question */}
            <div className="border-t border-gray-100 pt-4 space-y-3">
              <p className="text-sm font-semibold text-gray-700">Add a question</p>
              <textarea
                value={newQ}
                onChange={(e) => setNewQ(e.target.value)}
                placeholder="e.g. What topic would you like covered in future events?"
                rows={2}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <div className="flex items-center gap-3 flex-wrap">
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as DbSurveyQuestion["type"])}
                  className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
                >
                  <option value="text">Text answer</option>
                  <option value="rating">Star rating (1–5)</option>
                  <option value="yesno">Yes / No</option>
                </select>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={newRequired}
                    onChange={(e) => setNewRequired(e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600"
                  />
                  Required
                </label>
                <button
                  onClick={handleAddQuestion}
                  disabled={adding || !newQ.trim()}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors ml-auto"
                >
                  {adding
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Plus className="w-4 h-4" />}
                  Add Question
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* RESPONSES TAB */}
      {tab === "responses" && (
        <div className="space-y-4">
          {/* Rating distribution */}
          {surveys.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = surveys.filter((s) => s.rating === star).length;
                  const pct = surveys.length ? Math.round((count / surveys.length) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16 shrink-0">
                        <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">{star}</span>
                      </div>
                      <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-12 text-right shrink-0">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Survey list */}
          {surveys.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
              <Star className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No survey responses yet.</p>
              <p className="text-gray-400 text-sm mt-1">Responses appear here once students submit their feedback.</p>
            </div>
          ) : (
            surveys.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {s.student_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{s.student_name}</p>
                      <p className="text-xs text-gray-400">{s.student_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs text-gray-400">{format(new Date(s.submitted_at), "dd MMM yyyy, h:mm a")}</span>
                    {s.would_recommend ? (
                      <span className="flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <ThumbsUp className="w-3 h-3" /> Recommends
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-red-100 text-red-600 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <ThumbsDown className="w-3 h-3" /> Doesn&apos;t recommend
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                    <p className="text-xs text-gray-400 font-medium">Overall Rating</p>
                    <Stars value={s.rating} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3 space-y-1">
                    <p className="text-xs text-gray-400 font-medium">Organization</p>
                    <Stars value={s.organization_rating} />
                  </div>
                </div>

                {(s.liked_most || s.could_improve || s.other_feedback) && (
                  <div className="space-y-2.5">
                    {s.liked_most && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Liked most</p>
                        <p className="text-sm text-gray-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">{s.liked_most}</p>
                      </div>
                    )}
                    {s.could_improve && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Could improve</p>
                        <p className="text-sm text-gray-700 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">{s.could_improve}</p>
                      </div>
                    )}
                    {s.other_feedback && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-0.5">Other feedback</p>
                        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">{s.other_feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Custom question answers */}
                {questions.length > 0 && s.custom_answers && Object.keys(s.custom_answers).length > 0 && (
                  <div className="space-y-2.5 border-t border-gray-100 pt-3">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Custom Questions</p>
                    {questions.map((q) => {
                      const ans = s.custom_answers?.[q.id];
                      if (ans === undefined || ans === null || ans === "") return null;
                      return (
                        <div key={q.id}>
                          <p className="text-xs font-semibold text-gray-500 mb-0.5">{q.question}</p>
                          {q.type === "rating" ? (
                            <Stars value={Number(ans)} />
                          ) : q.type === "yesno" ? (
                            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                              ans === true || ans === "true" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                            }`}>
                              {ans === true || ans === "true" ? "Yes" : "No"}
                            </span>
                          ) : (
                            <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-lg px-3 py-2">{String(ans)}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
