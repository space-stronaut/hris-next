import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`roster:get:${ip}`, {
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
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const dateKey = request.nextUrl.searchParams.get("date");
    const where: Record<string, unknown> = {
      companyId: session.companyId,
    };
    if (dateKey) where.dateKey = dateKey;

    const rosters = await prisma.roster.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true } },
        shift: { select: { id: true, name: true, checkIn: true, checkOut: true } },
      },
      orderBy: [{ dateKey: "desc" }, { createdAt: "asc" }],
    });
    return NextResponse.json({ success: true, rosters });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`roster:post:${ip}`, {
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
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const userId = String(body.userId || "").trim();
    const dateKey = String(body.dateKey || "").trim();
    const shiftId = body.shiftId ? String(body.shiftId).trim() : null;

    if (!userId || !dateKey) {
      return NextResponse.json(
        { success: false, message: "Karyawan dan tanggal wajib diisi." },
        { status: 400 }
      );
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json(
        { success: false, message: "Format tanggal tidak valid." },
        { status: 400 }
      );
    }
    if (shiftId) {
      const shift = await prisma.shift.findFirst({
        where: { id: shiftId, companyId: session.companyId },
      });
      if (!shift) {
        return NextResponse.json(
          { success: false, message: "Shift tidak ditemukan." },
          { status: 400 }
        );
      }
    }
    const user = await prisma.user.findFirst({
      where: { id: userId, companyId: session.companyId },
    });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Karyawan tidak ditemukan." },
        { status: 400 }
      );
    }

    // Jika shiftId kosong, hapus roster (gunakan shift default user).
    if (!shiftId) {
      await prisma.roster.deleteMany({ where: { userId, dateKey } });
      return NextResponse.json({
        success: true,
        message: "Roster dihapus, shift default akan berlaku.",
      });
    }

    const roster = await prisma.roster.upsert({
      where: { userId_dateKey: { userId, dateKey } },
      update: { shiftId },
      create: {
        companyId: session.companyId,
        userId,
        dateKey,
        shiftId,
      },
    });
    return NextResponse.json({ success: true, roster });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}