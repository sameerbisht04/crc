"use client";

import { formatAuthError } from "@/lib/authErrors";
import { supabase } from "@/supabaseClient";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User as SupabaseUser } from "@supabase/supabase-js";

function getRoleFromSupabaseUser(user: SupabaseUser) {
  const role =
    (typeof user.user_metadata?.role === "string" && user.user_metadata.role.toUpperCase()) ||
    (typeof user.app_metadata?.role === "string" && user.app_metadata.role.toUpperCase()) ||
    "";
  if (role === "ADMIN" || role === "PARTNER" || role === "STUDENT") return role;
  const adminEmailList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
  const email = (user.email || "").toLowerCase();
  if (email && adminEmailList.includes(email)) return "ADMIN";
  return "STUDENT";
}

export default function PartnerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        setError(formatAuthError(signInError.message));
        return;
      }
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const role = session?.user ? getRoleFromSupabaseUser(session.user) : "STUDENT";
      if (role !== "PARTNER") {
        setError("This account is not a delivery partner. Use the correct partner credentials.");
        return;
      }
      router.push("/partner/dashboard");
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm">
        <h1 className="text-xl font-bold mb-1">Partner sign in</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Sign in with your partner Supabase account.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-amber-600 text-white font-medium py-2 text-sm hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Partner sign in"}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          <Link href="/login" className="text-slate-900 dark:text-slate-100 font-medium hover:underline">
            General sign in
          </Link>
          {" · "}
          <Link href="/partner/apply" className="font-medium hover:underline">
            Apply as partner
          </Link>
        </p>
      </div>
    </div>
  );
}
