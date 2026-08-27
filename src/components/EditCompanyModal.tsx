"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function EditCompanyModal({
  company,
  onClose,
}: {
  company: { id: string; name: string; code: string; address: string | null };
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(company.name);
  const [code, setCode] = useState(company.code);
  const [address, setAddress] = useState(company.address || "");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan.");
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
    <Modal open onClose={onClose} title={`Edit · ${company.name}`}>
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nama PT
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Kode PT
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Alamat
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className={inputClass}
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