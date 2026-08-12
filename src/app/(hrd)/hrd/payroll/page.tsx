import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import PayrollManager from "@/components/PayrollManager";

export default async function HrdPayrollPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const [employees, payrolls] = await Promise.all([
    prisma.user.findMany({
      where: { role: { in: ["KARYAWAN", "HRD"] }, companyId: session.companyId },
      select: { id: true, name: true, username: true, role: true, baseSalary: true },
      orderBy: { name: "asc" },
    }),
    prisma.payroll.findMany({
      where: { user: { companyId: session.companyId } },
      include: { user: { select: { name: true, username: true } } },
      orderBy: [{ period: "desc" }, { user: { name: "asc" } }],
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Payroll</h1>
        <p className="text-slate-500 mt-1">
          Kelola gaji bulanan karyawan
        </p>
      </div>
      <PayrollManager employees={employees} payrolls={payrolls} />
    </div>
  );
}
