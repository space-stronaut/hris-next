import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hash } from "bcryptjs";

const SALARY_TYPES_VALUES = ["BULAN", "MINGGU", "HARI", "JAM", "PROYEK", "BORONGAN"];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existing = await prisma.user.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan." },
        { status: 404 }
      );
    }
    const body = await request.json();

    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Nama tidak boleh kosong." },
          { status: 400 }
        );
      }
      data.name = name;
    }
    if (body.role !== undefined) {
      data.role = ["ADMIN", "HRD", "SPV", "KARYAWAN"].includes(body.role)
        ? body.role
        : "KARYAWAN";
    }
    const effectiveRole = (data.role as string) ?? existing.role;
    if (body.supervisorId !== undefined) {
      if (effectiveRole !== "KARYAWAN") {
        data.supervisorId = null;
      } else {
        const supervisorId = body.supervisorId
          ? String(body.supervisorId).trim()
          : null;
        if (supervisorId) {
          const supervisor = await prisma.user.findFirst({
            where: {
              id: supervisorId,
              companyId: session.companyId,
              role: "SPV",
            },
            select: { id: true },
          });
          if (!supervisor) {
            return NextResponse.json(
              { success: false, message: "Supervisor tidak valid." },
              { status: 400 }
            );
          }
        }
        data.supervisorId = supervisorId;
      }
    } else if (effectiveRole !== "KARYAWAN") {
      data.supervisorId = null;
    }
    if (body.active !== undefined) {
      data.active = Boolean(body.active);
    }
    if (body.baseSalary !== undefined) {
      data.baseSalary = Math.max(0, Math.round(Number(body.baseSalary) || 0));
    }
    if (body.overtimeRate !== undefined) {
      data.overtimeRate = Math.max(
        0,
        Math.round(Number(body.overtimeRate) || 0)
      );
    }
    if (body.maritalStatus !== undefined) {
      data.maritalStatus = body.maritalStatus === "KAWIN" ? "KAWIN" : "LAJANG";
    }
    if (body.dependents !== undefined) {
      data.dependents = Math.min(
        Math.max(0, Math.round(Number(body.dependents) || 0)),
        3
      );
    }
    if (body.shiftId !== undefined) {
      data.shiftId = body.shiftId ? String(body.shiftId).trim() : null;
    }
    if (body.departmentId !== undefined) {
      data.departmentId = body.departmentId ? String(body.departmentId).trim() : null;
    }
    if (body.position !== undefined) {
      data.position = body.position ? String(body.position).trim() : null;
    }
    if (body.leaveQuota !== undefined) {
      data.leaveQuota = Math.max(0, Math.round(Number(body.leaveQuota) || 0));
    }
    if (body.leaveAccrual !== undefined) {
      data.leaveAccrual = Math.max(0, Math.round(Number(body.leaveAccrual) || 0));
    }
    if (body.leaveAccrualPeriod !== undefined) {
      data.leaveAccrualPeriod =
        body.leaveAccrualPeriod === "YEARLY" ? "YEARLY" : "MONTHLY";
    }
    if (body.salaryType !== undefined) {
      data.salaryType = SALARY_TYPES_VALUES.includes(String(body.salaryType))
        ? String(body.salaryType)
        : "BULAN";
    }
    if (body.password) {
      data.password = await hash(String(body.password), 10);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data yang diubah." },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, name: true, role: true, active: true },
    });

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (id === session.sub) {
      return NextResponse.json(
        { success: false, message: "Tidak dapat menghapus akun sendiri." },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan." },
        { status: 404 }
      );
    }

    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
