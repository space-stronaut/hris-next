import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey, formatTime, weekdayKeys } from "@/lib/date";
import TrendChart from "@/components/TrendChart";

export default async function SpvDashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const dateKey = toDateKey();
  const supervised =
    session.role === "ADMIN"
      ? { companyId: session.companyId }
      : { supervisorId: session.sub };

  const [totalMembers, todayRecords, pendingLeaves, pendingClaims, pendingOvertimes, pendingCorrections] =
    await Promise.all([
      prisma.user.count({ where: supervised }),
      prisma.attendance.findMany({
        where: { dateKey, user: supervised },
        include: { user: { select: { name: true } } },
        orderBy: { checkIn: "asc" },
      }),
      prisma.leave.count({ where: { status: "PENDING", user: supervised } }),
      prisma.claim.count({ where: { status: "PENDING", user: supervised } }),
      prisma.overtime.count({ where: { status: "PENDING", user: supervised } }),
      prisma.attendanceCorrection.count({ where: { status: "PENDING", user: supervised } }),
    ]);

  const present = todayRecords.filter((r) => r.checkIn).length;
  const late = todayRecords.filter((r) => r.status === "TERLAMBAT").length;
  const absent = Math.max(0, totalMembers - present);

  const trendKeys = weekdayKeys(14);
  const trendRows = await prisma.attendance.findMany({
    where: {
      dateKey: { gte: trendKeys[0] },
      user: supervised,
      checkIn: { not: null },
    },
    select: { dateKey: true },
  });
  const trendMap = new Map<string, number>();
  for (const t of trendRows) trendMap.set(t.dateKey, (trendMap.get(t.dateKey) || 0) + 1);
  const trendData = trendKeys.map((k) => ({ dateKey: k, value: trendMap.get(k) || 0 }));

  const stats = [
    { label: "Anggota Tim", value: totalMembers, sub: "di bawah supervisi", color: "text-blue-600", href: "/spv/attendance" },
    { label: "Hadir Hari Ini", value: present, sub: "sudah check-in", color: "text-green-600", href: "/spv/attendance" },
    { label: "Terlambat", value: late, sub: "check-in > shift", color: "text-amber-600", href: "/spv/attendance" },
    { label: "Belum Hadir", value: absent, sub: "belum check-in", color: "text-slate-600", href: "/spv/attendance" },
    { label: "Cuti Menunggu", value: pendingLeaves, sub: "perlu persetujuan", color: "text-amber-600", href: "/spv/leaves" },
    { label: "Klaim Menunggu", value: pendingClaims, sub: "perlu persetujuan", color: "text-orange-600", href: "/spv/claims" },
    { label: "Lembur Menunggu", value: pendingOvertimes, sub: "perlu persetujuan", color: "text-indigo-600", href: "/spv/overtime" },
    { label: "Koreksi Menunggu", value: pendingCorrections, sub: "perlu persetujuan", color: "text-rose-600", href: "/spv/corrections" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Dashboard SPV</h1>
        <p className="text-slate-500 mt-1">
          Ringkasan kehadiran dan pengajuan tim Anda
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm transition hover:border-blue-300"
          >
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-sm font-medium text-slate-700">{s.label}</div>
            <div className="text-xs text-slate-500">{s.sub}</div>
          </Link>
        ))}
      </div>

      <TrendChart title="Tren Kehadiran Tim (14 Hari Kerja)" data={trendData} />

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Kehadiran Tim Hari Ini
          </h2>
          <Link href="/spv/attendance" className="text-sm text-blue-600 hover:underline">
            Lihat Rekap
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {todayRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                    Belum ada yang hadir hari ini.
                  </td>
                </tr>
              )}
              {todayRecords.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">{r.user.name}</td>
                  <td className="px-6 py-3">{formatTime(r.checkIn)}</td>
                  <td className="px-6 py-3">{formatTime(r.checkOut)}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "TERLAMBAT"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {r.status}
                    </span>
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