"use client";

import { api, setAuthToken, User } from "@/lib/api";
import { supabase } from "@/supabaseClient";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

function isAppRole(value: unknown): value is User["role"] {
  return value === "STUDENT" || value === "PARTNER" || value === "ADMIN";
}

function resolveSupabaseRole(u: SupabaseUser): User["role"] {
  const metadataRole =
    (typeof u.user_metadata?.role === "string" && u.user_metadata.role.toUpperCase()) ||
    (typeof u.app_metadata?.role === "string" && u.app_metadata.role.toUpperCase()) ||
    "";
  if (isAppRole(metadataRole)) return metadataRole;

  const adminEmailList = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const email = (u.email || "").toLowerCase();
  if (email && adminEmailList.includes(email)) return "ADMIN";

  return "STUDENT";
}

function mapSupabaseUser(u: SupabaseUser): User {
  const email = u.email ?? "";
  const name =
    (typeof u.user_metadata?.name === "string" && u.user_metadata.name) ||
    (typeof u.user_metadata?.full_name === "string" && u.user_metadata.full_name) ||
    email.split("@")[0] ||
    "User";
  return {
    id: u.id,
    email,
    name,
    role: resolveSupabaseRole(u),
  };
}

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  partnerLogin: (email: string, password: string) => Promise<void>;
  register: (email: string, studentId: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const refreshUser = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(mapSupabaseUser(session.user));
      setLoading(false);
      return;
    }

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (!token) {
      setUser(null);
      setAuthToken(null);
      setLoading(false);
      return;
    }
    setAuthToken(token);
    try {
      const u = await api<User>("/auth/me");
      setUser(u);
    } catch {
      localStorage.removeItem("token");
      setAuthToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) setUser(null);
        else void refreshUser();
      }
    });
    return () => subscription.unsubscribe();
  }, [refreshUser]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { token, user: u } = await api<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", token);
      setAuthToken(token);
      setUser(u);
      if (u.role === "STUDENT") router.push("/student/dashboard");
      else if (u.role === "ADMIN") router.push("/admin/dashboard");
      else router.push("/");
    },
    [router]
  );

  const partnerLogin = useCallback(
    async (email: string, password: string) => {
      const { token, user: u } = await api<{ token: string; user: User }>("/auth/partner-login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem("token", token);
      setAuthToken(token);
      setUser(u);
      router.push("/partner/dashboard");
    },
    [router]
  );

  const register = useCallback(
    async (email: string, studentId: string, password: string, name: string) => {
      const { token, user: u } = await api<{ token: string; user: User }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, studentId, password, name }),
      });
      localStorage.setItem("token", token);
      setAuthToken(token);
      setUser(u);
      router.push("/student/dashboard");
    },
    [router]
  );

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("token");
    setAuthToken(null);
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, partnerLogin, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
