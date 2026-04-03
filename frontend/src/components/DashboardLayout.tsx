"use client";

import { useAuth } from "@/contexts/AuthContext";
import Link from "next/link";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link href="/" className="font-bold text-slate-900 dark:text-white">
            Campus Delivery
          </Link>
          <nav className="flex items-center gap-4 text-sm">
            {user && (
              <>
                <span className="text-slate-600 dark:text-slate-400">{user.name}</span>
                <button
                  type="button"
                  onClick={() => logout()}
                  className="text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                >
                  Logout
                </button>
              </>
            )}
            {!user && (
              <Link href="/login" className="text-slate-600 dark:text-slate-400 hover:underline">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">{children}</main>
    </div>
  );
}
