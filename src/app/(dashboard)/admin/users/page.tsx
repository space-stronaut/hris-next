import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import UserManager from "@/components/UserManager";

export default async function AdminUsersPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") notFound();
  if (!session.companyId) notFound();

  const users = await prisma.user.findMany({
    where: { companyId: session.companyId },
    select: {
      id: true,
      username: true,
      name: true,
      role: true,
      active: true,
      baseSalary: true,
      overtimeRate: true,
      maritalStatus: true,
      dependents: true,
      shiftId: true,
      shift: { select: { name: true } },
      createdAt: true,
      _count: { select: { attendances: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const shifts = await prisma.shift.findMany({
    where: { companyId: session.companyId, active: true },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kelola Karyawan</h1>
        <p className="text-slate-500 mt-1">
          Tambah, aktifkan/nonaktifkan, dan hapus karyawan
        </p>
      </div>
      <UserManager users={users} shifts={shifts} />
    </div>
  );
}
