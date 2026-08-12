import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: NextRequest) {
  try {
    const session = await getCurrentUser();
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const id = body.id ? String(body.id) : null;

    if (id) {
      const notification = await prisma.notification.findFirst({
        where: { id, userId: session.sub },
        select: { id: true },
      });
      if (notification) {
        await prisma.notification.update({
          where: { id },
          data: { read: true },
        });
      }
    } else {
      await prisma.notification.updateMany({
        where: { userId: session.sub, read: false },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}