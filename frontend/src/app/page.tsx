import { AuthNav } from "@/components/AuthNav";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">Campus Delivery</Link>
          <AuthNav />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16 sm:py-24">
        <section className="text-center mb-16">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
            Send & receive on campus
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Food, groceries, and parcels delivered within campus. Order as a student, deliver as a partner, or manage as admin.
          </p>
        </section>

        <section className="grid sm:grid-cols-3 gap-6">
          <Link
            href="/student/dashboard"
            className="group block p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Student</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Place orders, track delivery, pay via UPI/card/COD. View your order history.
            </p>
            <span className="inline-block mt-3 text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:underline">
              Go to dashboard →
            </span>
          </Link>

          <Link
            href="/partner/dashboard"
            className="group block p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-amber-300 dark:hover:border-amber-600 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1h-4m-6-1a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6-1h6" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Delivery Partner</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Accept orders, navigate pickups & drops, complete deliveries, track earnings.
            </p>
            <span className="inline-block mt-3 text-sm font-medium text-amber-600 dark:text-amber-400 group-hover:underline">
              Go to dashboard →
            </span>
          </Link>

          <Link
            href="/admin/dashboard"
            className="group block p-6 rounded-2xl bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-sky-300 dark:hover:border-sky-600 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-100 dark:bg-sky-900/40 flex items-center justify-center mb-4 text-sky-600 dark:text-sky-400 group-hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold mb-2">Admin</h2>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Approve partners, manage users and orders, view analytics and stats.
            </p>
            <span className="inline-block mt-3 text-sm font-medium text-sky-600 dark:text-sky-400 group-hover:underline">
              Go to dashboard →
            </span>
          </Link>
        </section>

        <p className="text-center text-sm text-slate-500 dark:text-slate-500 mt-12">
          Campus-wide delivery — food, groceries & parcels.
        </p>
      </main>
    </div>
  );
}
