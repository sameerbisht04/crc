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

  const fetchData = async () => {
    if (!user || user.role !== "PARTNER") return;
    try {
      const [avail, mine] = await Promise.all([
        api<Order[]>("/orders/available"),
        api<Order[]>("/partners/me/orders"),
      ]);
      setAvailable(avail);
      setMyOrders(mine);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
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
              href="/login"
              className="rounded-lg border border-slate-300 dark:border-slate-600 font-medium py-2 px-4 text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Sign in
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
      </div>
    </DashboardLayout>
  );
}
