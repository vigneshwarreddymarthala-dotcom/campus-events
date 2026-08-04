"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, GraduationCap, AlertCircle, CheckCircle2 } from "lucide-react";

const DEPARTMENTS = ["Computer Science", "Information Technology", "ECE", "EEE", "Mechanical", "Civil", "MBA", "Other"];
const YEARS = ["1st Year", "2nd Year", "3rd Year", "4th Year", "Faculty"];

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student" as "student" | "admin",
    department: "",
    year: "",
    phone: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (key: string, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  const passwordStrength = () => {
    const p = form.password;
    if (p.length === 0) return null;
    if (p.length < 6) return { level: "weak", color: "bg-red-400", label: "Weak" };
    if (p.length < 8 || !/[0-9]/.test(p)) return { level: "fair", color: "bg-yellow-400", label: "Fair" };
    if (/[A-Z]/.test(p) && /[0-9]/.test(p) && p.length >= 8) return { level: "strong", color: "bg-green-500", label: "Strong" };
    return { level: "fair", color: "bg-yellow-400", label: "Fair" };
  };

  const strength = passwordStrength();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!acceptedTerms) {
      setError("Please accept the Terms & Conditions to continue.");
      return;
    }
    setLoading(true);
    const result = await register({
      name: form.name,
      email: form.email,
      password: form.password,
      role: form.role,
      department: form.department,
      year: form.year,
      phone: form.phone,
    });
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Registration failed.");
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gray-50">
      <div className="w-full max-w-lg">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-gray-900">CampusEvents</h1>
            <p className="text-xs text-gray-500">Create your account</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 sm:p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h2>
          <p className="text-gray-500 text-sm mb-6">Join your campus community</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role selector */}
            <div>
              <Label className="mb-2 block">I am a</Label>
              <div className="grid grid-cols-2 gap-3">
                {(["student", "admin"] as const).map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => set("role", role)}
                    className={`py-3 px-4 rounded-xl border-2 text-sm font-medium capitalize transition-all ${
                      form.role === role
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700"
                        : "border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {role === "student" ? "Student" : "Organizer / Faculty"}
                  </button>
                ))}
              </div>
            </div>

            {/* Full name */}
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                placeholder="Priya Menon"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Email */}
            <div>
              <Label htmlFor="email">College Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@college.edu"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                required
                className="mt-1"
              />
            </div>

            {/* Department + Year */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="dept">Department</Label>
                <select
                  id="dept"
                  value={form.department}
                  onChange={(e) => set("department", e.target.value)}
                  className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                >
                  <option value="">Select dept</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              {form.role === "student" && (
                <div>
                  <Label htmlFor="year">Year</Label>
                  <select
                    id="year"
                    value={form.year}
                    onChange={(e) => set("year", e.target.value)}
                    className="mt-1 w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="">Select year</option>
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Phone */}
            <div>
              <Label htmlFor="phone">Phone Number <span className="text-gray-400 font-normal">(optional)</span></Label>
              <Input
                id="phone"
                type="tel"
                placeholder="9876543210"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Password */}
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a strong password"
                  value={form.password}
                  onChange={(e) => set("password", e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {strength && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {["weak", "fair", "strong"].map((l, i) => (
                      <div
                        key={l}
                        className={`h-1.5 flex-1 rounded-full ${
                          ["weak", "fair", "strong"].indexOf(strength.level) >= i
                            ? strength.color
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-gray-500">Password strength: <span className="font-medium">{strength.label}</span></p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div>
              <Label htmlFor="confirm">Confirm Password</Label>
              <div className="relative mt-1">
                <Input
                  id="confirm"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Re-enter your password"
                  value={form.confirmPassword}
                  onChange={(e) => set("confirmPassword", e.target.value)}
                  required
                  className={`pr-10 ${
                    form.confirmPassword && form.password !== form.confirmPassword
                      ? "border-red-400"
                      : form.confirmPassword && form.password === form.confirmPassword
                      ? "border-green-400"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {form.confirmPassword && form.password === form.confirmPassword && (
                <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </p>
              )}
            </div>

            {/* Terms checkbox */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => setAcceptedTerms(!acceptedTerms)}
                className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  acceptedTerms ? "bg-indigo-600 border-indigo-600" : "border-gray-300 hover:border-indigo-400"
                }`}
              >
                {acceptedTerms && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
              </button>
              <p className="text-sm text-gray-600">
                I agree to the{" "}
                <Link href="/terms" className="text-indigo-600 hover:underline font-medium">
                  Terms &amp; Conditions
                </Link>{" "}
                and{" "}
                <Link href="/privacy-policy" className="text-indigo-600 hover:underline font-medium">
                  Privacy Policy
                </Link>
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              disabled={loading || !acceptedTerms}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </span>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-indigo-600 font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
