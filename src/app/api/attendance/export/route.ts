import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatTime, formatDuration, formatDateKey } from "@/lib/date";

function escapeCsv(value: unknown): string {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    if (session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const month =
      request.nextUrl.searchParams.get("month") || undefined;

    const where: Record<string, unknown> = {
      user: { companyId: session.companyId },
    };
    if (month) where.dateKey = { startsWith: month };

    const records = await prisma.attendance.findMany({
      where,
      include: { user: { select: { name: true, username: true } } },
      orderBy: { dateKey: "asc" },
    });

    const rows = records.map((r) => [
      formatDateKey(r.dateKey),
      r.user.name,
      r.user.username,
      formatTime(r.checkIn),
      formatTime(r.checkOut),
      formatDuration(r.checkIn, r.checkOut),
      r.status,
    ]);

    const header = [
      "Tanggal",
      "Nama",
      "Username",
      "Check In",
      "Check Out",
      "Durasi",
      "Status",
    ];

    const csv = [header, ...rows]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\r\n");

    const filename = month
      ? `rekap-absensi-${month}.csv`
      : `rekap-absensi.csv`;

    return new NextResponse("\uFEFF" + csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
