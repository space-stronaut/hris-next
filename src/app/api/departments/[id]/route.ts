import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`departments-patch:${ip}`, {
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
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id } = await params;
    const body = await request.json();
    const name = String(body.name || "").trim();
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Nama departemen wajib diisi." },
        { status: 400 }
      );
    }
    const existing = await prisma.department.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Departemen tidak ditemukan." },
        { status: 404 }
      );
    }
    const dup = await prisma.department.findUnique({
      where: {
        companyId_name: { companyId: session.companyId, name },
      },
    });
    if (dup && dup.id !== id) {
      return NextResponse.json(
        { success: false, message: "Departemen sudah ada." },
        { status: 409 }
      );
    }
    const department = await prisma.department.update({
      where: { id },
      data: { name },
    });
    return NextResponse.json({ success: true, department });
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
    const ip = getClientIp(_request);
    const rateLimitResult = rateLimit(`departments-delete:${ip}`, {
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
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const { id } = await params;
    const existing = await prisma.department.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Departemen tidak ditemukan." },
        { status: 404 }
      );
    }
    await prisma.department.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}