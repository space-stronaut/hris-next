import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey, formatTime } from "@/lib/date";

export default async function AdminPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") notFound();

  const dateKey = toDateKey();

  const [totalUsers, todayRecords] = await Promise.all([
    prisma.user.count({ where: { role: "KARYAWAN", companyId: session.companyId } }),
    prisma.attendance.findMany({
      where: { dateKey, user: { companyId: session.companyId } },
      include: { user: { select: { name: true } } },
      orderBy: { checkIn: "asc" },
    }),
  ]);

  const present = todayRecords.filter((r) => r.checkIn).length;
  const late = todayRecords.filter((r) => r.status === "TERLAMBAT").length;
  const absent = Math.max(0, totalUsers - present);

  const stats = [
    {
      label: "Karyawan Aktif",
      value: totalUsers,
      sub: "terdaftar",
      color: "text-blue-600",
    },
    {
      label: "Hadir Hari Ini",
      value: present,
      sub: "sudah check-in",
      color: "text-green-600",
    },
    {
      label: "Terlambat",
      value: late,
      sub: "check-in > 08:00",
      color: "text-amber-600",
    },
    {
      label: "Belum Hadir",
      value: absent,
      sub: "belum check-in",
      color: "text-slate-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard Admin</h1>
          <p className="text-slate-500 mt-1">Ringkasan absensi hari ini</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/users"
            className="rounded-lg border border-slate-300 bg-surface px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
          >
            Kelola Karyawan
          </Link>
          <Link
            href="/admin/attendance"
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Lihat Rekap
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-2xl border border-slate-200 bg-surface p-5 shadow-sm"
          >
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="mt-1 text-sm font-medium text-slate-700">
              {s.label}
            </div>
            <div className="text-xs text-slate-500">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Daftar Kehadiran Hari Ini
          </h2>
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
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Belum ada yang hadir hari ini.
                  </td>
                </tr>
              )}
              {todayRecords.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {r.user.name}
                  </td>
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
