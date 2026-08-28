import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hash } from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function isSuperAdmin(session: { role: string } | null) {
  return !!session && session.role === "SUPER_ADMIN";
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`companies-admins-patch:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 20,
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: "Terlalu banyak request. Coba lagi nanti." },
        { status: 429 }
      );
    }
    const session = await getCurrentUser();
    if (!isSuperAdmin(session)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, userId } = await params;
    const admin = await prisma.user.findFirst({
      where: { id: userId, companyId: id, role: "ADMIN" },
    });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) {
      const name = String(body.name || "").trim();
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Nama tidak boleh kosong." },
          { status: 400 }
        );
      }
      data.name = name;
    }
    if (body.active !== undefined) {
      data.active = Boolean(body.active);
    }
    if (body.password) {
      data.password = await hash(String(body.password), 10);
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json(
        { success: false, message: "Tidak ada data yang diubah." },
        { status: 400 }
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data,
      select: { id: true, username: true, name: true, active: true },
    });

    return NextResponse.json({ success: true, admin: updated });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const ip = getClientIp(_request);
    const rateLimitResult = rateLimit(`companies-admins-delete:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 5,
    });
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: "Terlalu banyak request. Coba lagi nanti." },
        { status: 429 }
      );
    }
    const session = await getCurrentUser();
    if (!isSuperAdmin(session)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id, userId } = await params;
    const admin = await prisma.user.findFirst({
      where: { id: userId, companyId: id, role: "ADMIN" },
    });
    if (!admin) {
      return NextResponse.json(
        { success: false, message: "Admin tidak ditemukan." },
        { status: 404 }
      );
    }
    if (admin.id === session.sub) {
      return NextResponse.json(
        { success: false, message: "Tidak dapat menghapus akun sendiri." },
        { status: 400 }
      );
    }

    await prisma.user.delete({ where: { id: userId } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
