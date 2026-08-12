"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type CorrectionRow = {
  id: string;
  reason: string;
  status: string;
  requestedCheckIn: string | null;
  requestedCheckOut: string | null;
  user: { name: string; username: string };
  attendance: { dateKey: string; checkIn: string; checkOut: string };
};

export default function CorrectionApprovals({
  corrections,
}: {
  corrections: CorrectionRow[];
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState("");

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    setProcessing(id);
    const res = await fetch(`/api/correction/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    setProcessing("");
    if (!res.ok) {
      alert(data.message || "Gagal memproses.");
      return;
    }
    router.refresh();
  }

  function renderTable(rows: CorrectionRow[]) {
    if (rows.length === 0) {
      return (
        <div className="px-6 py-8 text-center text-slate-500">Tidak ada data.</div>
      );
    }
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3">Nama</th>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Data Saat Ini</th>
              <th className="px-6 py-3">Koreksi Menjadi</th>
              <th className="px-6 py-3">Alasan</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const chi = c.requestedCheckIn;
              const cho = c.requestedCheckOut;
              return (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {c.user.name}
                    <div className="text-xs font-normal text-slate-500">
                      {c.user.username}
                    </div>
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">{c.attendance.dateKey}</td>
                  <td className="px-6 py-3 whitespace-nowrap text-slate-600">
                    In {c.attendance.checkIn} · Out {c.attendance.checkOut}
                  </td>
                  <td className="px-6 py-3 whitespace-nowrap">
                    In {chi || "-"} · Out {cho || "-"}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{c.reason}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-6 py-3">
                    <StatusActions
                      id={c.id}
                      status={c.status}
                      processing={processing}
                      decide={decide}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }

  const pending = corrections.filter((c) => c.status === "PENDING");
  const processed = corrections.filter((c) => c.status !== "PENDING");

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Pengajuan Menunggu Persetujuan ({pending.length})
          </h2>
        </div>
        {renderTable(pending)}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Riwayat Pengajuan ({processed.length})
          </h2>
        </div>
        {renderTable(processed)}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        status === "APPROVED"
          ? "bg-green-100 text-green-700"
          : status === "REJECTED"
          ? "bg-red-100 text-red-700"
          : "bg-amber-100 text-amber-700"
      }`}
    >
      {status}
    </span>
  );
}

function StatusActions({
  id,
  status,
  processing,
  decide,
}: {
  id: string;
  status: string;
  processing: string;
  decide: (id: string, status: "APPROVED" | "REJECTED") => void;
}) {
  if (status !== "PENDING") {
    return <div className="text-right text-xs text-slate-400">-</div>;
  }
  return (
    <div className="flex justify-end gap-2">
      <button
        onClick={() => decide(id, "APPROVED")}
        disabled={processing === id}
        className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
      >
        Setujui
      </button>
      <button
        onClick={() => decide(id, "REJECTED")}
        disabled={processing === id}
        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
      >
        Tolak
      </button>
    </div>
  );
}