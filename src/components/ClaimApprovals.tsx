"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah } from "@/lib/format";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

type ClaimRow = {
  id: string;
  type: string;
  amount: number;
  description: string;
  date: string;
  status: string;
  user: { name: string; username: string };
};

const typeLabels: Record<string, string> = {
  TRANSPORT: "Transportasi",
  MAKAN: "Makan",
  MEDIS: "Kesehatan / Medis",
  PENDIDIKAN: "Pendidikan",
  OPERASIONAL: "Operasional",
  LAINNYA: "Lainnya",
};

export default function ClaimApprovals({ claims }: { claims: ClaimRow[] }) {
  const router = useRouter();
  const [processing, setProcessing] = useState("");

  async function decide(id: string, status: "APPROVED" | "REJECTED") {
    setProcessing(id);
    const res = await fetch(`/api/claim/${id}`, {
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

  const pending = claims.filter((c) => c.status === "PENDING");
  const processed = claims.filter((c) => c.status !== "PENDING");

  const pag = usePagination(processed.length);

  function renderTable(rows: ClaimRow[]) {
    const pageRows = rows.slice(pag.start, pag.end);
    if (rows.length === 0) {
      return (
        <div className="px-6 py-8 text-center text-slate-500">
          Tidak ada data.
        </div>
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
              <th className="px-6 py-3">Jenis</th>
              <th className="px-6 py-3">Deskripsi</th>
              <th className="px-6 py-3">Nominal</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {pageRows.map((c) => (
              <tr key={c.id} className="border-b border-slate-100">
                <td className="px-6 py-3 font-medium text-slate-900">
                  {c.user.name}
                  <div className="text-xs font-normal text-slate-500">
                    {c.user.username}
                  </div>
                </td>
                <td className="px-6 py-3 whitespace-nowrap">{c.date}</td>
                <td className="px-6 py-3">{typeLabels[c.type] || c.type}</td>
                <td className="px-6 py-3 text-slate-600">{c.description}</td>
                <td className="px-6 py-3 font-medium text-slate-900">
                  {formatRupiah(c.amount)}
                </td>
                <td className="px-6 py-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      c.status === "APPROVED"
                        ? "bg-green-100 text-green-700"
                        : c.status === "REJECTED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-6 py-3">
                  {c.status === "PENDING" ? (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => decide(c.id, "APPROVED")}
                        disabled={processing === c.id}
                        className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        Setujui
                      </button>
                      <button
                        onClick={() => decide(c.id, "REJECTED")}
                        disabled={processing === c.id}
                        className="rounded-md bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        Tolak
                      </button>
                    </div>
                  ) : (
                    <div className="text-right text-xs text-slate-400">-</div>
                  )}
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

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Klaim Menunggu Persetujuan ({pending.length})
          </h2>
        </div>
        {renderTable(pending)}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Riwayat Klaim ({processed.length})
          </h2>
        </div>
        {renderTable(processed)}
      </div>
    </div>
  );
}
