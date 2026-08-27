import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import Payslip from "@/components/Payslip";

export const dynamic = "force-dynamic";

export default async function PayslipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentUser();
  if (!session) notFound();

  const { id } = await params;

  const payroll = await prisma.payroll.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          name: true,
          username: true,
          role: true,
          salaryType: true,
          companyId: true,
          company: { select: { name: true } },
        },
      },
    },
  });

  if (!payroll) notFound();

  const isOwner = payroll.userId === session.sub;
  const isHrd =
    (session.role === "HRD" || session.role === "ADMIN") &&
    payroll.user.companyId === session.companyId;

  if (!isOwner && !isHrd) notFound();

  return (
    <div>
      <Payslip
        data={{
          id: payroll.id,
          period: payroll.period,
          label: payroll.label,
          baseSalary: payroll.baseSalary,
          allowance: payroll.allowance,
          bonus: payroll.bonus,
          deduction: payroll.deduction,
          pph21: payroll.pph21,
          bpjsKesehatan: payroll.bpjsKesehatan,
          bpjsJht: payroll.bpjsJht,
          bpjsJp: payroll.bpjsJp,
          netSalary: payroll.netSalary,
          status: payroll.status,
          note: payroll.note,
          updatedAt: payroll.updatedAt,
          user: {
            name: payroll.user.name,
            username: payroll.user.username,
            role: payroll.user.role,
            salaryType: payroll.user.salaryType,
            company: payroll.user.company,
          },
        }}
      />
    </div>
  );
}
