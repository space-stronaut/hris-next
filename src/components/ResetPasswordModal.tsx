"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function ResetPasswordModal({
  companyId,
  adminId,
  adminName,
  onClose,
}: {
  companyId: string;
  adminId: string;
  adminName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Password tidak boleh kosong.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${companyId}/admins/${adminId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal mereset password.");
        setLoading(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Reset Password · ${adminName}`}>
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Password Baru
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Password baru"
            autoFocus
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}