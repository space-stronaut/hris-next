"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

type ShiftRow = {
  id: string;
  name: string;
  checkIn: string;
  checkOut: string;
  tolerance: number;
  active: boolean;
  _count: { users: number };
};

export default function ShiftManager({ shifts }: { shifts: ShiftRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [checkIn, setCheckIn] = useState("08:00");
  const [checkOut, setCheckOut] = useState("17:00");
  const [tolerance, setTolerance] = useState("0");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function createShift(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/shifts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          checkIn,
          checkOut,
          tolerance: Number(tolerance) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menambah shift.");
        setLoading(false);
        return;
      }
      setName("");
      setCheckIn("08:00");
      setCheckOut("17:00");
      setTolerance("0");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  async function toggleShift(id: string, active: boolean) {
    const res = await fetch(`/api/shifts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Gagal mengubah shift.");
      return;
    }
    router.refresh();
  }

  async function deleteShift(id: string) {
    if (!confirm("Yakin menghapus shift ini? Karyawan yang memakai shift ini akan kehilangan shift defaultnya.")) return;
    const res = await fetch(`/api/shifts/${id}`, { method: "DELETE" });
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
        <h2 className="text-lg font-semibold text-slate-900">Tambah Shift</h2>
        <form onSubmit={createShift} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Shift
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="cth. Pagi / Malam"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Jam Masuk
            </label>
            <input
              type="time"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Jam Keluar
            </label>
            <input
              type="time"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Toleransi (menit)
            </label>
            <input
              type="number"
              min="0"
              max="300"
              value={tolerance}
              onChange={(e) => setTolerance(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
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
              {loading ? "Menyimpan..." : "Tambah Shift"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Daftar Shift</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Shift</th>
                <th className="px-6 py-3">Masuk</th>
                <th className="px-6 py-3">Keluar</th>
                <th className="px-6 py-3">Toleransi</th>
                <th className="px-6 py-3">Karyawan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((s) => (
                <tr key={s.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">{s.name}</td>
                  <td className="px-6 py-3 text-slate-700">{s.checkIn}</td>
                  <td className="px-6 py-3 text-slate-700">{s.checkOut}</td>
                  <td className="px-6 py-3 text-slate-600">{s.tolerance} mnt</td>
                  <td className="px-6 py-3 text-slate-600">{s._count.users} org</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        s.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {s.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggleShift(s.id, s.active)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        {s.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => deleteShift(s.id)}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {shifts.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Belum ada shift. Tambahkan shift terlebih dahulu.
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