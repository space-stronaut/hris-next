import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/prisma";

const secret = new TextEncoder().encode(process.env.JWT_SECRET || "dev-secret");

export const SESSION_COOKIE = "absensi_session";

export type SessionPayload = {
  sub: string;
  username: string;
  name: string;
  role: string;
  companyId: string | null;
  companyName: string | null;
};

export async function signSessionToken(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(secret);
}

export async function verifySessionToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, secret);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const token = await signSessionToken(payload);
  const cookieStore = await cookies();
  const headerStore = await headers();
  // Secure hanya dipakai jika koneksi benar-benar HTTPS, agar cookie tetap
  // tersimpan saat aplikasi diakses lewat HTTP biasa (mis. localhost/127.0.0.1).
  const proto = headerStore.get("x-forwarded-proto");
  const isSecure = proto === "https";
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isSecure,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export const getCurrentUser = cache(async () => {
  const session = await getSession();
  if (!session) return null;

  // Pastikan user masih ada di database. Jika sudah dihapus (mis. karena seed
  // ulang membuat ulang user dengan id baru), sesi dianggap tidak valid agar
  // operasi create tidak memakai userId yang sudah tidak ada (error FK).
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { id: true, username: true, name: true, role: true, companyId: true },
  });
  if (!user) return null;

  return {
    sub: user.id,
    username: user.username,
    name: user.name,
    role: user.role,
    companyId: user.companyId,
    companyName: session.companyName,
  };
});
