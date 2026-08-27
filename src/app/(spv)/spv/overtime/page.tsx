import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import OvertimeApprovals from "@/components/OvertimeApprovals";

export default async function SpvOvertimePage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const overtimes = await prisma.overtime.findMany({
    where: {
      user:
        session.role === "ADMIN"
          ? { companyId: session.companyId }
          : { supervisorId: session.sub },
    },
    include: {
      user: { select: { name: true, username: true, overtimeRate: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Persetujuan Lembur Tim</h1>
        <p className="text-slate-500 mt-1">
          Kelola pengajuan lembur anggota tim Anda
        </p>
      </div>
      <OvertimeApprovals overtimes={overtimes} />
    </div>
  );
}