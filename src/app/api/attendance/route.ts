import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey, isLate } from "@/lib/date";

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
    const action = body.action;

    const now = new Date();
    const dateKey = toDateKey(now);

    const existing = await prisma.attendance.findUnique({
      where: { userId_dateKey: { userId: session.sub, dateKey } },
    });

    if (action === "check-in") {
      if (existing) {
        return NextResponse.json(
          { success: false, message: "Anda sudah check-in hari ini." },
          { status: 400 }
        );
      }
      const company = session.companyId
        ? await prisma.company.findUnique({
            where: { id: session.companyId },
            select: { checkInTime: true },
          })
        : null;
      const checkInTime = company?.checkInTime || "08:00";
      const status = isLate(now, checkInTime) ? "TERLAMBAT" : "HADIR";
      const record = await prisma.attendance.create({
        data: {
          userId: session.sub,
          dateKey,
          checkIn: now,
          status,
        },
      });
      return NextResponse.json({ success: true, record, status });
    }

    if (action === "check-out") {
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Anda belum check-in hari ini." },
          { status: 400 }
        );
      }
      if (existing.checkOut) {
        return NextResponse.json(
          { success: false, message: "Anda sudah check-out hari ini." },
          { status: 400 }
        );
      }
      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: { checkOut: now },
      });
      return NextResponse.json({ success: true, record });
    }

    return NextResponse.json(
      { success: false, message: "Aksi tidak dikenal." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = request.nextUrl.searchParams.get("userId") || undefined;
    const month = request.nextUrl.searchParams.get("month");

    const where: Record<string, unknown> = {};
    if (session.role === "KARYAWAN") {
      where.userId = session.sub;
    } else if (session.companyId) {
      where.user = { companyId: session.companyId };
    }
    if (userId) where.userId = userId;
    if (month) where.dateKey = { startsWith: month };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, records });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
