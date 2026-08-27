"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@/components/StatusBadge";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

type OvertimeRow = {
  id: string;
  dateKey: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  payAmount: number;
  reason: string;
  status: string;
  user: { name: string; username: string; overtimeRate: number };
};

export default function OvertimeApprovals({
  overtimes,
}: {
  overtimes: OvertimeRow[];
}) {
  const router = useRouter();
  const [processing, setProcessing] = useState("");

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    setProcessing(id);
    const res = await fetch(`/api/overtime/${id}`, {
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

  function renderTable(rows: OvertimeRow[]) {
    const pageRows = rows.slice(pag.start, pag.end);
    if (rows.length === 0) {
      return (
        <div className="px-6 py-8 text-center text-slate-500">Tidak ada data.</div>
      );
    }
    return (
      <>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-6 py-3">Nama</th>
              <th className="px-6 py-3">Tanggal</th>
              <th className="px-6 py-3">Jam</th>
              <th className="px-6 py-3">Durasi</th>
              <th className="px-6 py-3">Tarif/Jam</th>
              <th className="px-6 py-3">Upah</th>
              <th className="px-6 py-3">Alasan</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((o) => (
              <tr key={o.id} className="border-b border-slate-100">
                <td className="px-6 py-3 font-medium text-slate-900">
                  {o.user.name}
                  <div className="text-xs font-normal text-slate-500">
                    {o.user.username}
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">{o.dateKey}</td>
                <td className="px-6 py-3 whitespace-nowrap">
                  {o.startTime} – {o.endTime}
                </td>
                <td className="px-6 py-3">{o.durationMinutes} mnt</td>
                <td className="px-6 py-3 text-slate-600">
                  {o.user.overtimeRate > 0
                    ? `Rp ${o.user.overtimeRate.toLocaleString("id-ID")}`
                    : "-"}
                </td>
                <td className="px-6 py-3 text-slate-700">
                  {o.payAmount > 0
                    ? `Rp ${o.payAmount.toLocaleString("id-ID")}`
                    : "-"}
                </td>
                <td className="px-6 py-3 text-slate-600">{o.reason}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={o.status} />
                </td>
                <td className="px-6 py-3">
                  <StatusActions
                    id={o.id}
                    status={o.status}
                    processing={processing}
                    decide={decide}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
        <Pagination
          total={rows.length}
          page={pag.page}
          pageSize={pag.pageSize}
          onPageChange={pag.goToPage}
        />
      </>
    );
  }

  const pending = overtimes.filter((o) => o.status === "PENDING");
  const processed = overtimes.filter((o) => o.status !== "PENDING");

  const pag = usePagination(processed.length);

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

export function StatusActions({
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