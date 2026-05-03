"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { api, Order, OrderTracking, Partner } from "@/lib/api";
import { useEffect, useState } from "react";

type Stats = { ordersToday: number; totalEarnings: number };

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  PICKED_UP: "Picked up",
  ON_THE_WAY: "On the way",
  DELIVERED: "Delivered",
  CANCELLED: "Cancelled",
};

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [pendingPartners, setPendingPartners] = useState<Partner[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [tracking, setTracking] = useState<Record<string, OrderTracking>>({});

  const fetchData = async () => {
    if (!user || user.role !== "ADMIN") return;
    try {
      const [s, partners, ords] = await Promise.all([
        api<Stats>("/admin/stats"),
        api<Partner[]>("/admin/partners/pending"),
        api<Order[]>("/admin/orders"),
      ]);
      setStats(s);
      setPendingPartners(partners);
      setOrders(ords);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "ADMIN") return;
    fetchData();
    const t = setInterval(fetchData, 10000);
    return () => clearInterval(t);
  }, [user?.id, user?.role]);

  useEffect(() => {
    if (!user || user.role !== "ADMIN" || orders.length === 0) return;
    const activeParcelIds = orders
      .filter((order) => order.type === "PARCEL" && (order.status === "PICKED_UP" || order.status === "ON_THE_WAY"))
      .map((order) => order.id);
    if (activeParcelIds.length === 0) return;

    let active = true;
    const sync = async () => {
      try {
        const rows = await Promise.all(
          activeParcelIds.map((id) => api<OrderTracking>(`/orders/${id}/tracking`))
        );
        if (!active) return;
        const next: Record<string, OrderTracking> = {};
        rows.forEach((row) => {
          next[row.orderId] = row;
        });
        setTracking(next);
      } catch {
        // ignore transient errors
      }
    };
    void sync();
    const timer = setInterval(sync, 7000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [user?.id, user?.role, orders]);

  async function handleApprove(partnerId: string) {
    setApprovingId(partnerId);
    try {
      await api(`/admin/partners/${partnerId}/approve`, { method: "POST" });
      await fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setApprovingId(null);
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
        <div className="rounded-lg border border-sky-200 dark:border-sky-800 bg-sky-50 dark:bg-sky-900/20 p-6 text-center max-w-md mx-auto">
          <h2 className="font-semibold mb-2">Admin</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
            Sign in with an admin account to manage partners and view analytics.
          </p>
          <a href="/admin/login" className="text-sky-600 dark:text-sky-400 font-medium hover:underline">
            Admin sign in
          </a>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role !== "ADMIN") {
    return (
      <DashboardLayout>
        <p className="text-slate-500">This page is for admins. You are signed in as {user.role}.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Manage partners and view analytics</p>
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 rounded-lg bg-red-50 dark:bg-red-900/20 p-2">
            {error}
          </p>
        )}

        {loading ? (
          <p className="text-slate-500 text-sm">Loading…</p>
        ) : (
          <>
            <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">Today&apos;s orders</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  {stats?.ordersToday ?? 0}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
                <p className="text-sm text-slate-500 dark:text-slate-400">Total platform earnings</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                  ₹{stats?.totalEarnings ?? 0}
                </p>
              </div>
            </section>

            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
              <h2 className="text-lg font-semibold mb-4">Pending partner approvals</h2>
              {pendingPartners.length === 0 ? (
                <p className="text-slate-500 text-sm">No pending approvals.</p>
              ) : (
                <ul className="space-y-4">
                  {pendingPartners.map((p) => (
                    <li
                      key={p.id}
                      className="rounded-lg border border-slate-200 dark:border-slate-600 p-4 space-y-3"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-slate-600 dark:text-slate-400 text-xs">{p.email} · {p.phone}</p>
                        </div>
                        <button
                          type="button"
                          disabled={approvingId === p.id}
                          onClick={() => handleApprove(p.id)}
                          className="rounded-lg bg-emerald-600 text-white text-sm font-medium py-1.5 px-3 hover:opacity-90 disabled:opacity-50 whitespace-nowrap"
                        >
                          {approvingId === p.id ? "Approving…" : "Approve"}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg text-xs">
                        {(p as any).usn && (
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">USN</p>
                            <p className="font-medium">{(p as any).usn}</p>
                          </div>
                        )}
                        {(p as any).collegeYear && (
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">College Year</p>
                            <p className="font-medium">{(p as any).collegeYear}</p>
                          </div>
                        )}
                        {(p as any).enrollmentNo && (
                          <div>
                            <p className="text-slate-500 dark:text-slate-400">Enrollment No</p>
                            <p className="font-medium">{(p as any).enrollmentNo}</p>
                          </div>
                        )}
                      </div>
                      {(p as any).idCardUrl && (
                        <div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">ID Card</p>
                          <img
                            src={(p as any).idCardUrl}
                            alt="ID Card"
                            className="max-w-xs max-h-48 rounded-lg border border-slate-200 dark:border-slate-600"
                          />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
              <h2 className="text-lg font-semibold mb-4">All orders</h2>
              {orders.length === 0 ? (
                <p className="text-slate-500 text-sm">No orders yet.</p>
              ) : (
                <ul className="space-y-2">
                  {orders.map((order) => (
                    <li
                      key={order.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-600 p-2 text-sm"
                    >
                      <div className="min-w-0 truncate">
                        <span className="font-medium">{order.type}</span>
                        {" · "}
                        <span className="text-slate-600 dark:text-slate-400">
                          {order.student?.name ?? order.studentId} → {order.partner?.name ?? "—"}
                        </span>
                        {" · "}
                        <span className="text-slate-500">{STATUS_LABELS[order.status] ?? order.status}</span>
                        {order.type === "PARCEL" && tracking[order.id]?.tracking && (
                          <>
                            {" · "}
                            <a
                              href={`https://www.openstreetmap.org/?mlat=${tracking[order.id]!.tracking!.latitude}&mlon=${tracking[order.id]!.tracking!.longitude}#map=16/${tracking[order.id]!.tracking!.latitude}/${tracking[order.id]!.tracking!.longitude}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sky-600 dark:text-sky-400 hover:underline"
                            >
                              Live track ({tracking[order.id]!.history.length})
                            </a>
                          </>
                        )}
                      </div>
                      <span className="text-slate-500 shrink-0">₹{order.amount ?? 0}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
