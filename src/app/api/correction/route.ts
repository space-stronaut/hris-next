import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`correction:post:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 10,
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: "Terlalu banyak request. Coba lagi nanti." },
        { status: 429 }
      );
    }
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi berakhir, silakan login kembali." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const attendanceId = String(body.attendanceId || "").trim();
    const reason = String(body.reason || "").trim();
    const requestedCheckIn = body.requestedCheckIn
      ? new Date(body.requestedCheckIn)
      : null;
    const requestedCheckOut = body.requestedCheckOut
      ? new Date(body.requestedCheckOut)
      : null;

    if (!attendanceId || !reason) {
      return NextResponse.json(
        { success: false, message: "Data absensi dan alasan wajib diisi." },
        { status: 400 }
      );
    }
    if (!requestedCheckIn && !requestedCheckOut) {
      return NextResponse.json(
        { success: false, message: "Setidaknya satu waktu baru harus diisi." },
        { status: 400 }
      );
    }

    const attendance = await prisma.attendance.findFirst({
      where: { id: attendanceId, userId: session.sub },
    });
    if (!attendance) {
      return NextResponse.json(
        { success: false, message: "Data absensi tidak ditemukan." },
        { status: 404 }
      );
    }

    const correction = await prisma.attendanceCorrection.create({
      data: {
        userId: session.sub,
        attendanceId,
        requestedCheckIn,
        requestedCheckOut,
        reason,
        status: "PENDING",
      },
    });
    return NextResponse.json({ success: true, correction });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`correction:get:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 30,
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: "Terlalu banyak request. Coba lagi nanti." },
        { status: 429 }
      );
    }
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const corrections = await prisma.attendanceCorrection.findMany({
      where: { userId: session.sub },
      include: { attendance: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, corrections });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}