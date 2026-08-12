import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi berakhir, silakan login kembali." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const type = String(body.type || "").trim();
    const amount = Math.round(Number(body.amount));
    const description = String(body.description || "").trim();
    const date = String(body.date || "").trim();

    if (!type || !date || !description || isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi dan nominal harus lebih dari 0." },
        { status: 400 }
      );
    }

    const claim = await prisma.claim.create({
      data: {
        userId: session.sub,
        type,
        amount,
        description,
        date,
        status: "PENDING",
      },
    });

    return NextResponse.json({ success: true, claim });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const claims = await prisma.claim.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, claims });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
