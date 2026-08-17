import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hash } from "bcryptjs";

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
      data.role = ["ADMIN", "HRD", "KARYAWAN"].includes(body.role)
        ? body.role
        : "KARYAWAN";
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
