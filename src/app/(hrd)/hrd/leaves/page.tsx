import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import LeaveApprovals from "@/components/LeaveApprovals";

export default async function HrdLeavesPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const leaves = await prisma.leave.findMany({
    where: { user: { companyId: session.companyId } },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Persetujuan Cuti</h1>
        <p className="text-slate-500 mt-1">
          Kelola pengajuan cuti karyawan
        </p>
      </div>
      <LeaveApprovals leaves={leaves} />
    </div>
  );
}
