"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

type CorrectionRow = {
  id: string;
  dateKey: string;
  status: string;
  reason: string;
};

type AttendanceRow = { id: string; dateKey: string; status: string };

export default function CorrectionForm({
  corrections,
  attendances,
  todayKey,
}: {
  corrections: CorrectionRow[];
  attendances: AttendanceRow[];
  todayKey: string;
}) {
  const router = useRouter();
  const [attendanceId, setAttendanceId] = useState(attendances[0]?.id || "");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pag = usePagination(corrections.length);
  const pageRows = corrections.slice(pag.start, pag.end);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/correction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendanceId,
          requestedCheckIn: checkIn ? `${todayKey}T${checkIn}:00` : null,
          requestedCheckOut: checkOut ? `${todayKey}T${checkOut}:00` : null,
          reason,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal mengajukan koreksi.");
        setLoading(false);
        return;
      }
      setCheckIn("");
      setCheckOut("");
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
        <h2 className="text-lg font-semibold text-slate-900">Ajukan Koreksi</h2>
        {attendances.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Belum ada data absensi untuk dikoreksi.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tanggal Absensi
              </label>
              <select
                value={attendanceId}
                onChange={(e) => setAttendanceId(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {attendances.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.dateKey} · {a.status}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Check In Baru
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
                Check Out Baru
              </label>
              <input
                type="time"
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Alasan
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Alasan koreksi"
              />
            </div>

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 sm:col-span-2 lg:col-span-5">
                {error}
              </div>
            )}

            <div className="sm:col-span-2 lg:col-span-5">
              <button
                type="submit"
                disabled={loading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {loading ? "Mengirim..." : "Ajukan Koreksi"}
              </button>
            </div>
          </form>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Riwayat Koreksi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Alasan</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {corrections.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Belum ada pengajuan koreksi.
                  </td>
                </tr>
              )}
              {pageRows.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 whitespace-nowrap">{c.dateKey}</td>
                  <td className="px-6 py-3 text-slate-600">{c.reason}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          total={corrections.length}
          page={pag.page}
          pageSize={pag.pageSize}
          onPageChange={pag.goToPage}
        />
      </div>
    </div>
  );
}