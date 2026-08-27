import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDateKey, daysBetween } from "@/lib/date";
import { formatDateTime } from "@/lib/date";
import { leaveGranted, leaveBalance } from "@/lib/leave";
import LeaveForm from "@/components/LeaveForm";

const typeLabels: Record<string, string> = {
  CUTI_TAHUNAN: "Cuti Tahunan",
  CUTI_SAKIT: "Cuti Sakit",
  IZIN: "Izin",
  CUTI_MELAHIRKAN: "Cuti Melahirkan",
  CUTI_LAINNYA: "Cuti Lainnya",
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export default async function MyLeavesPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const leaves = await prisma.leave.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      leaveQuota: true,
      leaveUsed: true,
      leaveAccrual: true,
      leaveAccrualPeriod: true,
      joinDate: true,
    },
  });

  const approved = leaves.filter((l) => l.status === "APPROVED");
  const pending = leaves.filter((l) => l.status === "PENDING");
  const granted = leaveGranted({
    initial: user?.leaveQuota ?? 0,
    used: user?.leaveUsed ?? 0,
    joinDate: user?.joinDate,
    accrual: user?.leaveAccrual ?? 1,
    period: user?.leaveAccrualPeriod ?? "MONTHLY",
  });
  const balance = leaveBalance({
    initial: user?.leaveQuota ?? 0,
    used: user?.leaveUsed ?? 0,
    joinDate: user?.joinDate,
    accrual: user?.leaveAccrual ?? 1,
    period: user?.leaveAccrualPeriod ?? "MONTHLY",
  });
  const accrualLabel =
    user?.leaveAccrualPeriod === "YEARLY"
      ? `${user?.leaveAccrual ?? 0} hari/tahun`
      : `${user?.leaveAccrual ?? 0} hari/bulan`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Cuti Saya</h1>
        <p className="text-slate-500 mt-1">
          Disetujui: {approved.length} · Menunggu: {pending.length}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
          <div className="text-3xl font-bold text-blue-600">{balance} hari</div>
          <div className="mt-1 text-sm font-medium text-slate-700">
            Sisa Cuti
          </div>
          <div className="text-xs text-slate-500">Jatah {accrualLabel}</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
          <div className="text-3xl font-bold text-slate-900">
            {user?.leaveUsed ?? 0} hari
          </div>
          <div className="mt-1 text-sm font-medium text-slate-700">
            Cuti Terpakai
          </div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
          <div className="text-3xl font-bold text-slate-900">{granted} hari</div>
          <div className="mt-1 text-sm font-medium text-slate-700">
            Total Tersedia
          </div>
          <div className="text-xs text-slate-500">jatah + akumulasi</div>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm">
          <div className="text-3xl font-bold text-slate-900">
            {user?.leaveQuota ?? 0} hari
          </div>
          <div className="mt-1 text-sm font-medium text-slate-700">
            Jatah Awal
          </div>
          <div className="text-xs text-slate-500">diatur admin</div>
        </div>
      </div>

      <LeaveForm />

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Riwayat Pengajuan Cuti
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Periode</th>
                <th className="px-6 py-3">Lama</th>
                <th className="px-6 py-3">Jenis</th>
                <th className="px-6 py-3">Alasan</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Diajukan</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Belum ada pengajuan cuti.
                  </td>
                </tr>
              )}
              {leaves.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 whitespace-nowrap">
                    {formatDateKey(l.startDate)} s/d {formatDateKey(l.endDate)}
                  </td>
                  <td className="px-6 py-3">{daysBetween(l.startDate, l.endDate)} hari</td>
                  <td className="px-6 py-3">{typeLabels[l.type] || l.type}</td>
                  <td className="px-6 py-3 text-slate-600">{l.reason}</td>
                  <td className="px-6 py-3">{statusBadge(l.status)}</td>
                  <td className="px-6 py-3 text-slate-500">{formatDateTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
