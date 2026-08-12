import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

async function authorize(session: Awaited<ReturnType<typeof getCurrentUser>>) {
  if (
    !session ||
    !session.companyId ||
    (session.role !== "HRD" && session.role !== "ADMIN")
  ) {
    return false;
  }
  return true;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentUser();
    if (!(await authorize(session))) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const existing = await prisma.meeting.findFirst({
      where: { id, companyId: session!.companyId },
    });
    if (!existing) {
      return NextResponse.json(
        { success: false, message: "Meeting tidak ditemukan." },
        { status: 404 }
      );
    }

    const body = await request.json();
    const title = String(body.title ?? existing.title).trim();
    const date = String(body.date ?? existing.date).trim();
    const time = String(body.time ?? existing.time).trim();
    const location = String(body.location ?? existing.location).trim();
    const agenda = String(body.agenda ?? existing.agenda ?? "").trim() || null;
    const participantIds: string[] = Array.isArray(body.participantIds)
      ? body.participantIds.map((p: unknown) => String(p)).filter(Boolean)
      : [];

    if (!title || !date || !time || !location) {
      return NextResponse.json(
        { success: false, message: "Semua field wajib diisi." },
        { status: 400 }
      );
    }

    const companyUsers = await prisma.user.findMany({
      where: { companyId: session!.companyId },
      select: { id: true },
    });
    const validUserIds = new Set(companyUsers.map((u) => u.id));
    const participantIdsValid = Array.from(
      new Set(participantIds.filter((p) => validUserIds.has(p)))
    );

    const meeting = await prisma.$transaction(async (tx) => {
      const prev = await tx.meetingParticipant.findMany({
        where: { meetingId: id },
        select: { userId: true },
      });
      const prevIds = new Set(prev.map((p) => p.userId));

      const updated = await tx.meeting.update({
        where: { id },
        data: {
          title,
          date,
          time,
          location,
          agenda,
          participants: {
            deleteMany: {},
            create: participantIdsValid.map((userId) => ({ userId })),
          },
        },
      });

      const newIds = participantIdsValid.filter(
        (userId) => !prevIds.has(userId) && userId !== session!.sub
      );
      if (newIds.length > 0) {
        await tx.notification.createMany({
          data: newIds.map((userId) => ({
            userId,
            meetingId: id,
            title: "Meeting Diperbarui",
            message: `Anda diundang ke meeting "${title}" pada ${date} pukul ${time}.`,
          })),
        });
      }

      return updated;
    });

    return NextResponse.json({ success: true, meeting });
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

    const { id } = await params;
    const meeting = await prisma.meeting.findFirst({
      where: { id, companyId: session.companyId },
    });
    if (!meeting) {
      return NextResponse.json(
        { success: false, message: "Meeting tidak ditemukan." },
        { status: 404 }
      );
    }
    await prisma.meeting.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
