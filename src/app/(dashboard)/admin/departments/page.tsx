import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import DepartmentManager from "@/components/DepartmentManager";

export default async function AdminDepartmentsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") notFound();
  if (!session.companyId) notFound();

  const departments = await prisma.department.findMany({
    where: { companyId: session.companyId },
    select: {
      id: true,
      name: true,
      _count: { select: { users: true } },
    },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Departemen</h1>
        <p className="text-slate-500 mt-1">
          Kelola departemen untuk mengelompokkan karyawan
        </p>
      </div>
      <DepartmentManager departments={departments} />
    </div>
  );
}