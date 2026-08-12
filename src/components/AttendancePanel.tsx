"use client";

import { useState, useRef, useEffect } from "react";
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
  const [recordType, setRecordType] = useState<"OFFICE" | "WFH" | "DINAS">(
    today?.recordType || "OFFICE"
  );
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [gps, setGps] = useState<{
    status: "idle" | "loading" | "ready" | "error";
    lat: number | null;
    lng: number | null;
    message: string;
  }>({ status: "idle", lat: null, lng: null, message: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [state, setState] = useState<TodayAttendance | null>(today);

  const gpsReady = gps.status === "ready" && gps.lat !== null && gps.lng !== null;

  function acquireGps() {
    setGps({ status: "loading", lat: null, lng: null, message: "" });
    if (!navigator.geolocation) {
      setGps({ status: "error", lat: null, lng: null, message: "Perangkat tidak mendukung GPS." });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setGps({
          status: "ready",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          message: "",
        }),
      (err) =>
        setGps({
          status: "error",
          lat: null,
          lng: null,
          message:
            err.code === err.PERMISSION_DENIED
              ? "Izinkan akses lokasi untuk absensi kantor."
              : "Gagal mendapatkan lokasi GPS.",
        }),
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 0 }
    );
  }

  useEffect(() => {
    const t = setTimeout(() => {
      acquireGps();
    }, 0);
    return () => clearTimeout(t);
  }, []);

  async function doAction(
    action: "check-in" | "check-out" | "break-in" | "break-out"
  ) {
    setLoading(true);
    setError("");
    try {
      const isOffice =
        action === "check-out"
          ? state?.recordType === "OFFICE"
          : action === "check-in" && recordType === "OFFICE";

      if (isOffice && !gpsReady) {
        setError("Lokasi GPS belum siap. Mohon tunggu / izinkan akses lokasi.");
        setLoading(false);
        return;
      }

      let selfieKey: string | null = null;
      const needPhoto = action === "check-in" || action === "check-out";
      if (needPhoto && !selfieDataUrl) {
        setError("Selfie wajib diambil sebelum check-in / check-out.");
        setLoading(false);
        return;
      }
      if (needPhoto && selfieDataUrl) {
        const up = await fetch("/api/attendance/photo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: selfieDataUrl,
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
        body: JSON.stringify({
          action,
          recordType,
          selfieKey,
          lat: gps.lat,
          lng: gps.lng,
        }),
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
        setSelfieDataUrl(null);
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
        setSelfieDataUrl(null);
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
  const geoRequired = state
    ? state.recordType === "OFFICE"
    : recordType === "OFFICE";

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

          <SelfieSection
            dataUrl={selfieDataUrl}
            disabled={loading}
            onCapture={setSelfieDataUrl}
          />

          <GeoStatus required={geoRequired} gps={gps} ready={gpsReady} onRetry={acquireGps} />

          <button
            onClick={() => doAction("check-in")}
            disabled={loading || !selfieDataUrl || (geoRequired && !gpsReady)}
            className="mt-3 w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Check In"}
          </button>
          {!selfieDataUrl && (
            <p className="mt-2 text-xs text-red-500">
              Ambil selfie terlebih dahulu untuk check-in.
            </p>
          )}
          {geoRequired && selfieDataUrl && !gpsReady && (
            <p className="mt-2 text-xs text-red-500">
              Tunggu lokasi GPS siap untuk check-in kantor.
            </p>
          )}
        </div>
      )}

      {state && !done && (
        <div className="mt-4 space-y-3">
          <SelfieSection
            dataUrl={selfieDataUrl}
            disabled={loading}
            onCapture={setSelfieDataUrl}
          />
          <GeoStatus required={geoRequired} gps={gps} ready={gpsReady} onRetry={acquireGps} />
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
              disabled={loading || !selfieDataUrl || (geoRequired && !gpsReady)}
              className="flex-1 rounded-lg bg-[#0f172a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1e293b] disabled:opacity-40"
            >
              Check Out
            </button>
          </div>
          {!selfieDataUrl && (
            <p className="text-xs text-red-500">
              Ambil selfie terlebih dahulu untuk check-out.
            </p>
          )}
          {geoRequired && selfieDataUrl && !gpsReady && (
            <p className="text-xs text-red-500">
              Tunggu lokasi GPS siap untuk check-out.
            </p>
          )}
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

function GeoStatus({
  required,
  gps,
  ready,
  onRetry,
}: {
  required: boolean;
  gps: { status: string; lat: number | null; lng: number | null; message: string };
  ready: boolean;
  onRetry: () => void;
}) {
  let label = "Lokasi GPS: menunggu...";
  let color = "text-slate-500";
  if (gps.status === "loading") {
    label = "Lokasi GPS: mengambil...";
  } else if (ready) {
    label = `Lokasi GPS: siap (${gps.lat?.toFixed(5)}, ${gps.lng?.toFixed(5)})`;
    color = "text-green-600";
  } else if (gps.status === "error") {
    label = gps.message || "Lokasi GPS: gagal.";
    color = "text-red-600";
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
      <span className={color}>{label}</span>
      {required && !ready && gps.status !== "loading" && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-md border border-slate-300 px-2 py-0.5 font-medium text-slate-600 hover:bg-slate-100"
        >
          Cari Lokasi
        </button>
      )}
    </div>
  );
}

function SelfieSection({
  dataUrl,
  disabled,
  onCapture,
}: {
  dataUrl: string | null;
  disabled: boolean;
  onCapture: (url: string) => void;
}) {
  const [showCamera, setShowCamera] = useState(false);

  if (dataUrl) {
    return (
      <div className="mt-3 flex items-center gap-3">
        <img
          src={dataUrl}
          alt="selfie"
          className="h-16 w-16 rounded-lg border border-slate-300 object-cover"
        />
        <span className="text-xs text-green-600">Selfie siap</span>
        <button
          type="button"
          disabled={disabled}
          onClick={() => {
            onCapture("");
            setShowCamera(true);
          }}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 disabled:opacity-40"
        >
          Ganti Selfie
        </button>
      </div>
    );
  }

  if (!showCamera) {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => setShowCamera(true)}
        className="mt-3 rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 disabled:opacity-40"
      >
        Buka Kamera untuk Selfie
      </button>
    );
  }

  return <CameraCapture onCaptured={onCapture} onCancel={() => setShowCamera(false)} />;
}

function CameraCapture({
  onCaptured,
  onCancel,
}: {
  onCaptured: (url: string) => void;
  onCancel: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [camReady, setCamReady] = useState(false);
  const [error, setError] = useState("");

  async function start() {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("unsupported");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => setCamReady(false));
      }
    } catch {
      setCamReady(false);
      setError(
        "Kamera tidak dapat diakses. Pastikan izin kamera diberikan dan aplikasi diakses via HTTPS (atau localhost)."
      );
    }
  }

  useEffect(() => {
    const t = setTimeout(() => {
      start();
    }, 0);
    return () => {
      clearTimeout(t);
      streamRef.current?.getTracks().forEach((x) => x.stop());
      streamRef.current = null;
    };
  }, []);

  function capture() {
    const v = videoRef.current;
    if (!v || !v.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth;
    canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(v, 0, 0);
    const url = canvas.toDataURL("image/jpeg", 0.65);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    onCaptured(url);
  }

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
      <div className="relative mx-auto w-full max-w-[240px] overflow-hidden rounded-lg bg-black">
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          onLoadedData={() => setCamReady(true)}
          onCanPlay={() => setCamReady(true)}
          className="aspect-[4/3] w-full"
        />
        {!camReady && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white">
            Memuat kamera...
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center p-4 text-center text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
      {camReady && !error && (
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={capture}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Ambil Foto
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
          >
            Batal
          </button>
        </div>
      )}
    </div>
  );
}