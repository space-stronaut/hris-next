import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getObject } from "@/lib/s3";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json(
      { success: false, message: "Unauthorized" },
      { status: 401 }
    );
  }

  const key = String(request.nextUrl.searchParams.get("key") || "");
  if (!key || key.includes("..") || !key.startsWith("attendance/")) {
    return NextResponse.json(
      { success: false, message: "Key tidak valid." },
      { status: 400 }
    );
  }

  try {
    const { body, contentType } = await getObject(key);
    return new Response(new Uint8Array(body), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, message: "Foto tidak ditemukan." },
      { status: 404 }
    );
  }
}