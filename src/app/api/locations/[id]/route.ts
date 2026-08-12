import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function findLocation(id: string, companyId: string) {
  return prisma.location.findFirst({ where: { id, companyId } });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id } = await params;
    const existing = await findLocation(id, session.companyId);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Lokasi tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Nama lokasi tidak boleh kosong." },
          { status: 400 }
        );
      }
      data.name = name;
    }
    if (body.latitude !== undefined) {
      const latitude = Number(body.latitude);
      if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90) {
        return NextResponse.json(
          { success: false, message: "Latitude tidak valid." },
          { status: 400 }
        );
      }
      data.latitude = latitude;
    }
    if (body.longitude !== undefined) {
      const longitude = Number(body.longitude);
      if (!Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
        return NextResponse.json(
          { success: false, message: "Longitude tidak valid." },
          { status: 400 }
        );
      }
      data.longitude = longitude;
    }
    if (body.radiusMeters !== undefined) {
      data.radiusMeters = Math.max(
        20,
        Math.min(5000, Math.round(Number(body.radiusMeters) || 100))
      );
    }
    if (body.active !== undefined) {
      data.active = Boolean(body.active);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data yang diubah." },
        { status: 400 }
      );
    }

    const location = await prisma.location.update({ where: { id }, data });
    return NextResponse.json({ success: true, location });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id } = await params;
    const existing = await findLocation(id, session.companyId);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Lokasi tidak ditemukan." },
        { status: 404 }
      );
    }
    await prisma.location.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}