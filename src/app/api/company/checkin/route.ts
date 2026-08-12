import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
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
    const checkInTime = String(body.checkInTime || "").trim();
    if (!/^\d{1,2}:\d{2}$/.test(checkInTime)) {
      return NextResponse.json(
        { success: false, message: "Format jam masuk tidak valid." },
        { status: 400 }
      );
    }

    const [h, m] = checkInTime.split(":").map(Number);
    if (h > 23 || m > 59) {
      return NextResponse.json(
        { success: false, message: "Jam masuk tidak valid." },
        { status: 400 }
      );
    }
    const normalized = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    const company = await prisma.company.update({
      where: { id: session.companyId },
      data: { checkInTime: normalized },
      select: { checkInTime: true },
    });

    return NextResponse.json({ success: true, checkInTime: company.checkInTime });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}