"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { createClient } from "@/utils/supabase/client";
import { User, Mail, Edit2, Save, X, LogOut, Shield, Key } from "lucide-react";
import { Input } from "@/components/ui/input";

export default function AdminProfilePage() {
  const { user, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const [pwOpen, setPwOpen] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");

  const initials = user?.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) ?? "??";

  const handleSave = async () => {
    if (!name.trim()) { setError("Name cannot be empty."); return; }
    setSaving(true);
    setError("");
    const supabase = createClient();
    const { error: e } = await supabase.from("profiles").update({ name: name.trim() }).eq("id", user!.id);
    setSaving(false);
    if (e) { setError(e.message); return; }
    setSuccess("Profile updated!");
    setEditing(false);
    setTimeout(() => setSuccess(""), 3000);
  };

  const handlePasswordChange = async () => {
    if (newPw.length < 6) { setPwMsg("Password must be at least 6 characters."); return; }
    if (newPw !== confirmPw) { setPwMsg("Passwords do not match."); return; }
    setPwSaving(true);
    setPwMsg("");
    const supabase = createClient();
    const { error: e } = await supabase.auth.updateUser({ password: newPw });
    setPwSaving(false);
    if (e) { setPwMsg(e.message); return; }
    setPwMsg("Password updated successfully!");
    setNewPw("");
    setConfirmPw("");
    setTimeout(() => { setPwMsg(""); setPwOpen(false); }, 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-500 text-sm mt-1">Manage your organizer account</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center shrink-0">
            <span className="text-2xl font-bold text-indigo-700">{initials}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-lg font-semibold text-gray-900 truncate">{user?.name}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
            <span className="mt-1 inline-flex items-center gap-1 bg-purple-100 text-purple-700 text-xs font-semibold px-2.5 py-0.5 rounded-full">
              <Shield className="w-3 h-3" /> Organizer
            </span>
          </div>
          {!editing && (
            <button
              onClick={() => { setEditing(true); setName(user?.name ?? ""); }}
              className="shrink-0 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <Edit2 className="w-4 h-4" /> Edit
            </button>
          )}
        </div>
      </div>

      {/* Info / edit */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h3 className="font-semibold text-gray-900">Account Details</h3>
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-2.5 rounded-xl">{success}</div>}
        {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-2.5 rounded-xl">{error}</div>}

        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input value={name} onChange={(e) => setName(e.target.value)} className="pl-9" />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                <Save className="w-4 h-4" /> {saving ? "Saving…" : "Save"}
              </button>
              <button onClick={() => { setEditing(false); setError(""); }} className="flex items-center gap-2 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100">
                <X className="w-4 h-4" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0"><User className="w-4 h-4" /></div>
              <div><p className="text-xs text-gray-400">Name</p><p className="text-sm font-medium text-gray-900">{user?.name}</p></div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center justify-center text-gray-400 shrink-0"><Mail className="w-4 h-4" /></div>
              <div><p className="text-xs text-gray-400">Email</p><p className="text-sm font-medium text-gray-900">{user?.email}</p></div>
            </div>
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Change Password</h3>
          </div>
          {!pwOpen && (
            <button onClick={() => setPwOpen(true)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">Change</button>
          )}
        </div>
        {pwOpen && (
          <div className="space-y-3">
            {pwMsg && (
              <p className={`text-sm px-4 py-2.5 rounded-xl border ${pwMsg.includes("success") ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"}`}>{pwMsg}</p>
            )}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">New Password</label>
              <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Confirm Password</label>
              <Input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Repeat new password" />
            </div>
            <div className="flex gap-3">
              <button onClick={handlePasswordChange} disabled={pwSaving} className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-60">
                {pwSaving ? "Updating…" : "Update Password"}
              </button>
              <button onClick={() => { setPwOpen(false); setNewPw(""); setConfirmPw(""); setPwMsg(""); }} className="text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-100">Cancel</button>
            </div>
          </div>
        )}
      </div>

      {/* Sign out */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900">Sign Out</p>
          <p className="text-xs text-gray-400 mt-0.5">You will be returned to the login screen</p>
        </div>
        <button onClick={logout} className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-600 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
