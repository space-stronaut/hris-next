import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { calculatePph21 } from "@/lib/tax";
import { calculateBpjs } from "@/lib/bpjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`payroll-patch:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 20,
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: "Terlalu banyak request. Coba lagi nanti." },
        { status: 429 }
      );
    }
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

    const { id } = await params;
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.status !== undefined) {
      const status = body.status === "PAID" ? "PAID" : "DRAFT";
      data.status = status;
    }
    if (body.allowance !== undefined)
      data.allowance = Math.max(0, Math.round(Number(body.allowance) || 0));
    if (body.bonus !== undefined)
      data.bonus = Math.max(0, Math.round(Number(body.bonus) || 0));
    if (body.deduction !== undefined)
      data.deduction = Math.max(0, Math.round(Number(body.deduction) || 0));
    if (body.baseSalary !== undefined)
      data.baseSalary = Math.max(0, Math.round(Number(body.baseSalary) || 0));
    if (body.note !== undefined) data.note = String(body.note || "").trim() || null;

    const payroll = await prisma.payroll.findFirst({
      where: { id, user: { companyId: session.companyId } },
    });
    if (!payroll) {
      return NextResponse.json(
        { success: false, message: "Data payroll tidak ditemukan." },
        { status: 404 }
      );
    }

    const baseSalary = (data.baseSalary as number) ?? payroll.baseSalary;
    const allowance = (data.allowance as number) ?? payroll.allowance;
    const bonus = (data.bonus as number) ?? payroll.bonus;
    const deduction = (data.deduction as number) ?? payroll.deduction;
    const user = await prisma.user.findFirst({
      where: { id: payroll.userId },
      select: { maritalStatus: true, dependents: true },
    });
    const gross = baseSalary + allowance + bonus;
    const pph21 = calculatePph21(
      user?.maritalStatus ?? "LAJANG",
      user?.dependents ?? 0,
      gross
    );
    data.pph21 = pph21;
    const bpjs = calculateBpjs(baseSalary);
    data.bpjsKesehatan = bpjs.bpjsKesehatan;
    data.bpjsJht = bpjs.bpjsJht;
    data.bpjsJp = bpjs.bpjsJp;
    data.netSalary = gross - pph21 - deduction - bpjs.total;

    const updated = await prisma.payroll.update({
      where: { id },
      data,
      include: { user: { select: { name: true, username: true } } },
    });

    return NextResponse.json({ success: true, payroll: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
