"use client";

import { LocationMapPicker } from "@/components/LocationMapPicker";
import { api, Order } from "@/lib/api";
import { useState } from "react";

type Props = { onOrderCreated?: (order: Order) => void };

export default function OrderForm({ onOrderCreated }: Props) {
  const [type, setType] = useState<"FOOD" | "GROCERIES" | "PARCEL">("FOOD");
  const [pickup, setPickup] = useState("");
  const [drop, setDrop] = useState("");
  const [notes, setNotes] = useState("");
  const [payment, setPayment] = useState<"UPI" | "CARD" | "COD">("UPI");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const order = await api<Order>("/orders", {
        method: "POST",
        body: JSON.stringify({
          type,
          pickupLocation: pickup,
          dropLocation: drop,
          notes: notes || undefined,
          paymentMethod: payment,
          amount: amount ? parseInt(amount, 10) : 0,
        }),
      });
      setPickup("");
      setDrop("");
      setNotes("");
      setAmount("");
      onOrderCreated?.(order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium mb-1">Type</label>
        <select
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          value={type}
          onChange={(e) => setType(e.target.value as "FOOD" | "GROCERIES" | "PARCEL")}
        >
          <option value="FOOD">Food</option>
          <option value="GROCERIES">Groceries</option>
          <option value="PARCEL">Parcel</option>
        </select>
      </div>
      <LocationMapPicker
        label="Pickup location"
        value={pickup}
        onChange={setPickup}
        required
      />
      <LocationMapPicker
        label="Drop location"
        value={drop}
        onChange={setDrop}
        required
      />
      <div>
        <label className="block text-sm font-medium mb-1">Notes (optional)</label>
        <input
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Payment</label>
        <select
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          value={payment}
          onChange={(e) => setPayment(e.target.value as "UPI" | "CARD" | "COD")}
        >
          <option value="UPI">UPI</option>
          <option value="CARD">Card</option>
          <option value="COD">Cash on Delivery</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Amount (₹, optional)</label>
        <input
          type="number"
          min={0}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-600 text-white font-medium py-2 text-sm hover:opacity-90 disabled:opacity-50"
      >
        {loading ? "Placing order…" : "Place order"}
      </button>
    </form>
  );
}
