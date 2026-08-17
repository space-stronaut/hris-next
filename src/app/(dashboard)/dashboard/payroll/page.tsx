import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatRupiah, formatPeriod } from "@/lib/format";

function statusBadge(status: string) {
  const map: Record<string, string> = {
    DRAFT: "bg-slate-100 text-slate-700",
    PAID: "bg-green-100 text-green-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status === "PAID" ? "Dibayar" : "Draf"}
    </span>
  );
}

export default async function MyPayrollPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const payrolls = await prisma.payroll.findMany({
    where: { userId: session.sub },
    orderBy: { period: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Gaji Saya</h1>
        <p className="text-slate-500 mt-1">Riwayat gaji bulanan Anda</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Periode</th>
                <th className="px-6 py-3">Gaji Pokok</th>
                <th className="px-6 py-3">Tunjangan</th>
                <th className="px-6 py-3">Bonus</th>
                <th className="px-6 py-3">PPh 21 (TER)</th>
                <th className="px-6 py-3">Potongan</th>
                <th className="px-6 py-3">Gaji Bersih</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Belum ada data gaji.
                  </td>
                </tr>
              )}
              {payrolls.map((p) => (
                <tr key={p.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {formatPeriod(p.period)}
                  </td>
                  <td className="px-6 py-3">{formatRupiah(p.baseSalary)}</td>
                  <td className="px-6 py-3">{formatRupiah(p.allowance)}</td>
                  <td className="px-6 py-3">{formatRupiah(p.bonus)}</td>
                  <td className="px-6 py-3 text-orange-600">
                    -{formatRupiah(p.pph21)}
                  </td>
                  <td className="px-6 py-3 text-red-600">
                    -{formatRupiah(p.deduction)}
                  </td>
                  <td className="px-6 py-3 font-semibold text-slate-900">
                    {formatRupiah(p.netSalary)}
                  </td>
                  <td className="px-6 py-3">{statusBadge(p.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
