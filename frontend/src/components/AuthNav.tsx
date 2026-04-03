"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export function AuthNav() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <span className="text-sm text-slate-500">Loading…</span>;
  }

  if (user) {
    const dash =
      user.role === "STUDENT"
        ? "/student/dashboard"
        : user.role === "PARTNER"
          ? "/partner/dashboard"
          : "/admin/dashboard";
    return (
      <nav className="flex items-center gap-4 text-sm font-medium">
        <span className="text-slate-600 dark:text-slate-400">{user.name}</span>
        <Link href={dash} className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
          Dashboard
        </Link>
        <button
          type="button"
          onClick={() => logout()}
          className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          Logout
        </button>
      </nav>
    );
  }

  return (
    <nav className="flex gap-4 text-sm font-medium">
      <Link
        href="/login"
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        Sign in
      </Link>
      <Link
        href="/register"
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        Register
      </Link>
      <Link
        href="/student/dashboard"
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        Student
      </Link>
      <Link
        href="/partner/dashboard"
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        Partner
      </Link>
      <Link
        href="/admin/dashboard"
        className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
      >
        Admin
      </Link>
    </nav>
  );
}
