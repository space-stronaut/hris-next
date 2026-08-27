"use client";

import { useState, FormEvent } from "react";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (newPassword !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/profile/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal mengubah password.");
        setLoading(false);
        return;
      }
      setMessage("Password berhasil diubah.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Password Lama
        </label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          required
          className={inputClass}
          placeholder="Password saat ini"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Password Baru
        </label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          className={inputClass}
          placeholder="Minimal 6 karakter"
        />
      </div>
      <div className="sm:col-span-2">
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Konfirmasi Password Baru
        </label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          className={inputClass}
          placeholder="Ulangi password baru"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 sm:col-span-2">
          {message}
        </div>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Ganti Password"}
        </button>
      </div>
    </form>
  );
}