import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi berakhir, silakan login kembali." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const startDate = String(body.startDate || "").trim();
    const endDate = String(body.endDate || "").trim();
    const type = String(body.type || "").trim();
    const reason = String(body.reason || "").trim();

    if (!startDate || !endDate || !type || !reason) {
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    if (startDate > endDate) {
      return NextResponse.json(
        { success: false, message: "Tanggal selesai harus setelah tanggal mulai." },
        { status: 400 }
      );
    }

    const leave = await prisma.leave.create({
      data: {
        userId: session.sub,
        startDate,
        endDate,
        type,
        reason,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, leave });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const leaves = await prisma.leave.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, leaves });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
