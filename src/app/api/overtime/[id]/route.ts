import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`overtime-patch:${ip}`, {
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

    const overtime = await prisma.overtime.findFirst({
      where: { id, ...scopedWhere },
      include: { user: { select: { name: true } } },
    });
    if (!overtime) {
      return NextResponse.json(
        { success: false, message: "Pengajuan lembur tidak ditemukan." },
        { status: 404 }
      );
    }
    if (overtime.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: "Pengajuan ini sudah diproses." },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const u = await tx.overtime.update({
        where: { id },
        data: { status, approvedById: session.sub },
      });
      await tx.notification.create({
        data: {
          userId: overtime.userId,
          title: status === "APPROVED" ? "Lembur Disetujui" : "Lembur Ditolak",
          message: `${status === "APPROVED" ? "Disetujui" : "Ditolak"} oleh ${session.name}.`,
        },
      });
      return u;
    });

    return NextResponse.json({ success: true, overtime: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}