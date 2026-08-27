import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

export async function PATCH(request: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  let body: {
    email?: string | null;
    phone?: string | null;
    birthDate?: string | null;
    address?: string | null;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
  }

  const data: {
    email?: string | null;
    phone?: string | null;
    birthDate?: Date | null;
    address?: string | null;
  } = {};

  if (body.email !== undefined) data.email = body.email?.trim() || null;
  if (body.phone !== undefined) data.phone = body.phone?.trim() || null;
  if (body.address !== undefined) data.address = body.address?.trim() || null;
  if (body.birthDate !== undefined) {
    data.birthDate = body.birthDate ? new Date(body.birthDate) : null;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ message: "Tidak ada data yang diubah." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.sub },
    data,
  });

  return NextResponse.json({ message: "Profil berhasil diperbarui." });
}