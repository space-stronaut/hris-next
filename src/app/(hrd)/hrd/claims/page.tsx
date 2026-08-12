import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ClaimApprovals from "@/components/ClaimApprovals";

export default async function HrdClaimsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const claims = await prisma.claim.findMany({
    where: { user: { companyId: session.companyId } },
    include: { user: { select: { name: true, username: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Persetujuan Klaim</h1>
        <p className="text-slate-500 mt-1">Kelola klaim / reimbursement karyawan</p>
      </div>
      <ClaimApprovals claims={claims} />
    </div>
  );
}
