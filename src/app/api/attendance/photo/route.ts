import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { objectKey, uploadObject } from "@/lib/s3";
import { rateLimit, getClientIp } from "@/lib/rate-limit";

const MAX_BYTES = 5 * 1024 * 1024;

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`attendance-photo:post:${ip}`, {
      windowMs: 60 * 1000,
      maxRequests: 10,
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
    const data = String(body.data || "");
    const purpose = body.purpose === "out" ? "out" : "in";

    if (!data.startsWith("data:image/")) {
      return NextResponse.json(
        { success: false, message: "Format gambar tidak valid." },
        { status: 400 }
      );
    }

    const comma = data.indexOf(",");
    const mime = data.slice(5, comma).split(";")[0]; // image/jpeg dll
    const b64 = data.slice(comma + 1);
    const buffer = Buffer.from(b64, "base64");
    if (buffer.length === 0 || buffer.length > MAX_BYTES) {
      return NextResponse.json(
        { success: false, message: "Ukuran gambar tidak valid (maks 5MB)." },
        { status: 400 }
      );
    }

    const ext = mime === "image/png" ? "png" : "jpg";
    const key = objectKey(purpose, session.sub, ext);
    await uploadObject(key, buffer, mime);

    return NextResponse.json({ success: true, key });
  } catch {
    return NextResponse.json(
      { success: false, message: "Gagal mengunggah foto. Periksa konfigurasi S3." },
      { status: 500 }
    );
  }
}