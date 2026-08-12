import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

function parseTime(value: string): string | null {
  if (!/^\d{1,2}:\d{2}$/.test(value)) return null;
  const [h, m] = value.split(":").map(Number);
  if (h > 23 || m > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function durationMinutes(start: string, end: string): number {
  const toMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };
  const s = toMin(start);
  const e = toMin(end);
  // Melewati tengah malam dihitung sebagai hari berikutnya.
  return e >= s ? e - s : e + 1440 - s;
}

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
    const dateKey = String(body.dateKey || "").trim();
    const startTime = parseTime(String(body.startTime || ""));
    const endTime = parseTime(String(body.endTime || ""));
    const reason = String(body.reason || "").trim();

    if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      return NextResponse.json(
        { success: false, message: "Format tanggal tidak valid." },
        { status: 400 }
      );
    }
    if (!startTime || !endTime) {
      return NextResponse.json(
        { success: false, message: "Jam mulai dan selesai wajib diisi." },
        { status: 400 }
      );
    }
    if (!reason) {
      return NextResponse.json(
        { success: false, message: "Alasan lembur wajib diisi." },
        { status: 400 }
      );
    }
    const duration = durationMinutes(startTime, endTime);
    if (duration < 30) {
      return NextResponse.json(
        { success: false, message: "Durasi lembur minimal 30 menit." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: { overtimeRate: true },
    });
    const rate = user?.overtimeRate || 0;
    const payAmount = Math.round((rate * duration) / 60);

    const overtime = await prisma.overtime.create({
      data: {
        userId: session.sub,
        dateKey,
        startTime,
        endTime,
        durationMinutes: duration,
        payAmount,
        reason,
        status: "PENDING",
      },
    });
    return NextResponse.json({ success: true, overtime });
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
    const overtimes = await prisma.overtime.findMany({
      where: { userId: session.sub },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ success: true, overtimes });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}