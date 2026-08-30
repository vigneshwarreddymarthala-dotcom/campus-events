"use client";

import { useState, useEffect } from "react";
import {
  getAdaptedEvent, getEventSurveys, getSurveyQuestions, addSurveyQuestion,
  deleteSurveyQuestion, updateSurveyQuestion, type DbSurvey, type DbSurveyQuestion,
} from "@/lib/db";
import { type Event } from "@/lib/mock-data";
import { format } from "date-fns";
import {
  Star, ThumbsUp, ThumbsDown, FileDown, BarChart2,
  MessageSquare, Plus, Trash2, GripVertical, Type, ToggleLeft, Settings, X, Activity, Edit2, Save
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

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

export default function SurveysTab({ id }: { id: string }) {
  const [event, setEvent] = useState<Event | null | undefined>(undefined);
  const [surveys, setSurveys] = useState<DbSurvey[]>([]);
  const [questions, setQuestions] = useState<DbSurveyQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("overview");

  // New question form
  const [newQ, setNewQ] = useState("");
  const [newType, setNewType] = useState<DbSurveyQuestion["type"]>("text");
  const [newRequired, setNewRequired] = useState(false);
  const [adding, setAdding] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Edit question state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQ, setEditQ] = useState("");
  const [editType, setEditType] = useState<DbSurveyQuestion["type"]>("text");
  const [editRequired, setEditRequired] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

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
      setShowAddForm(false);
      setTab("questions");
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

  const startEditing = (q: DbSurveyQuestion) => {
    setEditingId(q.id);
    setEditQ(q.question);
    setEditType(q.type);
    setEditRequired(q.required);
  };

  const handleSaveEdit = async () => {
    if (!editingId || !editQ.trim()) return;
    setSavingEdit(true);
    try {
      await updateSurveyQuestion(editingId, { question: editQ.trim(), type: editType, required: editRequired });
      setQuestions((prev) => prev.map((x) => x.id === editingId ? { ...x, question: editQ.trim(), type: editType, required: editRequired } : x));
      setEditingId(null);
    } catch {}
    setSavingEdit(false);
  };

  const downloadResponse = (s: DbSurvey) => {
    const starStr = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);
    const lines: string[] = [
      `SURVEY RESPONSE — ${event!.title}`,
      `Submitted: ${format(new Date(s.submitted_at), "dd MMM yyyy, h:mm a")}`,
      `Student: ${s.student_name} (${s.student_email})`,
      "",
      "RATINGS",
      `Overall Event Rating: ${starStr(s.rating)} (${s.rating}/5)`,
      `Organization Rating:  ${starStr(s.organization_rating)} (${s.organization_rating}/5)`,
      `Would Recommend: ${s.would_recommend ? "Yes" : "No"}`,
    ];
    if (s.liked_most || s.could_improve || s.other_feedback) {
      lines.push("", "FEEDBACK");
      if (s.liked_most) lines.push(`Liked Most: ${s.liked_most}`);
      if (s.could_improve) lines.push(`Could Improve: ${s.could_improve}`);
      if (s.other_feedback) lines.push(`Other Feedback: ${s.other_feedback}`);
    }
    if (questions.length > 0 && s.custom_answers && Object.keys(s.custom_answers).length > 0) {
      lines.push("", "CUSTOM QUESTIONS");
      questions.forEach((q, idx) => {
        const ans = s.custom_answers?.[q.id];
        if (ans === null || ans === undefined || ans === "") return;
        lines.push(`Q${idx + 7}. ${q.question}`);
        if (q.type === "rating") {
          lines.push(`    → ${starStr(Number(ans))} (${ans}/5)`);
        } else if (q.type === "yesno") {
          lines.push(`    → ${ans === true || ans === "true" ? "Yes" : "No"}`);
        } else {
          lines.push(`    → ${ans}`);
        }
      });
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${s.student_name.replace(/\s+/g, "_")}_feedback.txt`;
    a.click();
    URL.revokeObjectURL(url);
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
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-xl font-bold text-gray-900">Event Survey</h2>
        {surveys.length > 0 && (
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
          >
            <FileDown className="w-4 h-4" /> Download CSV
          </button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="mb-6 bg-gray-100/50 p-1 rounded-xl flex-wrap h-auto">
          <TabsTrigger value="overview" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Activity className="w-4 h-4 mr-2" /> Overview
          </TabsTrigger>
          <TabsTrigger value="questions" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Settings className="w-4 h-4 mr-2" /> All Questions
          </TabsTrigger>
          <TabsTrigger value="create" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Create Question
          </TabsTrigger>
          <TabsTrigger value="responses" className="rounded-lg px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MessageSquare className="w-4 h-4 mr-2" /> Responses ({surveys.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: "Responses", value: surveys.length, sub: "total", icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
              { label: "Avg Rating", value: avgRating, sub: "out of 5", icon: Star, color: "text-yellow-500", bg: "bg-yellow-50" },
              { label: "Avg Org Rating", value: avgOrgRating, sub: "out of 5", icon: BarChart2, color: "text-blue-600", bg: "bg-blue-50" },
              { label: "Recommend", value: surveys.length ? `${recommendPct}%` : "—", sub: "would recommend", icon: ThumbsUp, color: "text-green-600", bg: "bg-green-50" },
            ].map((s) => (
              <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center gap-4">
                <div className={`w-12 h-12 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-6 h-6 ${s.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{s.value}</p>
                  <p className="text-sm text-gray-500">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

          {surveys.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Rating Distribution</h3>
              <div className="space-y-3">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = surveys.filter((s) => s.rating === star).length;
                  const pct = surveys.length ? Math.round((count / surveys.length) * 100) : 0;
                  return (
                    <div key={star} className="flex items-center gap-3">
                      <div className="flex items-center gap-1 w-16 shrink-0">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm font-medium text-gray-700">{star}</span>
                      </div>
                      <div className="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-yellow-400 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-sm font-medium text-gray-500 w-16 text-right shrink-0">{count} ({pct}%)</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="questions" className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <div className="flex items-center justify-between gap-2 border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-gray-900">Custom Questions</h3>
                <span className="text-xs bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">{questions.length}</span>
              </div>
              {!showAddForm && (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  <Plus className="w-4 h-4" /> Create Question
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="bg-indigo-50/50 rounded-xl border border-indigo-100 p-5 space-y-4">
                <p className="text-sm font-bold text-indigo-900">Add a custom question</p>
                <textarea
                  value={newQ}
                  onChange={(e) => setNewQ(e.target.value)}
                  placeholder="e.g. What topic would you like covered in future events?"
                  rows={2}
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <div className="flex items-center gap-4 flex-wrap">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as DbSurveyQuestion["type"])}
                    className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
                  >
                    <option value="text">Text answer</option>
                    <option value="rating">Star rating (1–5)</option>
                    <option value="yesno">Yes / No</option>
                  </select>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none bg-white border border-gray-200 px-4 h-10 rounded-xl hover:border-gray-300 transition-colors">
                    <input
                      type="checkbox"
                      checked={newRequired}
                      onChange={(e) => setNewRequired(e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    Required
                  </label>
                  <button
                    onClick={handleAddQuestion}
                    disabled={adding || !newQ.trim()}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-5 h-10 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors ml-auto"
                  >
                    {adding ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Question
                  </button>
                </div>
              </div>
            )}

            {questions.length === 0 && !showAddForm ? (
              <div className="py-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <p className="text-gray-500 font-medium mb-2">No custom questions added.</p>
                <button onClick={() => setShowAddForm(true)} className="text-indigo-600 font-medium hover:underline text-sm">
                  Create your first custom question
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((q, idx) => (
                  <div key={q.id} className="bg-gray-50 rounded-xl border border-gray-100 p-4">
                    {editingId === q.id ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-bold text-gray-900">Edit question</p>
                          <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-200 transition-colors">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <textarea
                          value={editQ}
                          onChange={(e) => setEditQ(e.target.value)}
                          rows={2}
                          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <div className="flex items-center gap-4 flex-wrap">
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as DbSurveyQuestion["type"])}
                            className="h-10 rounded-xl border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[140px]"
                          >
                            <option value="text">Text answer</option>
                            <option value="rating">Star rating (1–5)</option>
                            <option value="yesno">Yes / No</option>
                          </select>
                          <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer select-none bg-white border border-gray-200 px-4 h-10 rounded-xl hover:border-gray-300 transition-colors">
                            <input
                              type="checkbox"
                              checked={editRequired}
                              onChange={(e) => setEditRequired(e.target.checked)}
                              className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            Required
                          </label>
                          <button
                            onClick={handleSaveEdit}
                            disabled={savingEdit || !editQ.trim()}
                            className="flex items-center gap-2 bg-indigo-600 text-white px-5 h-10 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors ml-auto"
                          >
                            {savingEdit ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                            Update
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start gap-4">
                        <span className="w-6 h-6 bg-indigo-100 rounded-full text-xs flex items-center justify-center text-indigo-700 font-bold shrink-0 mt-0.5">
                          {idx + 7}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{q.question}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-white px-2.5 py-1 rounded-md border border-gray-200">
                              {TYPE_ICONS[q.type]} {TYPE_LABELS[q.type]}
                            </span>
                            <span className={`text-xs px-2.5 py-1 rounded-md font-medium border ${
                              q.required ? "bg-red-50 text-red-700 border-red-200" : "bg-white text-gray-500 border-gray-200"
                            }`}>
                              {q.required ? "Required" : "Optional"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => startEditing(q)}
                            className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-colors"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            disabled={deletingId === q.id}
                            className="p-2 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Default questions (Always included)</h3>
            <div className="space-y-3">
              {[
                "Overall event rating ★★★★★",
                "Organization rating ★★★★★",
                "Would you recommend this event? (Yes / No)",
                "What did you like most? (text)",
                "What could be improved? (text)",
                "Any other feedback? (text)",
              ].map((q, i) => (
                <div key={i} className="flex items-center gap-3 text-sm text-gray-600">
                  <span className="w-6 h-6 bg-gray-200 rounded-full text-xs flex items-center justify-center text-gray-600 font-semibold shrink-0">{i + 1}</span>
                  {q}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="responses" className="space-y-6">
          {surveys.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 py-16 text-center">
              <Star className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-900 font-bold text-lg">No survey responses yet.</p>
              <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">Responses will appear here once students submit their feedback for this event.</p>
            </div>
          ) : (
            surveys.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 border-l-4 border-l-indigo-500 p-6 space-y-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-base shrink-0">
                      {s.student_name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-bold text-gray-900">{s.student_name}</p>
                      <p className="text-sm text-gray-500">{s.student_email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-sm font-medium text-gray-400">{format(new Date(s.submitted_at), "dd MMM yyyy, h:mm a")}</span>
                    {s.would_recommend ? (
                      <span className="flex items-center gap-1.5 bg-green-100 text-green-700 text-sm font-bold px-3 py-1.5 rounded-full">
                        <ThumbsUp className="w-4 h-4" /> Recommends
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 bg-red-100 text-red-600 text-sm font-bold px-3 py-1.5 rounded-full">
                        <ThumbsDown className="w-4 h-4" /> Doesn&apos;t recommend
                      </span>
                    )}
                    <button
                      onClick={() => downloadResponse(s)}
                      title="Download response"
                      className="p-2 rounded-xl border-2 border-gray-100 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-colors ml-2"
                    >
                      <FileDown className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="border-t border-gray-100" />

                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                    <p className="text-sm text-gray-500 font-semibold">Overall Rating</p>
                    <Stars value={s.rating} />
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
                    <p className="text-sm text-gray-500 font-semibold">Organization</p>
                    <Stars value={s.organization_rating} />
                  </div>
                </div>

                {(s.liked_most || s.could_improve || s.other_feedback) && (
                  <div className="space-y-3">
                    {s.liked_most && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-1">Liked most</p>
                        <p className="text-sm text-gray-800 bg-green-50 border border-green-100 rounded-xl px-4 py-3">{s.liked_most}</p>
                      </div>
                    )}
                    {s.could_improve && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-1">Could improve</p>
                        <p className="text-sm text-gray-800 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">{s.could_improve}</p>
                      </div>
                    )}
                    {s.other_feedback && (
                      <div>
                        <p className="text-sm font-bold text-gray-700 mb-1">Other feedback</p>
                        <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">{s.other_feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {questions.length > 0 && s.custom_answers && Object.keys(s.custom_answers).length > 0 && (
                  <div className="space-y-3 border-t border-gray-100 pt-5">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Custom Questions</p>
                    {questions.map((q) => {
                      const ans = s.custom_answers?.[q.id];
                      if (ans === undefined || ans === null || ans === "") return null;
                      return (
                        <div key={q.id}>
                          <p className="text-sm font-bold text-gray-700 mb-1">{q.question}</p>
                          {q.type === "rating" ? (
                            <Stars value={Number(ans)} />
                          ) : q.type === "yesno" ? (
                            <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1 rounded-full ${
                              ans === true || ans === "true" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                            }`}>
                              {ans === true || ans === "true" ? "Yes" : "No"}
                            </span>
                          ) : (
                            <p className="text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">{String(ans)}</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
