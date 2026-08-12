import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey } from "@/lib/date";

function minutesFromMidnight(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

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
    const selfieKey = body.selfieKey ? String(body.selfieKey) : null;

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

      const recordTypeValue =
        body.recordType === "WFH" || body.recordType === "DINAS"
          ? body.recordType
          : "OFFICE";

      // Resolve shift: roster hari ini > shift default user.
      const roster = await prisma.roster.findUnique({
        where: { userId_dateKey: { userId: session.sub, dateKey } },
        include: { shift: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { shiftId: true },
      });
      const defaultShift = user?.shiftId
        ? await prisma.shift.findFirst({
            where: {
              id: user.shiftId,
              companyId: session.companyId || undefined,
            },
          })
        : null;
      const shift = roster?.shift || defaultShift;

      const checkInTime = shift?.checkIn || "08:00";
      const tolerance = shift?.tolerance || 0;
      const checkInMin = minutesFromMidnight(checkInTime) + tolerance;
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const lateMinutes = Math.max(0, nowMin - checkInMin);
      const isLate = lateMinutes > 0
        ? "TERLAMBAT"
        : "HADIR";

      const record = await prisma.attendance.create({
        data: {
          userId: session.sub,
          dateKey,
          checkIn: now,
          checkInPhoto: selfieKey,
          status: isLate,
          recordType: recordTypeValue,
          shiftId: shift?.id || null,
          shiftCheckIn: shift?.checkIn || null,
          shiftCheckOut: shift?.checkOut || null,
          lateMinutes: isLate ? lateMinutes : 0,
          note: body.note ? String(body.note).slice(0, 500) : null,
        },
      });
      return NextResponse.json({ success: true, record, status: isLate });
    }

    if (action === "break-in") {
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Anda belum check-in hari ini." },
          { status: 400 }
        );
      }
      if (existing.checkOut) {
        return NextResponse.json(
          { success: false, message: "Absensi sudah selesai hari ini." },
          { status: 400 }
        );
      }
      if (existing.breakIn) {
        return NextResponse.json(
          { success: false, message: "Anda sudah mulai istirahat." },
          { status: 400 }
        );
      }
      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: { breakIn: now },
      });
      return NextResponse.json({ success: true, record });
    }

    if (action === "break-out") {
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Anda belum check-in hari ini." },
          { status: 400 }
        );
      }
      if (existing.checkOut) {
        return NextResponse.json(
          { success: false, message: "Absensi sudah selesai hari ini." },
          { status: 400 }
        );
      }
      if (!existing.breakIn) {
        return NextResponse.json(
          { success: false, message: "Anda belum mulai istirahat." },
          { status: 400 }
        );
      }
      if (existing.breakOut) {
        return NextResponse.json(
          { success: false, message: "Istirahat sudah berakhir." },
          { status: 400 }
        );
      }
      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: { breakOut: now },
      });
      return NextResponse.json({ success: true, record });
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
        data: { checkOut: now, checkOutPhoto: selfieKey },
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