"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/utils/supabase/client";
import { getMyRegistrations, getMyBookmarks } from "@/lib/db";
import {
  User, Mail, Phone, BookOpen, GraduationCap, Globe, Languages,
  Edit2, Save, X, LogOut, Calendar, Bookmark, CheckCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { AvatarUpload } from "@/components/shared/AvatarUpload";
import { STUDY_PROGRAMS, STUDENT_STATUSES, GERMAN_LEVELS } from "@/lib/profile-options";

export default function StudentProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const formFromUser = () => ({
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    homeCountry: user?.homeCountry ?? "",
    studyProgram: user?.studyProgram ?? "",
    studentStatus: user?.studentStatus ?? "",
    germanLevel: user?.germanLevel ?? "",
  });

  const [form, setForm] = useState(formFromUser);

  const [stats, setStats] = useState({ registered: 0, bookmarks: 0, attended: 0 });

  useEffect(() => {
    if (user) setForm(formFromUser());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    getMyRegistrations().then((regs) => {
      setStats((s) => ({
        ...s,
        registered: regs.length,
        attended: regs.filter((r) => r.attended).length,
      }));
    }).catch(console.error);
    getMyBookmarks().then((bms) => {
      setStats((s) => ({ ...s, bookmarks: bms.length }));
    }).catch(console.error);
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name cannot be empty."); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: dbErr } = await supabase
      .from("profiles")
      .update({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        home_country: form.homeCountry.trim() || null,
        study_program: form.studyProgram || null,
        student_status: form.studentStatus || null,
        german_level: form.germanLevel || null,
        department: form.studyProgram || null,
        year: form.studentStatus || null,
      })
      .eq("id", user!.id);
    setSaving(false);
    if (dbErr) { setError(dbErr.message); return; }
    await refreshUser();
    setSuccess("Profile updated!");
    setEditing(false);
    setTimeout(() => setSuccess(""), 3000);
  };

  const cancelEdit = () => {
    setForm(formFromUser());
    setEditing(false);
    setError("");
  };

  const initials = user?.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "??";

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your account details</p>
      </div>

      {/* Avatar + name card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          {user && <AvatarUpload userId={user.id} initials={initials} onError={setError} />}
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="mt-1 inline-block bg-indigo-100 text-indigo-700 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize">
              Student
            </span>
          </div>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="shrink-0 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Registered", value: stats.registered, icon: Calendar, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Bookmarks", value: stats.bookmarks, icon: Bookmark, color: "text-yellow-600", bg: "bg-yellow-50" },
          { label: "Attended", value: stats.attended, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4 flex flex-col items-center gap-1.5">
            <div className={`w-9 h-9 ${s.bg} rounded-xl flex items-center justify-center`}>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <p className="text-xl font-bold text-gray-900">{s.value}</p>
            <p className="text-xs text-gray-500 text-center">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Profile details / edit form */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-900">Personal Information</h3>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-xl">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">
            {error}
          </div>
        )}

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="pl-9"
                  placeholder="Your full name"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Mobiltelefon - Mobile phone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="pl-9"
                  placeholder="+49 170 1234567"
                  type="tel"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Heimatland - Home Country</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={form.homeCountry}
                  onChange={(e) => setForm((f) => ({ ...f, homeCountry: e.target.value }))}
                  className="pl-9"
                  placeholder="India"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Was studierst du? - What do you study / name of current study program?</label>
              <div className="relative">
                <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={form.studyProgram}
                  onChange={(e) => setForm((f) => ({ ...f, studyProgram: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select study program</option>
                  {STUDY_PROGRAMS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Welchen Studentenstatus hast du? - What is your student status?</label>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={form.studentStatus}
                  onChange={(e) => setForm((f) => ({ ...f, studentStatus: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select student status</option>
                  {STUDENT_STATUSES.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Wie gut sind Ihre Deutschkenntnisse? - What is your level of proficiency in the German language?</label>
              <div className="relative">
                <Languages className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <select
                  value={form.germanLevel}
                  onChange={(e) => setForm((f) => ({ ...f, germanLevel: e.target.value }))}
                  className="w-full h-9 rounded-md border border-input bg-background pl-9 pr-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select level</option>
                  {GERMAN_LEVELS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60 transition-colors"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving…" : "Save Changes"}
              </button>
              <button
                onClick={cancelEdit}
                className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={user?.email ?? "—"} />
            <InfoRow icon={<Phone className="w-4 h-4" />} label="Mobiltelefon - Mobile phone" value={user?.phone || "Not set"} muted={!user?.phone} />
            <InfoRow icon={<Globe className="w-4 h-4" />} label="Heimatland - Home Country" value={user?.homeCountry || "Not set"} muted={!user?.homeCountry} />
            <InfoRow icon={<BookOpen className="w-4 h-4" />} label="Study program" value={user?.studyProgram || "Not set"} muted={!user?.studyProgram} />
            <InfoRow icon={<GraduationCap className="w-4 h-4" />} label="Student status" value={user?.studentStatus || "Not set"} muted={!user?.studentStatus} />
            <InfoRow icon={<Languages className="w-4 h-4" />} label="German level" value={user?.germanLevel || "Not set"} muted={!user?.germanLevel} />
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Sign Out</p>
          <p className="text-xs text-gray-400 mt-0.5">You will be returned to the login screen</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value, muted }: {
  icon: React.ReactNode; label: string; value: string; muted?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className={`text-sm font-medium truncate ${muted ? "text-gray-400 italic" : "text-gray-900"}`}>{value}</p>
      </div>
    </div>
  );
}
