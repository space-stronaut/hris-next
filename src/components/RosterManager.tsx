"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

type UserRow = { id: string; name: string; shiftId: string | null; shift?: { name: string } | null };
type ShiftRow = { id: string; name: string; checkIn: string; checkOut: string };
type RosterRow = {
  id: string;
  dateKey: string;
  user: { id: string; name: string };
  shift: { id: string; name: string; checkIn: string; checkOut: string };
};

export default function RosterManager({
  users,
  shifts,
  rosters,
  todayKey,
}: {
  users: UserRow[];
  shifts: ShiftRow[];
  rosters: RosterRow[];
  todayKey: string;
}) {
  const router = useRouter();
  const [userId, setUserId] = useState(users[0]?.id || "");
  const [shiftId, setShiftId] = useState(shifts[0]?.id || "");
  const [dateKey, setDateKey] = useState(todayKey);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pag = usePagination(rosters.length);
  const pageRosters = rosters.slice(pag.start, pag.end);

  async function assign(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/roster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, shiftId, dateKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan roster.");
        setLoading(false);
        return;
      }
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  async function clearAssignment(id: string, userId: string, dateKey: string) {
    if (!confirm("Hapus roster ini? Shift default karyawan akan berlaku.")) return;
    const res = await fetch("/api/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, dateKey, shiftId: "" }),
    });
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
        <h2 className="text-lg font-semibold text-slate-900">Atur Shift per Tanggal</h2>
        <form onSubmit={assign} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Karyawan</label>
            <select
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} {u.shift?.name ? `(${u.shift.name})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Shift</label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.checkIn}–{s.checkOut})
                </option>
              ))}
            </select>
          </div>
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
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading || users.length === 0 || shifts.length === 0}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Atur Roster"}
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 sm:col-span-2 lg:col-span-4">
              {error}
            </div>
          )}
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Roster Hari Ini ({dateKey || todayKey})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Karyawan</th>
                <th className="px-6 py-3">Shift</th>
                <th className="px-6 py-3">Jam</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rosters.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Belum ada roster untuk tanggal ini.
                  </td>
                </tr>
              )}
              {pageRosters.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">{r.user.name}</td>
                  <td className="px-6 py-3 text-slate-700">{r.shift.name}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {r.shift.checkIn} – {r.shift.checkOut}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end">
                      <button
                        onClick={() => clearAssignment(r.id, r.user.id, r.dateKey)}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          total={rosters.length}
          page={pag.page}
          pageSize={pag.pageSize}
          onPageChange={pag.goToPage}
        />
      </div>
    </div>
  );
}