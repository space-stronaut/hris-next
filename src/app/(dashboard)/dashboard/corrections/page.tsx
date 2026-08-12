import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey } from "@/lib/date";
import CorrectionForm from "@/components/CorrectionForm";

export default async function DashboardCorrectionsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const todayKey = toDateKey();
  const [corrections, attendances] = await Promise.all([
    prisma.attendanceCorrection.findMany({
      where: { userId: session.sub },
      include: { attendance: { select: { dateKey: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.attendance.findMany({
      where: { userId: session.sub },
      select: { id: true, dateKey: true, status: true },
      orderBy: { dateKey: "desc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Koreksi Absensi</h1>
        <p className="text-slate-500 mt-1">
          Ajukan perbaikan data check-in / check-out Anda
        </p>
      </div>
      <CorrectionForm
        corrections={corrections.map((c) => ({
          id: c.id,
          dateKey: c.attendance.dateKey,
          status: c.status,
          reason: c.reason,
        }))}
        attendances={attendances}
        todayKey={todayKey}
      />
    </div>
  );
}