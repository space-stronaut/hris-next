import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { workingDaysInMonth, workingDayKeys } from "@/lib/date";
import { calculatePph21 } from "@/lib/tax";
import { calculateBpjs } from "@/lib/bpjs";

const SALARY_TYPES_VALUES = ["BULAN", "MINGGU", "HARI", "JAM", "PROYEK", "BORONGAN"];

function weeksInMonth(period: string): { label: string; start: string }[] {
  const [y, m] = period.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const lastDay = new Date(y, m, 0).getDate();
  const weeks: { label: string; start: string }[] = [];
  let weekStart = first.getDate();
  let weekNo = 1;
  while (weekStart <= lastDay) {
    const startDate = new Date(y, m - 1, weekStart);
    weeks.push({
      label: `Minggu ${weekNo}`,
      start: toKey(startDate),
    });
    weekStart += 7;
    weekNo++;
  }
  return weeks;
}

function toKey(d: Date): string {
  const y = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (
      !session ||
      !session.companyId ||
      (session.role !== "HRD" && session.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const period = String(body.period || "").trim();
    const allowance = Math.max(0, Math.round(Number(body.allowance) || 0));
    const bonus = Math.max(0, Math.round(Number(body.bonus) || 0));
    const rawSalaryType = String(body.salaryType || "");
    const salaryType = SALARY_TYPES_VALUES.includes(rawSalaryType)
      ? rawSalaryType
      : null;

    if (!period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { success: false, message: "Periode tidak valid." },
        { status: 400 }
      );
    }

    const users = await prisma.user.findMany({
      where: {
        companyId: session.companyId,
        role: { in: ["KARYAWAN", "HRD"] },
        ...(salaryType ? { salaryType } : {}),
      },
      select: {
        id: true,
        name: true,
        username: true,
        baseSalary: true,
        salaryType: true,
        maritalStatus: true,
        dependents: true,
      },
    });

    if (users.length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada karyawan dengan tipe gaji tersebut di perusahaan ini." },
        { status: 404 }
      );
    }

    const workingDays = workingDaysInMonth(period);
    const dayKeys = workingDayKeys(period);
    const attendances = await prisma.attendance.findMany({
      where: { userId: { in: users.map((u) => u.id) }, dateKey: { startsWith: period } },
      select: { userId: true, dateKey: true, status: true },
    });

    const attendanceMap = new Map<string, { hadir: number; terlambat: number; dates: Set<string> }>();
    for (const u of users) {
      attendanceMap.set(u.id, { hadir: 0, terlambat: 0, dates: new Set() });
    }
    for (const a of attendances) {
      const entry = attendanceMap.get(a.userId);
      if (!entry) continue;
      entry.dates.add(a.dateKey);
      if (a.status === "HADIR") entry.hadir++;
      else if (a.status === "TERLAMBAT") entry.terlambat++;
    }

    const payrolls = await prisma.$transaction(
      users.flatMap((user) => {
        const att = attendanceMap.get(user.id) ?? { hadir: 0, terlambat: 0, dates: new Set<string>() };
        const workDays = att.hadir + att.terlambat;
        const alphaDays = Math.max(0, workingDays - workDays);

        let records: { label: string; base: number }[];
        switch (user.salaryType) {
          case "MINGGU": {
            records = weeksInMonth(period).map((w) => ({
              label: w.label,
              base: user.baseSalary,
            }));
            break;
          }
          case "HARI": {
            records = dayKeys
              .filter((k) => att.dates.has(k))
              .map((k) => ({ label: k, base: user.baseSalary }));
            break;
          }
          case "JAM": {
            records = [{ label: "", base: user.baseSalary * 8 * workingDays }];
            break;
          }
          case "PROYEK":
          case "BORONGAN": {
            records = [{ label: "", base: user.baseSalary }];
            break;
          }
          default: {
            records = [{ label: "", base: user.baseSalary }];
            break;
          }
        }

        if (records.length === 0) return [];

        const monthlyBase = records.reduce((sum, r) => sum + r.base, 0);
        const gross = monthlyBase + allowance + bonus;
        const pph21 = calculatePph21(user.maritalStatus, user.dependents, gross);
        const bpjs = calculateBpjs(monthlyBase);
        const dailyRate = workingDays > 0 ? Math.round(monthlyBase / workingDays) : 0;
        const monthlyDeduction = alphaDays * dailyRate;

        return records.map((rec) => {
          const share = monthlyBase > 0 ? rec.base / monthlyBase : 0;
          const recAllowance = Math.round(allowance * share);
          const recBonus = Math.round(bonus * share);
          const recPph21 = Math.round(pph21 * share);
          const recBpjsKesehatan = Math.round(bpjs.bpjsKesehatan * share);
          const recBpjsJht = Math.round(bpjs.bpjsJht * share);
          const recBpjsJp = Math.round(bpjs.bpjsJp * share);
          const recDeduction = Math.round(monthlyDeduction * share);
          const netSalary =
            rec.base + recAllowance + recBonus - recDeduction - recPph21 - (recBpjsKesehatan + recBpjsJht + recBpjsJp);

          return prisma.payroll.upsert({
            where: {
              userId_period_label: {
                userId: user.id,
                period,
                label: rec.label,
              },
            },
            update: {
              baseSalary: rec.base,
              allowance: recAllowance,
              bonus: recBonus,
              deduction: recDeduction,
              pph21: recPph21,
              bpjsKesehatan: recBpjsKesehatan,
              bpjsJht: recBpjsJht,
              bpjsJp: recBpjsJp,
              netSalary,
            },
            create: {
              userId: user.id,
              period,
              label: rec.label,
              baseSalary: rec.base,
              allowance: recAllowance,
              bonus: recBonus,
              deduction: recDeduction,
              pph21: recPph21,
              bpjsKesehatan: recBpjsKesehatan,
              bpjsJht: recBpjsJht,
              bpjsJp: recBpjsJp,
              netSalary,
            },
          });
        });
      })
    );

    const totalNet = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const totalGross = payrolls.reduce(
      (sum, p) => sum + p.baseSalary + p.allowance + p.bonus,
      0
    );
    const totalBpjs = payrolls.reduce(
      (sum, p) => sum + p.bpjsKesehatan + p.bpjsJht + p.bpjsJp,
      0
    );

    return NextResponse.json({
      success: true,
      period,
      salaryType,
      count: payrolls.length,
      totalGross,
      totalNet,
      totalPph21: payrolls.reduce((sum, p) => sum + p.pph21, 0),
      totalDeduction: payrolls.reduce((sum, p) => sum + p.deduction, 0),
      totalBpjs,
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
