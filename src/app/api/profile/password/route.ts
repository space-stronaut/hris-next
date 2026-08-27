import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { compare, hash } from "bcryptjs";

export async function PATCH(request: Request) {
  const session = await getCurrentUser();
  if (!session) {
    return NextResponse.json({ message: "Tidak terautentikasi." }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Data tidak valid." }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword || "");
  const newPassword = String(body.newPassword || "");

  if (!currentPassword) {
    return NextResponse.json(
      { message: "Password lama wajib diisi." },
      { status: 400 }
    );
  }
  if (!newPassword || newPassword.length < 6) {
    return NextResponse.json(
      { message: "Password baru minimal 6 karakter." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { password: true },
  });
  if (!user) {
    return NextResponse.json({ message: "Akun tidak ditemukan." }, { status: 404 });
  }

  const valid = await compare(currentPassword, user.password);
  if (!valid) {
    return NextResponse.json(
      { message: "Password lama salah." },
      { status: 400 }
    );
  }

  const hashed = await hash(newPassword, 10);
  await prisma.user.update({
    where: { id: session.sub },
    data: { password: hashed },
  });

  return NextResponse.json({ message: "Password berhasil diubah." });
}