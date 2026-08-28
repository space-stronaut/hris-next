import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { toDateKey } from "@/lib/date";
import { distanceMeters } from "@/lib/geo";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

function minutesFromMidnight(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

async function resolveCheckLocation(
  companyId: string | null,
  recordType: string,
  lat: number | null,
  lng: number | null
): Promise<{ location: { id: string; name: string; radiusMeters: number }|null; error: string|null }> {
  // Geofence hanya berlaku untuk absensi kantor (OFFICE).
  if (recordType !== "OFFICE") {
    return { location: null, error: null };
  }
  if (!companyId) {
    return { location: null, error: null };
  }
  const locs = await prisma.location.findMany({
    where: { companyId, active: true },
  });
  // Jika belum ada lokasi terdaftar, geofence dilonggarkan.
  if (locs.length === 0) return { location: null, error: null };

  if (lat === null || lng === null) {
    return {
      location: null,
      error: "Lokasi GPS wajib dikirim untuk absensi kantor.",
    };
  }

  let best: (typeof locs)[number] | null = null;
  let bestDist = Infinity;
  for (const l of locs) {
    const d = distanceMeters(lat, lng, l.latitude, l.longitude);
    if (d < bestDist) {
      bestDist = d;
      best = l;
    }
  }
  if (best && bestDist <= best.radiusMeters) {
    return { location: best, error: null };
  }
  return {
    location: null,
    error: `Absensi kantor wajib berada di area. Jarak terdekat ${Math.round(
      bestDist
    )} m dari "${best?.name || "lokasi"}".`,
  };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`attendance:post:${ip}`, {
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
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Sesi berakhir, silakan login kembali." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const action = body.action;
    const selfieKey = body.selfieKey ? String(body.selfieKey) : null;
    const lat = Number.isFinite(Number(body.lat)) ? Number(body.lat) : null;
    const lng = Number.isFinite(Number(body.lng)) ? Number(body.lng) : null;

    const now = new Date();
    const dateKey = toDateKey(now);

    const existing = await prisma.attendance.findUnique({
      where: { userId_dateKey: { userId: session.sub, dateKey } },
    });

    if (action === "check-in") {
      if (existing) {
        return NextResponse.json(
          { success: false, message: "Anda sudah check-in hari ini." },
          { status: 400 }
        );
      }
      if (!selfieKey) {
        return NextResponse.json(
          { success: false, message: "Selfie wajib dilampirkan saat check-in." },
          { status: 400 }
        );
      }

      const recordTypeValue =
        body.recordType === "WFH" || body.recordType === "DINAS"
          ? body.recordType
          : "OFFICE";

      // Resolve shift: roster hari ini > shift default user.
      const roster = await prisma.roster.findUnique({
        where: { userId_dateKey: { userId: session.sub, dateKey } },
        include: { shift: true },
      });
      const user = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { shiftId: true },
      });
      const defaultShift = user?.shiftId
        ? await prisma.shift.findFirst({
            where: {
              id: user.shiftId,
              companyId: session.companyId || undefined,
            },
          })
        : null;
      const shift = roster?.shift || defaultShift;

      const checkInTime = shift?.checkIn || "08:00";
      const tolerance = shift?.tolerance || 0;
      const checkInMin = minutesFromMidnight(checkInTime) + tolerance;
      const nowMin = now.getHours() * 60 + now.getMinutes();
      const lateMinutes = Math.max(0, nowMin - checkInMin);
      const isLate = lateMinutes > 0
        ? "TERLAMBAT"
        : "HADIR";

      // Geofence hanya berlaku untuk absensi kantor (OFFICE).
      let location: { id: string; name: string; radiusMeters: number } | null = null;
      const resolved = await resolveCheckLocation(
        session.companyId,
        recordTypeValue,
        lat,
        lng
      );
      if (resolved.error) {
        return NextResponse.json(
          { success: false, message: resolved.error },
          { status: 400 }
        );
      }
      location = resolved.location;

      const record = await prisma.attendance.create({
        data: {
          userId: session.sub,
          dateKey,
          checkIn: now,
          checkInPhoto: selfieKey,
          status: isLate,
          recordType: recordTypeValue,
          shiftId: shift?.id || null,
          shiftCheckIn: shift?.checkIn || null,
          shiftCheckOut: shift?.checkOut || null,
          lateMinutes: isLate ? lateMinutes : 0,
          checkInLat: lat,
          checkInLng: lng,
          checkInLocationId: location?.id || null,
          note: body.note ? String(body.note).slice(0, 500) : null,
        },
      });
      return NextResponse.json({ success: true, record, status: isLate });
    }

    if (action === "break-in") {
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Anda belum check-in hari ini." },
          { status: 400 }
        );
      }
      if (existing.checkOut) {
        return NextResponse.json(
          { success: false, message: "Absensi sudah selesai hari ini." },
          { status: 400 }
        );
      }
      if (existing.breakIn) {
        return NextResponse.json(
          { success: false, message: "Anda sudah mulai istirahat." },
          { status: 400 }
        );
      }
      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: { breakIn: now },
      });
      return NextResponse.json({ success: true, record });
    }

    if (action === "break-out") {
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Anda belum check-in hari ini." },
          { status: 400 }
        );
      }
      if (existing.checkOut) {
        return NextResponse.json(
          { success: false, message: "Absensi sudah selesai hari ini." },
          { status: 400 }
        );
      }
      if (!existing.breakIn) {
        return NextResponse.json(
          { success: false, message: "Anda belum mulai istirahat." },
          { status: 400 }
        );
      }
      if (existing.breakOut) {
        return NextResponse.json(
          { success: false, message: "Istirahat sudah berakhir." },
          { status: 400 }
        );
      }
      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: { breakOut: now },
      });
      return NextResponse.json({ success: true, record });
    }

    if (action === "check-out") {
      if (!existing) {
        return NextResponse.json(
          { success: false, message: "Anda belum check-in hari ini." },
          { status: 400 }
        );
      }
      if (existing.checkOut) {
        return NextResponse.json(
          { success: false, message: "Anda sudah check-out hari ini." },
          { status: 400 }
        );
      }
      if (!selfieKey) {
        return NextResponse.json(
          { success: false, message: "Selfie wajib dilampirkan saat check-out." },
          { status: 400 }
        );
      }
      // Geofence hanya wajib jika tipe absensi hari ini OFFICE.
      let location: { id: string; name: string; radiusMeters: number } | null = null;
      const resolved = await resolveCheckLocation(
        session.companyId,
        existing.recordType,
        lat,
        lng
      );
      if (resolved.error) {
        return NextResponse.json(
          { success: false, message: resolved.error },
          { status: 400 }
        );
      }
      location = resolved.location;
      const record = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkOut: now,
          checkOutPhoto: selfieKey,
          checkOutLat: lat,
          checkOutLng: lng,
          checkOutLocationId: location?.id || null,
        },
      });
      return NextResponse.json({ success: true, record });
    }

    return NextResponse.json(
      { success: false, message: "Aksi tidak dikenal." },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`attendance:get:${ip}`, {
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
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = request.nextUrl.searchParams.get("userId") || undefined;
    const month = request.nextUrl.searchParams.get("month");

    const where: Record<string, unknown> = {};
    if (session.role === "KARYAWAN") {
      where.userId = session.sub;
    } else if (session.companyId) {
      where.user = { companyId: session.companyId };
    }
    if (userId) where.userId = userId;
    if (month) where.dateKey = { startsWith: month };

    const records = await prisma.attendance.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, username: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, records });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}