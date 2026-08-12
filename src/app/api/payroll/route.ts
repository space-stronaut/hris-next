import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { workingDaysInMonth } from "@/lib/date";

export async function GET(request: NextRequest) {
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

    const period = request.nextUrl.searchParams.get("period") || undefined;

    const payrolls = await prisma.payroll.findMany({
      where: {
        ...(period ? { period } : {}),
        user: { companyId: session.companyId },
      },
      include: { user: { select: { name: true, username: true, baseSalary: true } } },
      orderBy: [{ period: "desc" }, { user: { name: "asc" } }],
    });

    return NextResponse.json({ success: true, payrolls });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
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
    const userId = String(body.userId || "");
    const period = String(body.period || "").trim();
    const allowance = Math.max(0, Math.round(Number(body.allowance) || 0));
    const bonus = Math.max(0, Math.round(Number(body.bonus) || 0));
    const note = String(body.note || "").trim() || null;

    if (!userId || !period || !/^\d{4}-\d{2}$/.test(period)) {
      return NextResponse.json(
        { success: false, message: "Data tidak lengkap atau periode tidak valid." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, companyId: session.companyId },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan." },
        { status: 404 }
      );
    }

    const baseSalary = Math.max(0, Math.round(Number(body.baseSalary) ?? user.baseSalary));

    const attendances = await prisma.attendance.findMany({
      where: { userId, dateKey: { startsWith: period } },
    });
    const hadir = attendances.filter((a) => a.status === "HADIR").length;
    const terlambat = attendances.filter((a) => a.status === "TERLAMBAT").length;

    const workingDays = workingDaysInMonth(period);
    const workDays = hadir + terlambat;
    const alphaDays = Math.max(0, workingDays - workDays);
    const dailyRate = workingDays > 0 ? Math.round(baseSalary / workingDays) : 0;
    const deduction = alphaDays * dailyRate;
    const netSalary = baseSalary + allowance + bonus - deduction;

    const payroll = await prisma.payroll.upsert({
      where: { userId_period: { userId, period } },
      update: {
        baseSalary,
        allowance,
        bonus,
        deduction,
        netSalary,
        note,
      },
      create: {
        userId,
        period,
        baseSalary,
        allowance,
        bonus,
        deduction,
        netSalary,
        note,
      },
      include: { user: { select: { name: true, username: true } } },
    });

    return NextResponse.json({
      success: true,
      payroll,
      summary: { hadir, terlambat, alphaDays, workingDays },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
