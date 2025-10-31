"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const PORTAL_CODE = process.env.NEXT_PUBLIC_ADMIN_PORTAL_CODE || "AdminPortal123!";

  useEffect(() => {
    // Require primary auth first
    if (!user) {
      router.replace("/auth/login?redirect=/admin/login");
    }
  }, [user, router]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!user || user.role !== "admin") {
        toast.error("Admin account required");
        return;
      }
      if (password !== PORTAL_CODE) {
        toast.error("Invalid admin portal password");
        return;
      }
      // mark portal auth: set cookie so middleware can enforce without flicker
      if (typeof window !== 'undefined') {
        try {
          const secure = window.location.protocol === 'https:';
          document.cookie = `admin_portal_ok=1; Path=/; SameSite=Lax${secure ? '; Secure' : ''}`;
        } catch {}
      }
      router.push("/admin/dashboard");
      toast.success("Welcome, Admin");
    } catch (err: any) {
      toast.error(err?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-xl">
        <div className="p-4 sm:p-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-900 dark:text-slate-100">Admin Portal</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Secondary verification for administrators</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm mb-1 text-slate-700 dark:text-slate-300">Admin Portal Password</label>
              <input
                className="w-full rounded-md bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-blue-600 hover:bg-blue-500 disabled:opacity-60 py-2 font-medium text-white"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
            <p className="text-xs text-slate-500 dark:text-slate-400">Hint (dev): configured via NEXT_PUBLIC_ADMIN_PORTAL_CODE</p>
          </form>
        </div>
      </div>
    </div>
  );
}
