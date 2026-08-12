"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, formatPeriod, currentPeriod } from "@/lib/format";

type Employee = {
  id: string;
  name: string;
  username: string;
  role: string;
  baseSalary: number;
};

type PayrollRow = {
  id: string;
  period: string;
  baseSalary: number;
  allowance: number;
  bonus: number;
  deduction: number;
  netSalary: number;
  status: string;
  user: { name: string; username: string };
};

function periodOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return options;
}

export default function PayrollManager({
  employees,
  payrolls,
}: {
  employees: Employee[];
  payrolls: PayrollRow[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [period, setPeriod] = useState(currentPeriod());
  const [baseSalary, setBaseSalary] = useState("");
  const [allowance, setAllowance] = useState("");
  const [bonus, setBonus] = useState("");
  const [note, setNote] = useState("");
  const [filterPeriod, setFilterPeriod] = useState("");
  const [error, setError] = useState("");
  const [summary, setSummary] = useState("");
  const [loading, setLoading] = useState(false);

  function onSelectEmployee(id: string) {
    setUserId(id);
    const emp = employees.find((e) => e.id === id);
    setBaseSalary(emp ? String(emp.baseSalary) : "");
  }

  async function createPayroll(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSummary("");
    setLoading(true);
    try {
      const res = await fetch("/api/payroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          period,
          baseSalary: Number(baseSalary) || 0,
          allowance: Number(allowance) || 0,
          bonus: Number(bonus) || 0,
          note,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal membuat payroll.");
        setLoading(false);
        return;
      }
      setSummary(
        `Payroll ${formatPeriod(period)} dibuat: Hadir ${data.summary.hadir}, Terlambat ${data.summary.terlambat}, Alpa ${data.summary.alphaDays} hari. Potongan ${formatRupiah(data.payroll.deduction)}.`
      );
      setAllowance("");
      setBonus("");
      setNote("");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  async function markPaid(id: string) {
    const res = await fetch(`/api/payroll/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Gagal.");
      return;
    }
    router.refresh();
  }

  async function editPayroll(p: PayrollRow) {
    const baseInput = window.prompt("Gaji pokok (Rp):", String(p.baseSalary));
    if (baseInput === null) return;
    const allowanceInput = window.prompt("Tunjangan (Rp):", String(p.allowance));
    if (allowanceInput === null) return;
    const bonusInput = window.prompt("Bonus (Rp):", String(p.bonus));
    if (bonusInput === null) return;
    const deductionInput = window.prompt("Potongan (Rp):", String(p.deduction));
    if (deductionInput === null) return;

    const res = await fetch(`/api/payroll/${p.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        baseSalary: Number(baseInput) || 0,
        allowance: Number(allowanceInput) || 0,
        bonus: Number(bonusInput) || 0,
        deduction: Number(deductionInput) || 0,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Gagal menyimpan.");
      return;
    }
    router.refresh();
  }

  const filtered = filterPeriod
    ? payrolls.filter((p) => p.period === filterPeriod)
    : payrolls;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">
          Buat / Perbarui Payroll
        </h2>
        <form onSubmit={createPayroll} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Karyawan
            </label>
            <select
              value={userId}
              onChange={(e) => onSelectEmployee(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Pilih karyawan</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.username})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Periode
            </label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {periodOptions().map((m) => (
                <option key={m} value={m}>
                  {formatPeriod(m)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gaji Pokok (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tunjangan (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={allowance}
              onChange={(e) => setAllowance(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Bonus (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={bonus}
              onChange={(e) => setBonus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 sm:col-span-2 lg:col-span-5">
              {error}
            </div>
          )}
          {summary && (
            <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700 sm:col-span-2 lg:col-span-5">
              {summary}
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-5">
            <button
              type="submit"
              disabled={loading || !userId}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Memproses..." : "Buat Payroll"}
            </button>
            <p className="mt-2 text-xs text-slate-500">
              Potongan dihitung otomatis dari hari alpa (hari kerja - kehadiran),
              tidak termasuk hari libur (Senin-Jumat).
            </p>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            Daftar Payroll ({filtered.length})
          </h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Filter:</label>
            <select
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="rounded-lg border border-slate-300 bg-surface px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
            >
              <option value="">Semua</option>
              {periodOptions().map((m) => (
                <option key={m} value={m}>
                  {formatPeriod(m)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Periode</th>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Gaji Pokok</th>
                <th className="px-6 py-3">Tunjangan</th>
                <th className="px-6 py-3">Bonus</th>
                <th className="px-6 py-3">Potongan</th>
                <th className="px-6 py-3">Gaji Bersih</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Belum ada data payroll.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 whitespace-nowrap">
                    {formatPeriod(p.period)}
                  </td>
                  <td className="px-6 py-3">
                    <span className="font-medium text-slate-900">{p.user.name}</span>
                    <span className="ml-1 text-xs text-slate-500">
                      ({p.user.username})
                    </span>
                  </td>
                  <td className="px-6 py-3">{formatRupiah(p.baseSalary)}</td>
                  <td className="px-6 py-3">{formatRupiah(p.allowance)}</td>
                  <td className="px-6 py-3">{formatRupiah(p.bonus)}</td>
                  <td className="px-6 py-3 text-red-600">
                    -{formatRupiah(p.deduction)}
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-900">
                    {formatRupiah(p.netSalary)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        p.status === "PAID"
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {p.status === "PAID" ? "Dibayar" : "Draf"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => editPayroll(p)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      {p.status !== "PAID" && (
                        <button
                          onClick={() => markPaid(p.id)}
                          className="rounded-md border border-green-300 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-50"
                        >
                          Tandai Dibayar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
