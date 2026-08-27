import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import LeaveApprovals from "@/components/LeaveApprovals";

export default async function SpvLeavesPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const leaves = await prisma.leave.findMany({
    where: {
      user:
        session.role === "ADMIN"
          ? { companyId: session.companyId }
          : { supervisorId: session.sub },
    },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Persetujuan Cuti Tim</h1>
        <p className="text-slate-500 mt-1">
          Kelola pengajuan cuti anggota tim Anda
        </p>
      </div>
      <LeaveApprovals leaves={leaves} />
    </div>
  );
}