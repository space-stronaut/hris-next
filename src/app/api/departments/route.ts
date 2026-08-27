import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const departments = await prisma.department.findMany({
      where: { companyId: session.companyId },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { users: true } },
      },
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ success: true, departments });
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
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Nama departemen wajib diisi." },
        { status: 400 }
      );
    }
    const existing = await prisma.department.findUnique({
      where: {
        companyId_name: { companyId: session.companyId, name },
      },
    });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Departemen sudah ada." },
        { status: 409 }
      );
    }
    const department = await prisma.department.create({
      data: { companyId: session.companyId, name },
    });
    return NextResponse.json({ success: true, department });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}