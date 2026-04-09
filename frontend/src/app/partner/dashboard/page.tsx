"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api, Order } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PICKED_UP: "Picked up",
  ON_THE_WAY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  PICKED_UP: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  ON_THE_WAY: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  DELIVERED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400",
  CANCELLED: "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400",
};

export default function PartnerDashboardPage() {
  const { user, loading: authLoading, refreshUser } = useAuth();
  const [available, setAvailable] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isApproved, setIsApproved] = useState<boolean | null>(null);
  const [showRewardsComing, setShowRewardsComing] = useState(false);

  const fetchData = async () => {
    if (!user || user.role !== "PARTNER") return;
    try {
      const [avail, mine] = await Promise.all([
        api<Order[]>("/orders/available"),
        api<Order[]>("/partners/me/orders"),
      ]);
      setAvailable(avail);
      setMyOrders(mine);
      setIsApproved(true);
      setError("");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load";
      if (errorMessage.includes("Partner not approved yet")) {
        setIsApproved(false);
        setError("");
      } else {
        setError(errorMessage);
        setIsApproved(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "PARTNER") return;
    fetchData();
    const t = setInterval(fetchData, 6000);
    return () => clearInterval(t);
  }, [user?.id, user?.role]);

  async function handleAccept(orderId: string) {
    setAcceptingId(orderId);
    try {
      await api(`/partners/accept/${orderId}`, { method: "POST" });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept");
    } finally {
      setAcceptingId(null);
    }
  }

  async function handleStatus(orderId: string, status: Order["status"]) {
    setUpdatingId(orderId);
    try {
      await api(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await fetchData();
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setUpdatingId(null);
    }
  }

  if (authLoading) {
    return (
      <DashboardLayout>
        <p className="text-slate-500">Loading…</p>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6 text-center max-w-md mx-auto">
          <h2 className="font-semibold mb-2">Delivery Partner</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Apply to become a partner, then sign in after approval.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link
              href="/partner/apply"
              className="rounded-lg bg-amber-600 text-white font-medium py-2 px-4 text-sm hover:opacity-90"
            >
              Apply as partner
            </Link>
            <Link
              href="/partner/login"
              className="rounded-lg border border-slate-300 dark:border-slate-600 font-medium py-2 px-4 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Partner sign in
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role !== "PARTNER") {
    return (
      <DashboardLayout>
        <p className="text-slate-500">This page is for delivery partners. You are signed in as {user.role}.</p>
      </DashboardLayout>
    );
  }

  if (isApproved === false) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-6 text-center max-w-md mx-auto">
          <h2 className="font-semibold mb-2">Approval Pending</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Your partner application is being reviewed by an admin. You'll be able to accept orders once approved.
          </p>
          <p className="text-xs text-slate-500">Check back later or contact support if you have questions.</p>
        </div>
      </DashboardLayout>
    );
  }

  const earnings = (user as { earnings?: number }).earnings ?? 0;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Partner Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Accept orders and track earnings</p>
          </div>
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 px-4 py-3">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total earnings</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">₹{earnings}</p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/20 p-2">
            {error}
          </p>
        )}

        <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => setShowRewardsComing(true)}
            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6 hover:shadow-md transition-shadow text-left"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white">Rewards & Points</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Earn rewards on deliveries</p>
              </div>
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m6.364 1.636l-.707.707M21 12h-1m1.364 6.364l-.707-.707M12 21v1m-6.364-1.636l.707.707M3 12h1M3.636 5.636l.707.707" />
              </svg>
            </div>
          </button>
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Available orders</h2>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading…</p>
          ) : available.length === 0 ? (
            <p className="text-slate-500 text-sm">No pending orders right now.</p>
          ) : (
            <ul className="space-y-3">
              {available.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-600 p-3"
                >
                  <div>
                    <p className="font-medium text-sm">{order.type} · ₹{order.amount || 0}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs">
                      {order.pickupLocation} → {order.dropLocation}
                    </p>
                    {order.student && (
                      <p className="text-xs text-slate-500">{order.student.name} · {order.student.email}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={acceptingId === order.id}
                    onClick={() => handleAccept(order.id)}
                    className="rounded-lg bg-amber-600 text-white text-sm font-medium py-1.5 px-3 hover:opacity-90 disabled:opacity-50"
                  >
                    {acceptingId === order.id ? "Accepting…" : "Accept"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
          <h2 className="text-lg font-semibold mb-4">My deliveries</h2>
          {myOrders.length === 0 ? (
            <p className="text-slate-500 text-sm">No deliveries yet.</p>
          ) : (
            <ul className="space-y-3">
              {myOrders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-lg border border-slate-200 dark:border-slate-600 p-3"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <p className="font-medium text-sm">{order.type} · ₹{order.amount || 0}</p>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 text-xs mb-2">
                    {order.pickupLocation} → {order.dropLocation}
                  </p>
                  {order.status === "PICKED_UP" && (
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => handleStatus(order.id, "ON_THE_WAY")}
                      className="rounded-lg bg-blue-600 text-white text-xs font-medium py-1.5 px-2.5 mr-2 hover:opacity-90 disabled:opacity-50"
                    >
                      {updatingId === order.id ? "Updating…" : "Mark on the way"}
                    </button>
                  )}
                  {order.status === "ON_THE_WAY" && (
                    <button
                      type="button"
                      disabled={updatingId === order.id}
                      onClick={() => handleStatus(order.id, "DELIVERED")}
                      className="rounded-lg bg-emerald-600 text-white text-xs font-medium py-1.5 px-2.5 hover:opacity-90 disabled:opacity-50"
                    >
                      {updatingId === order.id ? "Updating…" : "Mark delivered"}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {showRewardsComing && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center space-y-4">
              <div className="text-4xl">🎁</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Coming Soon!</h2>
              <p className="text-slate-600 dark:text-slate-400">
                The Rewards & Points program will be available soon. Start earning on every delivery!
              </p>
              <button
                type="button"
                onClick={() => setShowRewardsComing(false)}
                className="w-full rounded-lg bg-amber-600 text-white font-medium py-2.5 hover:opacity-90"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
