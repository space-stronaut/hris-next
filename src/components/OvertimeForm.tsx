"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/OvertimeApprovals";

type OvertimeRow = {
  id: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  payAmount: number;
  reason: string;
  status: string;
};

export default function OvertimeForm({
  overtimes,
  todayKey,
}: {
  overtimes: OvertimeRow[];
  todayKey: string;
}) {
  const router = useRouter();
  const [dateKey, setDateKey] = useState(todayKey);
  const [startTime, setStartTime] = useState("18:00");
  const [endTime, setEndTime] = useState("20:00");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/overtime", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dateKey, startTime, endTime, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal mengajukan lembur.");
        setLoading(false);
        return;
      }
      setReason("");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Ajukan Lembur</h2>
        <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
            <input
              type="date"
              value={dateKey}
              onChange={(e) => setDateKey(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mulai</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Selesai</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alasan</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Alasan lembur"
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
              {loading ? "Mengirim..." : "Ajukan Lembur"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Riwayat Lembur</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Jam</th>
                <th className="px-6 py-3">Durasi</th>
                <th className="px-6 py-3">Alasan</th>
                <th className="px-6 py-3">Upah</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {overtimes.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Belum ada pengajuan lembur.
                  </td>
                </tr>
              )}
              {overtimes.map((o) => (
                <tr key={o.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 whitespace-nowrap">{o.dateKey}</td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    {o.startTime} – {o.endTime}
                  </td>
                  <td className="px-6 py-3">{o.durationMinutes} mnt</td>
                  <td className="px-6 py-3 text-slate-600">{o.reason}</td>
                  <td className="px-6 py-3 text-slate-700">
                    {o.payAmount > 0
                      ? `Rp ${o.payAmount.toLocaleString("id-ID")}`
                      : "-"}
                  </td>
                  <td className="px-6 py-3">
                    <StatusBadge status={o.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}