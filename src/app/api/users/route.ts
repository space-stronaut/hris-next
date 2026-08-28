import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hash } from "bcryptjs";
import { rateLimit, getClientIp } from "@/lib/rate-limit";
import {
  validateUsername,
  validateName,
  validatePassword,
  sanitizeInput,
} from "@/lib/validation";

const SALARY_TYPES_VALUES = ["BULAN", "MINGGU", "HARI", "JAM", "PROYEK", "BORONGAN"];

export async function GET(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`users:get:${ip}`, {
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
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    const users = await prisma.user.findMany({
      where: { companyId: session.companyId },
      select: {
        id: true,
        username: true,
        name: true,
        role: true,
        active: true,
        createdAt: true,
        _count: { select: { attendances: true } },
      },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ success: true, users });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rateLimitResult = rateLimit(`users:post:${ip}`, {
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
    if (!session || session.role !== "ADMIN" || !session.companyId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const username = sanitizeInput(String(body.username || ""));
    const password = String(body.password || "");
    const name = sanitizeInput(String(body.name || ""));
    const role = ["ADMIN", "HRD", "SPV", "KARYAWAN"].includes(body.role)
      ? body.role
      : "KARYAWAN";
    const baseSalary = Math.max(0, Math.round(Number(body.baseSalary) || 0));
    const overtimeRate = Math.max(
      0,
      Math.round(Number(body.overtimeRate) || 0)
    );
    const maritalStatus = body.maritalStatus === "KAWIN" ? "KAWIN" : "LAJANG";
    const dependents = Math.min(
      Math.max(0, Math.round(Number(body.dependents) || 0)),
      3
    );
    const shiftId = body.shiftId
      ? String(body.shiftId).trim()
      : null;
    const supervisorId = role === "KARYAWAN" && body.supervisorId
      ? String(body.supervisorId).trim()
      : null;
    const departmentId = body.departmentId
      ? String(body.departmentId).trim()
      : null;
    const position = body.position ? sanitizeInput(String(body.position)) : null;
    const leaveQuota = Math.max(0, Math.round(Number(body.leaveQuota) || 12));
    const leaveAccrual = Math.max(0, Math.round(Number(body.leaveAccrual) || 1));
    const leaveAccrualPeriod = body.leaveAccrualPeriod === "YEARLY" ? "YEARLY" : "MONTHLY";
    const salaryType = SALARY_TYPES_VALUES.includes(String(body.salaryType))
      ? String(body.salaryType)
      : "BULAN";

    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return NextResponse.json(
        { success: false, message: usernameValidation.error },
        { status: 400 }
      );
    }

    const nameValidation = validateName(name);
    if (!nameValidation.valid) {
      return NextResponse.json(
        { success: false, message: nameValidation.error },
        { status: 400 }
      );
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return NextResponse.json(
        { success: false, message: passwordValidation.error },
        { status: 400 }
      );
    }

    if (supervisorId) {
      const supervisor = await prisma.user.findFirst({
        where: { id: supervisorId, companyId: session.companyId, role: "SPV" },
        select: { id: true },
      });
      if (!supervisor) {
        return NextResponse.json(
          { success: false, message: "Supervisor tidak valid." },
          { status: 400 }
        );
      }
    }

    const exists = await prisma.user.findUnique({ where: { username } });
    if (exists) {
      return NextResponse.json(
        { success: false, message: "Username sudah digunakan." },
        { status: 409 }
      );
    }

    const hashed = await hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        password: hashed,
        name,
        role,
        baseSalary,
        overtimeRate,
        maritalStatus,
        dependents,
        shiftId,
        supervisorId,
        departmentId,
        position,
        leaveQuota,
        leaveAccrual,
        leaveAccrualPeriod,
        salaryType,
        companyId: session.companyId,
      },
    });

    return NextResponse.json({ success: true, user });
  } catch {
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
