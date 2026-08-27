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

    const correction = await prisma.attendanceCorrection.findFirst({
      where: { id, ...scopedWhere },
      include: { user: { select: { name: true } } },
    });
    if (!correction) {
      return NextResponse.json(
        { success: false, message: "Pengajuan koreksi tidak ditemukan." },
        { status: 404 }
      );
    }
    if (correction.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: "Pengajuan ini sudah diproses." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      if (status === "APPROVED") {
        const data: Record<string, unknown> = {};
        if (correction.requestedCheckIn) data.checkIn = correction.requestedCheckIn;
        if (correction.requestedCheckOut)
          data.checkOut = correction.requestedCheckOut;
        if (Object.keys(data).length > 0) {
          await tx.attendance.update({
            where: { id: correction.attendanceId },
            data,
          });
        }
      }
      const u = await tx.attendanceCorrection.update({
        where: { id },
        data: { status, approvedById: session.sub },
      });
      await tx.notification.create({
        data: {
          userId: correction.userId,
          title:
            status === "APPROVED"
              ? "Koreksi Absensi Disetujui"
              : "Koreksi Absensi Ditolak",
          message: `${status === "APPROVED" ? "Disetujui" : "Ditolak"} oleh ${session.name}.`,
        },
      });
      return u;
    });

    return NextResponse.json({ success: true, correction: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}