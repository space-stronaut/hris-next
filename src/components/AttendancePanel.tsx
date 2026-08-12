"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AttendancePanel({
  initialStatus,
}: {
  initialStatus: "NONE" | "IN" | "OUT";
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState(initialStatus);

  async function doAction(action: "check-in" | "check-out") {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Terjadi kesalahan.");
        setLoading(false);
        return;
      }
      setStatus(action === "check-in" ? "IN" : "OUT");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Absensi Hari Ini</h2>

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      <div className="mt-4 flex gap-3">
        <button
          onClick={() => doAction("check-in")}
          disabled={loading || status !== "NONE"}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check In
        </button>
        <button
          onClick={() => doAction("check-out")}
          disabled={loading || status === "NONE" || status === "OUT"}
          className="flex-1 rounded-lg bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e293b] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Check Out
        </button>
      </div>

      <p className="mt-3 text-xs text-slate-500">
        {status === "NONE" && "Anda belum check-in hari ini."}
        {status === "IN" && "Anda sudah check-in, silakan check-out saat selesai."}
        {status === "OUT" && "Anda sudah menyelesaikan absensi hari ini."}
      </p>
    </div>
  );
}
