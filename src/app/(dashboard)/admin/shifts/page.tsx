import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import ShiftManager from "@/components/ShiftManager";

export default async function AdminShiftsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") notFound();
  if (!session.companyId) notFound();

  const shifts = await prisma.shift.findMany({
    where: { companyId: session.companyId },
    include: { _count: { select: { users: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kelola Shift & Jam Kerja</h1>
        <p className="text-slate-500 mt-1">
          Tentukan jam masuk, jam keluar, dan toleransi per shift
        </p>
      </div>
      <ShiftManager shifts={shifts} />
    </div>
  );
}