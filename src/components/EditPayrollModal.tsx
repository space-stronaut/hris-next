"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Modal from "@/components/Modal";
import { formatPeriod } from "@/lib/format";

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function EditPayrollModal({
  payroll,
  onClose,
}: {
  payroll: {
    id: string;
    period: string;
    baseSalary: number;
    allowance: number;
    bonus: number;
    deduction: number;
    user: { name: string };
  };
  onClose: () => void;
}) {
  const router = useRouter();
  const [baseSalary, setBaseSalary] = useState(String(payroll.baseSalary));
  const [allowance, setAllowance] = useState(String(payroll.allowance));
  const [bonus, setBonus] = useState(String(payroll.bonus));
  const [deduction, setDeduction] = useState(String(payroll.deduction));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`/api/payroll/${payroll.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseSalary: Number(baseSalary) || 0,
          allowance: Number(allowance) || 0,
          bonus: Number(bonus) || 0,
          deduction: Number(deduction) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan.");
        setLoading(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit Payroll · ${payroll.user.name} (${formatPeriod(payroll.period)})`}
    >
      <form onSubmit={onSubmit} className="grid gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gaji Pokok (Rp)
          </label>
          <input
            type="number"
            min="0"
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Potongan (Rp)
          </label>
          <input
            type="number"
            min="0"
            value={deduction}
            onChange={(e) => setDeduction(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}