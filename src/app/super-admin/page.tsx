"use client";

import { useState, useEffect } from "react";
import { getAllOrganizers, type DbProfile } from "@/lib/db";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Search, Users, Plus, X, AlertCircle, CheckCircle2, Copy, Check, Shield, Flag,
} from "lucide-react";

type CreatedCredentials = { name: string; email: string; password: string; role: string };
type Role = "admin" | "event_head";

function RoleBadge({ role }: { role: string }) {
  if (role === "event_head") {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        <Flag className="w-3 h-3" /> Team Head
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
      <Shield className="w-3 h-3" /> Organizer
    </span>
  );
}

export default function SuperAdminOrganizersPage() {
  const [organizers, setOrganizers] = useState<DbProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    const data = await getAllOrganizers().catch(() => [] as DbProfile[]);
    setOrganizers(data);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = organizers.filter((o) => {
    const q = search.toLowerCase();
    return (
      o.name.toLowerCase().includes(q) ||
      o.email.toLowerCase().includes(q) ||
      (o.department ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Organizers</h1>
          <p className="text-sm text-gray-500 mt-1">Everyone who can create and manage events.</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gray-900 hover:bg-gray-800">
          <Plus className="w-4 h-4" /> Add Person
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center shrink-0">
          <Users className="w-5 h-5 text-gray-500" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{organizers.length}</p>
          <p className="text-xs text-gray-400">Total organizers &amp; team heads</p>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Search by name, email, or department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center text-gray-400 text-sm">
            {organizers.length === 0 ? "No organizers yet." : "No matches."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Department</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const initials = o.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <tr key={o.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                          {initials}
                        </div>
                        <span className="font-medium text-gray-900">{o.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3"><RoleBadge role={o.role} /></td>
                    <td className="px-5 py-3 text-gray-500">{o.email}</td>
                    <td className="px-5 py-3 text-gray-500">{o.department ?? "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {showCreate && (
        <CreateOrganizerModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}

function CreateOrganizerModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [role, setRole] = useState<Role>("admin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/create-organizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, department, role }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to create account.");
        return;
      }
      setResult({ name: json.name, email: json.email, password: json.password, role: json.role });
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    if (!result) return;
    navigator.clipboard.writeText(`Email: ${result.email}\nPassword: ${result.password}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={result ? onCreated : onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <button
          onClick={result ? onCreated : onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        {!result ? (
          <>
            <h2 className="text-lg font-bold text-gray-900 mb-1">Add Person</h2>
            <p className="text-sm text-gray-500 mb-5">Creates a new account with event-management access.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Role</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setRole("admin")}
                    className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-colors ${
                      role === "admin" ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900"><Shield className="w-4 h-4 text-indigo-600" /> Organizer</span>
                    <span className="text-xs text-gray-500">Full access — can create and manage any number of events.</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole("event_head")}
                    className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-colors ${
                      role === "event_head" ? "border-amber-500 bg-amber-50" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900"><Flag className="w-4 h-4 text-amber-600" /> Team Head</span>
                    <span className="text-xs text-gray-500">Can create and manage exactly one event.</span>
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="org-name">Full Name</Label>
                <Input id="org-name" value={name} onChange={(e) => setName(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="org-email">Email</Label>
                <Input id="org-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-1" />
              </div>
              <div>
                <Label htmlFor="org-dept">Department <span className="text-gray-400 font-normal">(optional)</span></Label>
                <Input id="org-dept" value={department} onChange={(e) => setDepartment(e.target.value)} className="mt-1" />
              </div>

              {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" disabled={loading} className="w-full bg-gray-900 hover:bg-gray-800">
                {loading ? "Creating..." : role === "event_head" ? "Create Team Head" : "Create Organizer"}
              </Button>
            </form>
          </>
        ) : (
          <div>
            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              {result.role === "event_head" ? "Team head created" : "Organizer created"}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Share these credentials with {result.name} securely. The password won&apos;t be shown again — they can change it after logging in.
            </p>
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 font-mono text-sm">
              <p><span className="text-gray-400">Email:</span> {result.email}</p>
              <p><span className="text-gray-400">Password:</span> {result.password}</p>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={copyCredentials} variant="outline" className="flex-1 gap-2">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </Button>
              <Button onClick={onCreated} className="flex-1 bg-gray-900 hover:bg-gray-800">Done</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
