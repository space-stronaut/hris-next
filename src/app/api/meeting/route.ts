import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const meetings = await prisma.meeting.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return NextResponse.json({ success: true, meetings });
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
    if (
      !session ||
      !session.companyId ||
      (session.role !== "HRD" && session.role !== "ADMIN")
    ) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const title = String(body.title || "").trim();
    const date = String(body.date || "").trim();
    const time = String(body.time || "").trim();
    const location = String(body.location || "").trim();
    const agenda = String(body.agenda || "").trim() || null;
    const participantIds: string[] = Array.isArray(body.participantIds)
      ? body.participantIds.map((id: unknown) => String(id)).filter(Boolean)
      : [];

    if (!title || !date || !time || !location) {
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    const companyUsers = await prisma.user.findMany({
      where: { companyId: session.companyId },
      select: { id: true },
    });
    const validUserIds = new Set(companyUsers.map((u) => u.id));
    const participantIdsValid = participantIds.filter((id) =>
      validUserIds.has(id)
    );

    const meeting = await prisma.$transaction(async (tx) => {
      const created = await tx.meeting.create({
        data: {
          title,
          date,
          time,
          location,
          agenda,
          companyId: session.companyId,
          createdById: session.sub,
          participants: {
            create: participantIdsValid.map((userId) => ({ userId })),
          },
        },
      });

      const notify = participantIdsValid.filter((id) => id !== session.sub);
      if (notify.length > 0) {
        await tx.notification.createMany({
          data: notify.map((userId) => ({
            userId,
            meetingId: created.id,
            title: "Meeting Baru",
            message: `Anda diundang ke meeting "${title}" pada ${date} pukul ${time}.`,
          })),
        });
      }

      return created;
    });

    return NextResponse.json({ success: true, meeting });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
