import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import AdminManager from "@/components/AdminManager";

export default async function CompanyAdminsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "SUPER_ADMIN") redirect("/dashboard");

  const { id } = await params;
  const company = await prisma.company.findUnique({ where: { id } });
  if (!company) notFound();

  const admins = await prisma.user.findMany({
    where: { companyId: id, role: "ADMIN" },
    select: { id: true, username: true, name: true, active: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Kelola Admin · {company.name}
        </h1>
        <p className="text-slate-500 mt-1">
          Kelola akun admin untuk {company.name}
        </p>
      </div>
      <AdminManager
        companyName={company.name}
        companyId={company.id}
        admins={admins}
      />
    </div>
  );
}
