"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, GraduationCap, AlertCircle, Shield, User } from "lucide-react";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageInner />
    </Suspense>
  );
}

function LoginPageInner() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const autoAs = searchParams.get("as");
    if (!autoAs) return;
    const creds: Record<string, [string, string]> = {
      admin: ["admin@college.edu", "admin123"],
      student: ["student@college.edu", "student123"],
    };
    const pair = creds[autoAs];
    if (!pair) return;
    setLoading(true);
    login(pair[0], pair[1]).then((r) => {
      setLoading(false);
      if (r.success) router.push(searchParams.get("redirect") ?? "/");
      else setError(r.error ?? "Login failed.");
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed.");
      return;
    }
    // redirect handled by root page, but push manually based on role
    router.push("/");
  };

  const quickLogin = async (role: "admin" | "student") => {
    const creds: Record<string, [string, string]> = {
      admin: ["admin@college.edu", "admin123"],
      student: ["student@college.edu", "student123"],
    };
    const [quickEmail, quickPassword] = creds[role];
    setError("");
    setLoading(true);
    const result = await login(quickEmail, quickPassword);
    setLoading(false);
    if (!result.success) {
      setError(result.error ?? "Login failed.");
      return;
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-indigo-600 to-indigo-800 flex-col items-center justify-center p-12 text-white">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <GraduationCap className="w-10 h-10" />
          </div>
          <h1 className="text-4xl font-bold mb-4">CampusEvents</h1>
          <p className="text-indigo-200 text-lg">
            Your one-stop hub for discovering and managing campus events. No more scrolling through WhatsApp groups.
          </p>
          <div className="mt-10 grid grid-cols-3 gap-6 text-center">
            {[
              { number: "50+", label: "Events/Month" },
              { number: "1500+", label: "Students" },
              { number: "100%", label: "Free to Use" },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/10 rounded-xl p-4">
                <div className="text-2xl font-bold">{stat.number}</div>
                <div className="text-indigo-200 text-sm mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-indigo-700">CampusEvents</span>
          </div>

          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome back</h2>
          <p className="text-gray-500 mb-8">Sign in to your college account</p>

          {/* Quick role login */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => quickLogin("admin")}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 py-4 px-3 hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-60"
            >
              <Shield className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-900">Organiser</span>
            </button>
            <button
              type="button"
              onClick={() => quickLogin("student")}
              disabled={loading}
              className="flex flex-col items-center gap-2 rounded-xl border border-gray-200 py-4 px-3 hover:border-indigo-400 hover:bg-indigo-50 transition-colors disabled:opacity-60"
            >
              <User className="w-5 h-5 text-indigo-600" />
              <span className="text-sm font-medium text-gray-900">Student</span>
            </button>
          </div>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-2 text-gray-400">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="email">College Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password">Password</Label>
                <Link href="/forgot-password" className="text-sm text-indigo-600 hover:underline">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 text-sm">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Don&apos;t have an account?{" "}
            <Link href="/register" className="text-indigo-600 font-medium hover:underline">
              Create account
            </Link>
          </p>

          <div className="mt-6 pt-6 border-t border-gray-200 text-center text-xs text-gray-400 space-x-4">
            <Link href="/privacy-policy" className="hover:text-gray-600">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-600">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
