"use client";

import { useState, FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Login gagal.");
        setLoading(false);
        return;
      }
      const target =
        data.role === "SUPER_ADMIN"
          ? "/super/companies"
          : data.role === "ADMIN"
          ? "/admin"
          : data.role === "HRD"
          ? "/hrd"
          : data.role === "SPV"
          ? "/spv"
          : "/dashboard";
      router.replace(from || target);
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-surface rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600 text-white text-2xl font-bold">
            A
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Masuk ke Aplikasi</h1>
          <p className="text-sm text-slate-500 mt-1">HRIS Ultimate</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Masukkan username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Masukkan password"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>
      </div>
    </div>
  );
}
