"use client";

import Link from "next/link";
import { formatRupiah, formatPeriod, salaryTypeLabel } from "@/lib/format";
import { formatDateTime } from "@/lib/date";

export type PayslipData = {
  id: string;
  period: string;
  label: string;
  baseSalary: number;
  allowance: number;
  bonus: number;
  deduction: number;
  pph21: number;
  bpjsKesehatan: number;
  bpjsJht: number;
  bpjsJp: number;
  netSalary: number;
  status: string;
  note: string | null;
  updatedAt: Date | string;
  user: {
    name: string;
    username: string;
    role: string;
    salaryType?: string;
    company?: { name: string | null } | null;
  };
};

function Row({
  label,
  value,
  bold,
  sub,
}: {
  label: string;
  value: string;
  bold?: boolean;
  sub?: boolean;
}) {
  return (
    <tr>
      <td
        className={`px-5 py-2.5 ${sub ? "pl-8 text-slate-500" : "text-slate-700"} ${
          bold ? "font-semibold" : ""
        }`}
      >
        {label}
      </td>
      <td
        className={`px-5 py-2.5 text-right ${
          bold ? "font-bold text-slate-900" : "text-slate-800"
        }`}
      >
        {value}
      </td>
    </tr>
  );
}

export default function Payslip({ data }: { data: PayslipData }) {
  const gross = data.baseSalary + data.allowance + data.bonus;
  const bpjsTotal = data.bpjsKesehatan + data.bpjsJht + data.bpjsJp;
  const totalDeduction = data.pph21 + data.deduction + bpjsTotal;
  const roleLabel =
    data.user.role === "HRD"
      ? "HRD"
      : data.user.role === "ADMIN"
      ? "Admin"
      : "Karyawan";

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Slip Gaji</h1>
            <p className="text-slate-500 mt-1">
              Slip gaji {formatPeriod(data.period)} ·{" "}
              {data.user.company?.name ?? "Perusahaan"}
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard/payroll"
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Kembali
            </Link>
            <button
              onClick={() => window.print()}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Cetak / Simpan PDF
            </button>
          </div>
        </div>
      </div>

      <div
        id="payslip"
        className="print-slip mx-auto max-w-3xl overflow-hidden rounded-2xl border border-slate-200 bg-white text-slate-900 shadow-sm"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-5">
          <div>
            <div className="text-lg font-bold text-slate-900">
              {data.user.company?.name ?? "HRIS Ultimate"}
            </div>
            <div className="text-sm text-slate-500">SLIP GAJI KARYAWAN</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold text-slate-900">
              Periode: {formatPeriod(data.period)}
              {data.label ? ` · ${data.label}` : ""}
            </div>
            <div className="text-slate-500">
              Status:{" "}
              <span
                className={`font-medium ${
                  data.status === "PAID" ? "text-green-600" : "text-amber-600"
                }`}
              >
                {data.status === "PAID" ? "Dibayar" : "Draf"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid gap-1 px-6 py-4 text-sm sm:grid-cols-2">
          <div className="flex gap-2">
            <span className="text-slate-500">Nama:</span>
            <span className="font-medium">{data.user.name}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500">NIK / Username:</span>
            <span className="font-medium">{data.user.username}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500">Jabatan:</span>
            <span className="font-medium">{roleLabel}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500">Tanggal Cetak:</span>
            <span className="font-medium">{formatDateTime(new Date())}</span>
          </div>
        </div>

        <div className="grid gap-6 border-t border-slate-200 px-6 py-4 sm:grid-cols-2">
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              Pendapatan
            </h2>
            <table className="w-full text-sm">
              <tbody>
                <Row
                  label="Gaji Pokok"
                  value={`${formatRupiah(data.baseSalary)}${
                    data.user.salaryType ? ` (${salaryTypeLabel(data.user.salaryType)})` : ""
                  }`}
                />
                <Row label="Tunjangan" value={formatRupiah(data.allowance)} />
                <Row label="Bonus" value={formatRupiah(data.bonus)} />
                <Row
                  label="Total Pendapatan Kotor"
                  value={formatRupiah(gross)}
                  bold
                />
              </tbody>
            </table>
          </div>
          <div>
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">
              Potongan
            </h2>
            <table className="w-full text-sm">
              <tbody>
                <Row label="PPh 21 (TER)" value={formatRupiah(data.pph21)} />
                <Row
                  label="BPJS Kesehatan (1%)"
                  value={formatRupiah(data.bpjsKesehatan)}
                />
                <Row label="BPJS JHT (2%)" value={formatRupiah(data.bpjsJht)} />
                <Row label="BPJS JP (1%)" value={formatRupiah(data.bpjsJp)} />
                <Row
                  label="Potongan Kehadiran"
                  value={formatRupiah(data.deduction)}
                />
                <Row
                  label="Total Potongan"
                  value={formatRupiah(totalDeduction)}
                  bold
                />
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex items-center justify-between border-t-2 border-slate-200 bg-slate-50 px-6 py-4">
          <span className="text-sm font-bold uppercase tracking-wide text-slate-700">
            Gaji Bersih
          </span>
          <span className="text-xl font-bold text-blue-700">
            {formatRupiah(data.netSalary)}
          </span>
        </div>

        {data.note && (
          <div className="border-t border-slate-200 px-6 py-3 text-sm text-slate-500">
            <span className="font-semibold text-slate-700">Catatan:</span>{" "}
            {data.note}
          </div>
        )}

        <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-400">
          Slip gaji ini diterbitkan otomatis oleh HRIS Ultimate dan sah tanpa
          tanda tangan basah.
        </div>
      </div>
    </div>
  );
}
