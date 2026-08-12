import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import CompanyManager from "@/components/CompanyManager";

export default async function SuperCompaniesPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "SUPER_ADMIN") redirect("/dashboard");

  const companies = await prisma.company.findMany({
    select: {
      id: true,
      name: true,
      code: true,
      address: true,
      createdAt: true,
      _count: { select: { users: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Kelola Perusahaan</h1>
        <p className="text-slate-500 mt-1">
          Kelola seluruh PT yang menggunakan aplikasi ini
        </p>
      </div>
      <CompanyManager companies={companies} />
    </div>
  );
}
