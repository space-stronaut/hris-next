import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatTime } from "@/lib/date";
import CorrectionApprovals from "@/components/CorrectionApprovals";

export default async function SpvCorrectionsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const corrections = await prisma.attendanceCorrection.findMany({
    where: {
      user:
        session.role === "ADMIN"
          ? { companyId: session.companyId }
          : { supervisorId: session.sub },
    },
    include: {
      user: { select: { name: true, username: true } },
      attendance: { select: { dateKey: true, checkIn: true, checkOut: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Persetujuan Koreksi Absensi Tim
        </h1>
        <p className="text-slate-500 mt-1">
          Kelola pengajuan perbaikan data absensi anggota tim Anda
        </p>
      </div>
      <CorrectionApprovals
        corrections={corrections.map((c) => ({
          ...c,
          requestedCheckIn: formatTime(c.requestedCheckIn),
          requestedCheckOut: formatTime(c.requestedCheckOut),
          attendance: {
            dateKey: c.attendance.dateKey,
            checkIn: formatTime(c.attendance.checkIn),
            checkOut: formatTime(c.attendance.checkOut),
          },
        }))}
      />
    </div>
  );
}