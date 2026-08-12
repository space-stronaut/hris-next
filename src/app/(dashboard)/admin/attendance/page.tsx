import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey, formatTime, formatDuration, formatDateKey } from "@/lib/date";
import type PageProps from "next";

function monthOptions(): string[] {
  const options: string[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
    );
  }
  return options;
}

export default async function AdminAttendancePage({
  searchParams,
}: PageProps<"/admin/attendance">) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") notFound();

  const params = await searchParams;
  const current = toDateKey().slice(0, 7);
  const selectedMonth = String(params.month || current);

  const records = await prisma.attendance.findMany({
    where: {
      dateKey: { startsWith: selectedMonth },
      user: { companyId: session.companyId },
    },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { dateKey: "desc" },
  });

  const late = records.filter((r) => r.status === "TERLAMBAT").length;
  const onTime = records.filter((r) => r.status === "HADIR").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Rekap Absensi</h1>
          <p className="text-slate-500 mt-1">
            {records.length} catatan Â· {onTime} tepat waktu Â· {late} terlambat
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form method="get" className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Bulan:</label>
            <select
              name="month"
              defaultValue={selectedMonth}
              className="rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            >
              {monthOptions().map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Filter
            </button>
          </form>
          <a
            href={`/api/attendance/export?month=${encodeURIComponent(selectedMonth)}`}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
          >
            Export CSV
          </a>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Durasi</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Tidak ada catatan absensi untuk bulan ini.
                  </td>
                </tr>
              )}
              {records.map((r) => (
                <tr key={r.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 whitespace-nowrap">
                    {formatDateKey(r.dateKey)}
                  </td>
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {r.user.name}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{r.user.username}</td>
                  <td className="px-6 py-3">{formatTime(r.checkIn)}</td>
                  <td className="px-6 py-3">{formatTime(r.checkOut)}</td>
                  <td className="px-6 py-3">
                    {formatDuration(r.checkIn, r.checkOut)}
                  </td>
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
