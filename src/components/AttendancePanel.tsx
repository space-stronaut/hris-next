"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export type TodayAttendance = {
  checkIn: string | null;
  checkOut: string | null;
  breakIn: string | null;
  breakOut: string | null;
  checkInPhoto: string | null;
  checkOutPhoto: string | null;
  recordType: "OFFICE" | "WFH" | "DINAS";
  shiftCheckIn: string | null;
  shiftCheckOut: string | null;
};

export default function AttendancePanel({
  today,
  shiftName,
}: {
  today: TodayAttendance | null;
  shiftName?: string | null;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [recordType, setRecordType] = useState<"OFFICE" | "WFH" | "DINAS">(
    today?.recordType || "OFFICE"
  );
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<TodayAttendance | null>(today);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelfiePreview(String(reader.result));
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  async function doAction(
    action: "check-in" | "check-out" | "break-in" | "break-out"
  ) {
    setLoading(true);
    setError("");
    try {
      let selfieKey: string | null = null;
      const needPhoto = action === "check-in" || action === "check-out";
      if (needPhoto && selfiePreview) {
        const up = await fetch("/api/attendance/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: selfiePreview,
            purpose: action === "check-in" ? "in" : "out",
          }),
        });
        const upData = await up.json();
        if (!up.ok) {
          setError(upData.message || "Gagal mengunggah foto.");
          setLoading(false);
          return;
        }
        selfieKey = upData.key;
      }

      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, recordType, selfieKey }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Terjadi kesalahan.");
        setLoading(false);
        return;
      }
      if (action === "check-in") {
        const now = new Date().toISOString();
        setState({
          checkIn: now,
          checkOut: null,
          breakIn: null,
          breakOut: null,
          checkInPhoto: selfieKey || data.record?.checkInPhoto || null,
          checkOutPhoto: null,
          recordType,
          shiftCheckIn: data.record?.shiftCheckIn ?? null,
          shiftCheckOut: data.record?.shiftCheckOut ?? null,
        });
        setSelfiePreview(null);
      } else if (action === "check-out") {
        setState((s) =>
          s
            ? {
                ...s,
                checkOut: new Date().toISOString(),
                checkOutPhoto: selfieKey || null,
              }
            : s
        );
        setSelfiePreview(null);
      } else if (action === "break-in") {
        setState((s) => (s ? { ...s, breakIn: new Date().toISOString() } : s));
      } else if (action === "break-out") {
        setState((s) => (s ? { ...s, breakOut: new Date().toISOString() } : s));
      }
      router.refresh();
    } catch {
      setError("Terjadi kesalahan. Coba lagi.");
      setLoading(false);
    }
  }

  const done = state?.checkOut;
  const onBreak = !!state?.breakIn && !state?.breakOut;
  const canCapture = !done && selfiePreview === null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Absensi Hari Ini</h2>
        {shiftName && (
          <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            Shift: {shiftName}
          </span>
        )}
      </div>

      {state?.shiftCheckIn && !done && (
        <p className="mt-1 text-xs text-slate-500">
          Jadwal shift: {state.shiftCheckIn} – {state.shiftCheckOut || "?"}
        </p>
      )}

      {error && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
          {error}
        </div>
      )}

      {!state && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Tipe Kehadiran
          </label>
          <div className="flex gap-2">
            {(["OFFICE", "WFH", "DINAS"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRecordType(t)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                  recordType === t
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {t === "OFFICE" ? "Kantor" : t === "WFH" ? "WFH" : "Dinas Luar"}
              </button>
            ))}
          </div>
          <SelfieCapture
            preview={selfiePreview}
            canCapture={canCapture}
            onShowPicker={() => fileRef.current?.click()}
            onClear={() => setSelfiePreview(null)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={onFileChange}
          />
          <button
            onClick={() => doAction("check-in")}
            disabled={loading}
            className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Check In"}
          </button>
        </div>
      )}

      {state && !done && (
        <div className="mt-4 space-y-3">
          <SelfieCapture
            preview={selfiePreview}
            canCapture={canCapture}
            onShowPicker={() => fileRef.current?.click()}
            onClear={() => setSelfiePreview(null)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="user"
            className="hidden"
            onChange={onFileChange}
          />
          <div className="flex flex-wrap gap-3">
            {!state.breakIn && (
              <button
                onClick={() => doAction("break-in")}
                disabled={loading}
                className="flex-1 rounded-lg bg-amber-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:opacity-40"
              >
                Mulai Istirahat
              </button>
            )}
            {onBreak && (
              <button
                onClick={() => doAction("break-out")}
                disabled={loading}
                className="flex-1 rounded-lg bg-amber-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:opacity-40"
              >
                Akhiri Istirahat
              </button>
            )}
            <button
              onClick={() => doAction("check-out")}
              disabled={loading}
              className="flex-1 rounded-lg bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e293b] disabled:opacity-40"
            >
              Check Out
            </button>
          </div>
        </div>
      )}

      <p className="mt-3 text-xs text-slate-500">
        {!state && "Anda belum check-in hari ini."}
        {state && !done && (onBreak ? "Sedang istirahat." : "Anda sudah check-in.")}
        {done && "Anda sudah menyelesaikan absensi hari ini."}
      </p>
    </div>
  );
}

function SelfieCapture({
  preview,
  canCapture,
  onShowPicker,
  onClear,
}: {
  preview: string | null;
  canCapture: boolean;
  onShowPicker: () => void;
  onClear: () => void;
}) {
  return (
    <div className="mt-3 flex items-center gap-3">
      {preview ? (
        <>
          <img
            src={preview}
            alt="Selfie preview"
            className="h-16 w-16 rounded-lg border border-slate-300 object-cover"
          />
          <button
            type="button"
            onClick={onClear}
            disabled={!canCapture}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
          >
            Ganti Selfie
          </button>
          <span className="text-xs text-green-600">Selfie siap</span>
        </>
      ) : (
        <button
          type="button"
          onClick={onShowPicker}
          disabled={!canCapture}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          Ambil Selfie
        </button>
      )}
    </div>
  );
}