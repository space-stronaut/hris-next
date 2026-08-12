import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function validCoord(value: unknown): number | null {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
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
    const locations = await prisma.location.findMany({
      where: { companyId: session.companyId },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, locations });
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
    const latitude = validCoord(body.latitude);
    const longitude = validCoord(body.longitude);
    const radius = Math.max(
      20,
      Math.min(5000, Math.round(Number(body.radiusMeters) || 100))
    );

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Nama lokasi wajib diisi." },
        { status: 400 }
      );
    }
    if (
      latitude === null ||
      longitude === null ||
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      return NextResponse.json(
        { success: false, message: "Koordinat tidak valid (lat ±90, lng ±180)." },
        { status: 400 }
      );
    }

    const location = await prisma.location.create({
      data: {
        companyId: session.companyId,
        name,
        latitude,
        longitude,
        radiusMeters: radius,
        active: body.active !== false,
      },
    });
    return NextResponse.json({ success: true, location });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}