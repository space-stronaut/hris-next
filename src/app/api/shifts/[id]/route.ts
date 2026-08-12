import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function parseTime(value: string): string | null {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

async function findShift(id: string, companyId: string) {
  return prisma.shift.findFirst({ where: { id, companyId } });
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
    const existing = await findShift(id, session.companyId);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Shift tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Nama shift tidak boleh kosong." },
          { status: 400 }
        );
      }
      data.name = name;
    }
    if (body.checkIn !== undefined) {
      const checkIn = parseTime(String(body.checkIn));
      if (!checkIn) {
        return NextResponse.json(
          { success: false, message: "Format jam masuk tidak valid." },
          { status: 400 }
        );
      }
      data.checkIn = checkIn;
    }
    if (body.checkOut !== undefined) {
      const checkOut = parseTime(String(body.checkOut));
      if (!checkOut) {
        return NextResponse.json(
          { success: false, message: "Format jam keluar tidak valid." },
          { status: 400 }
        );
      }
      data.checkOut = checkOut;
    }
    if (body.tolerance !== undefined) {
      data.tolerance = Math.max(
        0,
        Math.min(300, Math.round(Number(body.tolerance) || 0))
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

    const shift = await prisma.shift.update({ where: { id }, data });
    return NextResponse.json({ success: true, shift });
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
    const existing = await findShift(id, session.companyId);
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Shift tidak ditemukan." },
        { status: 404 }
      );
    }
    await prisma.shift.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}