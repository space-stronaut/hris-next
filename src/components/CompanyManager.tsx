"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type CompanyRow = {
  id: string;
  name: string;
  code: string;
  address: string | null;
  createdAt: Date;
  _count: { users: number };
};

export default function CompanyManager({ companies }: { companies: CompanyRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createCompany(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, address }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menambah PT.");
        setLoading(false);
        return;
      }
      setName("");
      setCode("");
      setAddress("");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  async function editCompany(c: CompanyRow) {
    const newName = window.prompt("Nama PT:", c.name);
    if (newName === null) return;
    const newCode = window.prompt("Kode PT:", c.code);
    if (newCode === null) return;
    const newAddress = window.prompt("Alamat:", c.address || "");
    if (newAddress === null) return;

    const res = await fetch(`/api/companies/${c.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, code: newCode, address: newAddress }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Gagal menyimpan.");
      return;
    }
    router.refresh();
  }

  async function deleteCompany(id: string) {
    if (
      !confirm(
        "Yakin ingin menghapus PT ini? Semua user dan datanya akan ikut terhapus."
      )
    )
      return;
    const res = await fetch(`/api/companies/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Gagal menghapus.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tambah Perusahaan</h2>
        <form onSubmit={createCompany} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama PT
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="PT Contoh Jaya"
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="msj"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Alamat
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Alamat perusahaan"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 sm:col-span-2 lg:col-span-4">
              {error}
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Tambah Perusahaan"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Daftar Perusahaan
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Kode</th>
                <th className="px-6 py-3">Alamat</th>
                <th className="px-6 py-3">Karyawan</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {companies.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {c.name}
                  </td>
                  <td className="px-6 py-3">
                    <span className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{c.address || "-"}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {c._count.users} user
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/super/companies/${c.id}/admins`}
                        className="rounded-md border border-blue-300 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Kelola Admin
                      </Link>
                      <button
                        onClick={() => editCompany(c)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteCompany(c.id)}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {companies.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Belum ada perusahaan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
