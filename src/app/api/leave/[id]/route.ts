import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    const isApprover =
      session?.role === "HRD" ||
      session?.role === "ADMIN" ||
      session?.role === "SPV";
    if (!session || !isApprover) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const status = body.status === "APPROVED" ? "APPROVED" : "REJECTED";

    const scopedWhere =
      session.role === "SPV"
        ? { user: { supervisorId: session.sub } }
        : session.companyId
        ? { user: { companyId: session.companyId } }
        : {};

    const leave = await prisma.leave.findFirst({
      where: { id, ...scopedWhere },
      include: { user: { select: { name: true } } },
    });
    if (!leave) {
      return NextResponse.json(
        { success: false, message: "Pengajuan tidak ditemukan." },
        { status: 404 }
      );
    }
    if (leave.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: "Pengajuan ini sudah diproses." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.leave.update({
        where: { id },
        data: { status, approvedById: session.sub },
      });
      if (status === "APPROVED") {
        await tx.user.update({
          where: { id: leave.userId },
          data: { leaveUsed: { increment: 1 } },
        });
      }
      await tx.notification.create({
        data: {
          userId: leave.userId,
          title: status === "APPROVED" ? "Cuti Disetujui" : "Cuti Ditolak",
          message: `${status === "APPROVED" ? "Disetujui" : "Ditolak"} oleh ${session.name}.`,
        },
      });
      return u;
    });

    return NextResponse.json({ success: true, leave: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
