import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function parseTime(value: string): string | null {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const shifts = await prisma.shift.findMany({
      where: { companyId: session.companyId },
      include: { _count: { select: { users: true } } },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, shifts });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Nama shift wajib diisi." },
        { status: 400 }
      );
    }
    const checkIn = parseTime(String(body.checkIn ?? "08:00"));
    if (!checkIn) {
      return NextResponse.json(
        { success: false, message: "Format jam masuk tidak valid." },
        { status: 400 }
      );
    }
    const checkOut = parseTime(String(body.checkOut ?? "17:00"));
    if (!checkOut) {
      return NextResponse.json(
        { success: false, message: "Format jam keluar tidak valid." },
        { status: 400 }
      );
    }
    const tolerance = Math.max(
      0,
      Math.min(300, Math.round(Number(body.tolerance) || 0))
    );

    const shift = await prisma.shift.create({
      data: {
        companyId: session.companyId,
        name,
        checkIn,
        checkOut,
        tolerance,
        active: body.active !== false,
      },
    });
    return NextResponse.json({ success: true, shift });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}