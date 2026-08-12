import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey, formatTime, formatDuration, formatDateKey } from "@/lib/date";
import AttendancePanel from "@/components/AttendancePanel";

export default async function DashboardPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const dateKey = toDateKey();
  const today = await prisma.attendance.findUnique({
    where: { userId_dateKey: { userId: session.sub, dateKey } },
  });

  const shiftName = await (async () => {
    if (!today?.shiftId) return null;
    const shift = await prisma.shift.findUnique({ where: { id: today.shiftId } });
    return shift?.name || null;
  })();

  const history = await prisma.attendance.findMany({
    where: { userId: session.sub },
    orderBy: { dateKey: "desc" },
    take: 10,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Halo, {session.name}!
        </h1>
        <p className="text-slate-500 mt-1">{formatDateKey(dateKey)}</p>
      </div>

      <AttendancePanel
        today={
          today
            ? {
                checkIn: today.checkIn?.toISOString() ?? null,
                checkOut: today.checkOut?.toISOString() ?? null,
                breakIn: today.breakIn?.toISOString() ?? null,
                breakOut: today.breakOut?.toISOString() ?? null,
                checkInPhoto: today.checkInPhoto,
                checkOutPhoto: today.checkOutPhoto,
                recordType: today.recordType,
                shiftCheckIn: today.shiftCheckIn,
                shiftCheckOut: today.shiftCheckOut,
              }
            : null
        }
        shiftName={shiftName}
      />

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Riwayat Absensi</h2>
          <Link
            href="/dashboard"
            className="text-sm text-blue-600 hover:underline"
          >
            Terakhir 10 hari
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Check In</th>
                <th className="px-6 py-3">Check Out</th>
                <th className="px-6 py-3">Durasi</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Belum ada riwayat absensi.
                  </td>
                </tr>
              )}
              {history.map((row) => (
                <tr key={row.id} className="border-b border-slate-100">
                  <td className="px-6 py-3">{formatDateKey(row.dateKey)}</td>
                  <td className="px-6 py-3">{formatTime(row.checkIn)}</td>
                  <td className="px-6 py-3">{formatTime(row.checkOut)}</td>
                  <td className="px-6 py-3">
                    {formatDuration(row.checkIn, row.checkOut)}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === "TERLAMBAT"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-green-100 text-green-700"
                      }`}
                    >
                      {row.status}
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
