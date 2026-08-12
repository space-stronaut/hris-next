"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CheckInTimeSetting({
  initialCheckInTime,
}: {
  initialCheckInTime: string;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialCheckInTime);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function save() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/company/checkin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ checkInTime: value }),
      });
      const data = await res.json();
      if (!res.ok) {
        setIsError(true);
        setMessage(data.message || "Gagal menyimpan.");
        setLoading(false);
        return;
      }
      setIsError(false);
      setMessage(`Jam masuk disimpan: ${data.checkInTime}`);
      router.refresh();
    } catch {
      setIsError(true);
      setMessage("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Jam Masuk Karyawan</h2>
      <p className="mt-1 text-sm text-slate-500">
        Berlaku untuk seluruh karyawan di perusahaan ini. Check-in setelah jam
        ini dianggap terlambat.
      </p>
      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Jam masuk
          </label>
          <input
            type="time"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="w-40 rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={save}
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan"}
        </button>
      </div>
      {message && (
        <p
          className={`mt-3 text-sm ${
            isError ? "text-red-600" : "text-green-600"
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}