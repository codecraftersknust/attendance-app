"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiClient } from "@/lib/api";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const { login, logout } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("admin@absense.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      const me = await apiClient.getCurrentUser();
      if (me.role !== "admin") {
        toast.error("Admin account required");
        logout();
        return;
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
    <div className="min-h-screen bg-[#0b1220] text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-blue-900/40 bg-[#0e1626] shadow-xl">
        <div className="p-6">
          <h1 className="text-2xl font-semibold text-blue-200">Admin Portal</h1>
          <p className="text-sm text-blue-300/70 mt-1">Sign in with your admin credentials</p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm mb-1 text-blue-200">Email</label>
              <input
                className="w-full rounded-md bg-[#0b1220] border border-blue-900/50 px-3 py-2 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-700"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@absense.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm mb-1 text-blue-200">Password</label>
              <input
                className="w-full rounded-md bg-[#0b1220] border border-blue-900/50 px-3 py-2 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-700"
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
              className="w-full rounded-md bg-blue-700 hover:bg-blue-600 disabled:opacity-60 py-2 font-medium"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
