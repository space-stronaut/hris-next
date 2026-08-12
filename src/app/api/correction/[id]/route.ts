import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params;
    const body = await request.json();
    const status = body.status === "APPROVED" ? "APPROVED" : "REJECTED";

    const correction = await prisma.attendanceCorrection.findFirst({
      where: { id, user: { companyId: session.companyId } },
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

    if (status === "APPROVED") {
      const data: Record<string, unknown> = {};
      if (correction.requestedCheckIn) data.checkIn = correction.requestedCheckIn;
      if (correction.requestedCheckOut)
        data.checkOut = correction.requestedCheckOut;
      if (Object.keys(data).length > 0) {
        await prisma.attendance.update({
          where: { id: correction.attendanceId },
          data,
        });
      }
    }

    const updated = await prisma.attendanceCorrection.update({
      where: { id },
      data: { status, approvedById: session.sub },
    });
    return NextResponse.json({ success: true, correction: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}