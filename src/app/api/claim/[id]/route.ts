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

    const claim = await prisma.claim.findFirst({
      where: { id, user: { companyId: session.companyId } },
    });
    if (!claim) {
      return NextResponse.json(
        { success: false, message: "Klaim tidak ditemukan." },
        { status: 404 }
      );
    }
    if (claim.status !== "PENDING") {
      return NextResponse.json(
        { success: false, message: "Klaim ini sudah diproses." },
        { status: 400 }
      );
    }

    const updated = await prisma.claim.update({
      where: { id },
      data: { status, approvedById: session.sub },
    });

    return NextResponse.json({ success: true, claim: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
