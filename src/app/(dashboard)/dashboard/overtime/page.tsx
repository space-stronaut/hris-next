import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey } from "@/lib/date";
import OvertimeForm from "@/components/OvertimeForm";

export default async function DashboardOvertimePage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const overtimes = await prisma.overtime.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });
  const todayKey = toDateKey();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lembur Saya</h1>
        <p className="text-slate-500 mt-1">Ajukan dan pantau lembur Anda</p>
      </div>
      <OvertimeForm overtimes={overtimes} todayKey={todayKey} />
    </div>
  );
}