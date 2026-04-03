const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/api";

let authToken: string | null = null;

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token") ?? authToken;
  }
  return authToken;
}

/** Backend JWT or Supabase access token (for API calls after Supabase sign-in). */
async function getApiToken(): Promise<string | null> {
  if (typeof window !== "undefined") {
    const backend = localStorage.getItem("token");
    if (backend) return backend;
    const { supabase } = await import("@/supabaseClient");
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session?.access_token ?? null;
  }
  return authToken;
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getApiToken();
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers || {}),
  };
  if (token) (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
  }
  return res.json();
}

export type User = {
  id: string;
  email: string;
  name: string;
  role: "STUDENT" | "PARTNER" | "ADMIN";
  studentId?: string;
  approved?: boolean;
  earnings?: number;
};

export type Order = {
  id: string;
  type: "FOOD" | "GROCERIES" | "PARCEL";
  pickupLocation: string;
  dropLocation: string;
  notes: string | null;
  paymentMethod: "UPI" | "CARD" | "COD";
  status: "PENDING" | "PICKED_UP" | "ON_THE_WAY" | "DELIVERED" | "CANCELLED";
  studentId: string;
  partnerId: string | null;
  amount: number;
  createdAt: string;
  student?: { name: string; email: string };
  partner?: { name: string; phone?: string };
};

export type Partner = {
  id: string;
  email: string;
  name: string;
  phone: string;
  approved: boolean;
  earnings?: number;
  createdAt?: string;
};
