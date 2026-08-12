import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function isSuperAdmin(session: { role: string } | null) {
  return !!session && session.role === "SUPER_ADMIN";
}

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!isSuperAdmin(session)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const companies = await prisma.company.findMany({
      select: {
        id: true,
        name: true,
        code: true,
        address: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, companies });
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
    if (!isSuperAdmin(session)) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const code = String(body.code || "").trim();
    const address = String(body.address || "").trim() || null;

    if (!name || !code) {
      return NextResponse.json(
        { success: false, message: "Nama dan kode PT wajib diisi." },
        { status: 400 }
      );
    }

    const exists = await prisma.company.findUnique({ where: { code } });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Kode PT sudah digunakan." },
        { status: 409 }
      );
    }

    const company = await prisma.company.create({
      data: { name, code, address },
    });

    return NextResponse.json({ success: true, company });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
