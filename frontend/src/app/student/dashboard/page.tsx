"use client";

import { DashboardLayout } from "@/components/DashboardLayout";
import OrderForm from "@/components/OrderForm";
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

export default function StudentDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrders = async () => {
    try {
      const list = await api<Order[]>("/orders/mine");
      setOrders(list);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    if (user.role !== "STUDENT") return;
    fetchOrders();
    const t = setInterval(fetchOrders, 8000);
    return () => clearInterval(t);
  }, [user?.id, user?.role]);

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
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-center">
          <p className="mb-2">Sign in as a student to place orders and view history.</p>
          <Link href="/login" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
            Sign in
          </Link>
          {" · "}
          <Link href="/register" className="font-medium hover:underline">Register</Link>
        </div>
      </DashboardLayout>
    );
  }

  if (user.role !== "STUDENT") {
    return (
      <DashboardLayout>
        <p className="text-slate-500">This page is for students. You are signed in as {user.role}.</p>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Student Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">Place orders and track delivery</p>
        </div>

        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Place an order</h2>
          <OrderForm onOrderCreated={() => fetchOrders()} />
        </section>

        <section className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 p-6">
          <h2 className="text-lg font-semibold mb-4">Your orders</h2>
          {loading ? (
            <p className="text-slate-500 text-sm">Loading orders…</p>
          ) : error ? (
            <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
          ) : orders.length === 0 ? (
            <p className="text-slate-500 text-sm">No orders yet. Place one above.</p>
          ) : (
            <ul className="space-y-3">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 dark:border-slate-600 p-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{order.type} · ₹{order.amount || 0}</p>
                    <p className="text-slate-600 dark:text-slate-400 text-xs truncate">
                      {order.pickupLocation} → {order.dropLocation}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-500 mt-0.5">
                      {order.paymentMethod} · {new Date(order.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_COLORS[order.status] ?? "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {STATUS_LABELS[order.status] ?? order.status}
                  </span>
                  {order.partner && (
                    <span className="w-full text-xs text-slate-500 dark:text-slate-400">
                      Partner: {order.partner.name}
                    </span>
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
