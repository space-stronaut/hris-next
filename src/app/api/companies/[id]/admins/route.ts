import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hash } from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function isSuperAdmin(session: { role: string } | null) {
  return !!session && session.role === "SUPER_ADMIN";
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(_request);
    const rateLimitResult = rateLimit(`companies-admins:get:${ip}`, {
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
    if (!isSuperAdmin(session)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json(
        { success: false, message: "Perusahaan tidak ditemukan." },
        { status: 404 }
      );
    }

    const admins = await prisma.user.findMany({
      where: { companyId: id, role: "ADMIN" },
      select: {
        id: true,
        username: true,
        name: true,
        active: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, company, admins });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`companies-admins:post:${ip}`, {
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
    if (!isSuperAdmin(session)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const company = await prisma.company.findUnique({ where: { id } });
    if (!company) {
      return NextResponse.json(
        { success: false, message: "Perusahaan tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const username = String(body.username || "").trim();
    const password = String(body.password || "");
    const name = String(body.name || "").trim();

    if (!username || !password || !name) {
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Username sudah digunakan." },
        { status: 409 }
      );
    }

    const admin = await prisma.user.create({
      data: {
        username,
        password: await hash(password, 10),
        name,
        role: "ADMIN",
        companyId: id,
      },
    });

    return NextResponse.json({ success: true, admin });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
