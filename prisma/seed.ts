import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { hash } from "bcryptjs";
import { workingDaysInMonth } from "../src/lib/date";
import { calculatePph21 } from "../src/lib/tax";

const adapter = new PrismaPg(process.env.DATABASE_URL as string);
const prisma = new PrismaClient({ adapter });

function toKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function lastWorkingDays(count: number): string[] {
  const keys: string[] = [];
  const cursor = new Date();
  while (keys.length < count) {
    cursor.setDate(cursor.getDate() - 1);
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) keys.unshift(toKey(cursor));
  }
  return keys;
}

type EmployeeSeed = {
  username: string;
  name: string;
  baseSalary: number;
  maritalStatus: "LAJANG" | "KAWIN";
  dependents: number;
  onTimeIn: string[];
  lateIn: string[];
  overtimeRate?: number;
};

async function seedCompany(
  company: { name: string; code: string; address?: string }
) {
  const password = await hash("karyawan123", 10);
  const hrdPassword = await hash("hrd123", 10);
  const adminPassword = await hash("admin123", 10);

  const c = await prisma.company.upsert({
    where: { code: company.code },
    update: { name: company.name, address: company.address },
    create: { name: company.name, code: company.code, address: company.address },
  });

  // ============ HAPUS DATA LAMA COMPANY ============
  await prisma.meetingParticipant.deleteMany({ where: { meeting: { companyId: c.id } } });
  await prisma.notification.deleteMany({ where: { meeting: { companyId: c.id } } });
  await prisma.meeting.deleteMany({ where: { companyId: c.id } });
  const companyUsers = await prisma.user.findMany({
    where: { companyId: c.id },
    select: { id: true },
  });
  const ids = companyUsers.map((u) => u.id);
  await prisma.attendanceCorrection.deleteMany({ where: { userId: { in: ids } } });
  await prisma.overtime.deleteMany({ where: { userId: { in: ids } } });
  await prisma.claim.deleteMany({ where: { userId: { in: ids } } });
  await prisma.payroll.deleteMany({ where: { userId: { in: ids } } });
  await prisma.leave.deleteMany({ where: { userId: { in: ids } } });
  await prisma.roster.deleteMany({ where: { companyId: c.id } });
  await prisma.attendance.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { companyId: c.id } });

  // ============ SHIFT & LOKASI ============
  const shift = await prisma.shift.upsert({
    where: { id: `shift_office_${c.id}` },
    update: {},
    create: {
      id: `shift_office_${c.id}`,
      companyId: c.id,
      name: "Shift Kantor (08:00-17:00)",
      checkIn: "08:00",
      checkOut: "17:00",
      tolerance: 15,
      active: true,
    },
  });
  const shiftFlex = await prisma.shift.upsert({
    where: { id: `shift_flex_${c.id}` },
    update: {},
    create: {
      id: `shift_flex_${c.id}`,
      companyId: c.id,
      name: "Shift Fleksibel (09:00-18:00)",
      checkIn: "09:00",
      checkOut: "18:00",
      tolerance: 0,
      active: true,
    },
  });
  const location = await prisma.location.upsert({
    where: { id: `loc_kantor_${c.id}` },
    update: {},
    create: {
      id: `loc_kantor_${c.id}`,
      companyId: c.id,
      name: "Kantor Pusat",
      latitude: -6.2088,
      longitude: 106.8456,
      radiusMeters: 200,
      active: true,
    },
  });

  // ============ PENGGUNA ============
  await prisma.user.create({
    data: {
      username: `admin_${company.code}`,
      password: adminPassword,
      name: `Admin ${company.name}`,
      role: "ADMIN",
      companyId: c.id,
      baseSalary: 8500000,
    },
  });
  const hrd = await prisma.user.create({
    data: {
      username: `hrd_${company.code}`,
      password: hrdPassword,
      name: `HRD ${company.name}`,
      role: "HRD",
      companyId: c.id,
      baseSalary: 6000000,
      maritalStatus: "KAWIN",
      dependents: 1,
      shiftId: shift.id,
    },
  });

  const specs: EmployeeSeed[] = [
    {
      username: `budi_${company.code}`,
      name: "Budi Santoso",
      baseSalary: 4500000,
      maritalStatus: "LAJANG",
      dependents: 0,
      onTimeIn: ["07:45", "07:52", "07:58"],
      lateIn: ["08:10", "08:24", "08:35"],
    },
    {
      username: `sari_${company.code}`,
      name: "Sari Dewi",
      baseSalary: 5000000,
      maritalStatus: "KAWIN",
      dependents: 1,
      onTimeIn: ["07:40", "07:50", "07:55"],
      lateIn: ["08:05", "08:20", "08:40"],
    },
    {
      username: `dewi_${company.code}`,
      name: "Dewi Lestari",
      baseSalary: 7200000,
      maritalStatus: "KAWIN",
      dependents: 3,
      onTimeIn: ["07:48", "07:54", "07:57"],
      lateIn: ["08:12", "08:26", "08:38"],
    },
  ];

  const employees: { user: Awaited<ReturnType<typeof prisma.user.create>>; spec: EmployeeSeed }[] = [];
  for (const spec of specs) {
    const u = await prisma.user.create({
      data: {
        username: spec.username,
        password,
        name: spec.name,
        role: "KARYAWAN",
        companyId: c.id,
        baseSalary: spec.baseSalary,
        maritalStatus: spec.maritalStatus,
        dependents: spec.dependents,
        overtimeRate: spec.overtimeRate ?? 25000,
        shiftId: shift.id,
      },
    });
    employees.push({ user: u, spec });
  }

  const dayKeys = lastWorkingDays(26);
  const todayKey = toKey(new Date());

  // ============ ROSTER & ABSENSI ============
  const rosterShifts = [shift.id, shift.id, shift.id, shift.id, shiftFlex.id];
  const rosterData: {
    companyId: string;
    userId: string;
    dateKey: string;
    shiftId: string;
  }[] = [];
  for (const { user } of employees) {
    for (let i = 0; i < dayKeys.length; i++) {
      rosterData.push({
        companyId: c.id,
        userId: user.id,
        dateKey: dayKeys[i],
        shiftId: rosterShifts[i % rosterShifts.length],
      });
    }
  }
  await prisma.roster.createMany({ data: rosterData });

  const attendanceData: {
    userId: string;
    dateKey: string;
    checkIn: Date;
    checkOut: Date | null;
    breakIn: Date;
    breakOut: Date;
    status: string;
    recordType: "OFFICE";
    shiftId: string;
    shiftCheckIn: string;
    shiftCheckOut: string;
    lateMinutes: number | null;
    checkInLocationId: string;
    checkOutLocationId: string;
    checkInLat: number;
    checkInLng: number;
  }[] = [];
  for (const { user, spec } of employees) {
    for (let i = 0; i < dayKeys.length; i++) {
      const key = dayKeys[i];
      if ((i * 7 + user.id.length) % 6 === 0) continue;
      const isLate = (i * 3 + user.id.length) % 4 === 0;
      const inTime = isLate
        ? spec.lateIn[(i + 1) % spec.lateIn.length]
        : spec.onTimeIn[(i + 1) % spec.onTimeIn.length];
      const [ih, im] = inTime.split(":").map(Number);
      attendanceData.push({
        userId: user.id,
        dateKey: key,
        checkIn: new Date(`${key}T${inTime}:00`),
        checkOut: new Date(`${key}T17:00:00`),
        breakIn: new Date(`${key}T12:00:00`),
        breakOut: new Date(`${key}T13:00:00`),
        status: ih > 8 || (ih === 8 && im > 0) ? "TERLAMBAT" : "HADIR",
        recordType: "OFFICE",
        shiftId: shift.id,
        shiftCheckIn: "08:00",
        shiftCheckOut: "17:00",
        lateMinutes: ih > 8 || (ih === 8 && im > 0) ? (ih - 8) * 60 + im : null,
        checkInLocationId: location.id,
        checkOutLocationId: location.id,
        checkInLat: location.latitude,
        checkInLng: location.longitude,
      });
    }
  }

  // absensi hari ini (biar panel check-in tampil tidak kosong)
  for (const { user } of employees) {
    attendanceData.push({
      userId: user.id,
      dateKey: todayKey,
      checkIn: new Date(`${todayKey}T07:58:00`),
      checkOut: null,
      breakIn: new Date(`${todayKey}T12:00:00`),
      breakOut: new Date(`${todayKey}T13:00:00`),
      status: "HADIR",
      recordType: "OFFICE",
      shiftId: shift.id,
      shiftCheckIn: "08:00",
      shiftCheckOut: "17:00",
      lateMinutes: 0,
      checkInLocationId: location.id,
      checkOutLocationId: location.id,
      checkInLat: location.latitude,
      checkInLng: location.longitude,
    });
  }
  await prisma.attendance.createMany({ data: attendanceData });

  const byName = (name: string) =>
    employees.find((e) => e.user.name === name)?.user;
  const budi = byName("Budi Santoso");
  const sari = byName("Sari Dewi");
  const dewi = byName("Dewi Lestari");

  // ============ CUTI ============
  const leaveSamples = [
    { user: budi, startDate: dayKeys[2], endDate: dayKeys[4], type: "CUTI_TAHUNAN", reason: "Liburan keluarga ke Bali", status: "APPROVED", approvedById: hrd.id },
    { user: sari, startDate: dayKeys[6], endDate: dayKeys[6], type: "CUTI_SAKIT", reason: "Demam dan tidak enak badan", status: "APPROVED", approvedById: hrd.id },
    { user: dewi, startDate: dayKeys[7], endDate: dayKeys[7], type: "CUTI_SAKIT", reason: "Izin kontrol kehamilan", status: "APPROVED", approvedById: hrd.id },
    { user: budi, startDate: dayKeys[9], endDate: dayKeys[10], type: "IZIN", reason: "Urusan pribadi", status: "PENDING", approvedById: null },
    { user: sari, startDate: dayKeys[12], endDate: dayKeys[12], type: "IZIN", reason: "Menghadiri acara keluarga", status: "REJECTED", approvedById: hrd.id },
    { user: dewi, startDate: dayKeys[13], endDate: dayKeys[13], type: "IZIN", reason: "Mengantar anak ke dokter", status: "PENDING", approvedById: null },
  ];
  await prisma.leave.createMany({
    data: leaveSamples
      .filter((l) => l.user)
      .map((l) => ({
        userId: l.user!.id,
        startDate: l.startDate,
        endDate: l.endDate,
        type: l.type,
        reason: l.reason,
        status: l.status,
        approvedById: l.approvedById,
        createdAt: new Date(),
      })),
  });

  // ============ KLAIM ============
  const claimSamples = [
    { user: budi, type: "TRANSPORT", amount: 250000, date: dayKeys[3], description: "Tiket transportasi dinas ke Jakarta", status: "APPROVED", approvedById: hrd.id },
    { user: sari, type: "MEDIS", amount: 375000, date: dayKeys[5], description: "Obat-obatan dan biaya berobat", status: "APPROVED", approvedById: hrd.id },
    { user: dewi, type: "MEDIS", amount: 420000, date: dayKeys[7], description: "Pemeriksaan dan vitamin kehamilan", status: "APPROVED", approvedById: hrd.id },
    { user: budi, type: "MAKAN", amount: 120000, date: dayKeys[8], description: "Uang makan rapat proyek", status: "PENDING", approvedById: null },
    { user: sari, type: "OPERASIONAL", amount: 500000, date: dayKeys[10], description: "Pembelian perlengkapan kantor", status: "PENDING", approvedById: null },
    { user: dewi, type: "LAINNYA", amount: 95000, date: dayKeys[12], description: "Biaya parkir dan tol", status: "REJECTED", approvedById: hrd.id },
  ];
  await prisma.claim.createMany({
    data: claimSamples
      .filter((c) => c.user)
      .map((cItem) => ({
        userId: cItem.user!.id,
        type: cItem.type,
        amount: cItem.amount,
        date: cItem.date,
        description: cItem.description,
        status: cItem.status,
        approvedById: cItem.approvedById,
        createdAt: new Date(),
      })),
  });

  // ============ LEMBUR ============
  const overtimeSamples = [
    { user: budi, dateKey: dayKeys[1], startTime: "18:00", endTime: "20:00", durationMinutes: 120, payAmount: 2 * 25000, reason: "Menyelesaikan laporan proyek", status: "APPROVED" },
    { user: sari, dateKey: dayKeys[4], startTime: "17:30", endTime: "19:00", durationMinutes: 90, payAmount: Math.round(1.5 * 25000), reason: "Dukungan tim setelah jam kantor", status: "PENDING" },
    { user: dewi, dateKey: dayKeys[6], startTime: "18:00", endTime: "20:30", durationMinutes: 150, payAmount: Math.round(2.5 * 25000), reason: "Persiapan presentasi klien", status: "APPROVED" },
    { user: budi, dateKey: dayKeys[8], startTime: "17:30", endTime: "18:30", durationMinutes: 60, payAmount: 25000, reason: "Pembersihan data inventaris", status: "REJECTED" },
  ];
  await prisma.overtime.createMany({
    data: overtimeSamples
      .filter((o) => o.user)
      .map((o) => ({
        userId: o.user!.id,
        dateKey: o.dateKey,
        startTime: o.startTime,
        endTime: o.endTime,
        durationMinutes: o.durationMinutes,
        payAmount: o.payAmount,
        reason: o.reason,
        status: o.status,
        approvedById: o.status === "APPROVED" ? hrd.id : null,
      })),
  });

  // ============ KOREKSI ABSENSI ============
  if (budi) {
    const attendanceToCorrect = await prisma.attendance.findFirst({
      where: { userId: budi.id, status: "TERLAMBAT", dateKey: { not: todayKey } },
      orderBy: { dateKey: "asc" },
    });
    if (attendanceToCorrect) {
      await prisma.attendanceCorrection.create({
        data: {
          userId: budi.id,
          attendanceId: attendanceToCorrect.id,
          requestedCheckIn: new Date(`${attendanceToCorrect.dateKey}T07:59:00`),
          requestedCheckOut: attendanceToCorrect.checkOut,
          reason: "Keterlambatan karena kendala transportasi (macet).",
          status: "PENDING",
        },
      });
    }
  }

  // ============ MEETING ============
  const meetingSamples = [
    { title: `Rapat Evaluasi ${company.name}`, date: toKey(new Date(Date.now() + 2 * 86400000)), time: "09:00", location: "Ruang Rapat A", agenda: "Evaluasi kinerja dan target bulan depan", createdById: hrd.id },
    { title: `Sosialisasi Kebijakan ${company.name}`, date: toKey(new Date(Date.now() + 5 * 86400000)), time: "10:30", location: "Ruang Rapat B", agenda: "Penyampaian kebijakan cuti dan klaim terbaru", createdById: hrd.id },
    { title: "Meeting Koordinasi Tim", date: toKey(new Date(Date.now() + 9 * 86400000)), time: "14:00", location: "Zoom", agenda: "Koordinasi proyek lintas divisi", createdById: hrd.id },
  ];
  for (const m of meetingSamples) {
    const meeting = await prisma.meeting.create({
      data: {
        title: m.title,
        date: m.date,
        time: m.time,
        location: m.location,
        agenda: m.agenda,
        companyId: c.id,
        createdById: m.createdById,
      },
    });
    await prisma.meetingParticipant.createMany({
      data: employees.map(({ user }) => ({
        meetingId: meeting.id,
        userId: user.id,
      })),
    });
    await prisma.notification.createMany({
      data: employees.map(({ user }) => ({
        userId: user.id,
        title: `Undangan Rapat: ${m.title}`,
        message: `${m.location} — ${m.date} pukul ${m.time}`,
        meetingId: meeting.id,
      })),
    });
  }

  // ============ PAYROLL (SISTEM TER) ============
  const periods = [currentPeriod(), "2026-07"];
  const allPayrollUsers = [...employees.map((e) => e.user), hrd];
  const payrollData: {
    userId: string;
    period: string;
    baseSalary: number;
    allowance: number;
    bonus: number;
    deduction: number;
    pph21: number;
    netSalary: number;
    status: string;
  }[] = [];
  for (const period of periods) {
    const periodAtt = await prisma.attendance.findMany({
      where: {
        userId: { in: allPayrollUsers.map((u) => u.id) },
        dateKey: { startsWith: period },
      },
      select: { userId: true, status: true },
    });
    const workingDays = workingDaysInMonth(period);
    for (const emp of allPayrollUsers) {
      const own = periodAtt.filter((a) => a.userId === emp.id);
      const hadir = own.filter((a) => a.status === "HADIR").length;
      const terlambat = own.filter((a) => a.status === "TERLAMBAT").length;
      const workDays = hadir + terlambat;
      const alphaDays = Math.min(3, Math.max(0, workingDays - workDays));
      const dailyRate = workingDays > 0 ? Math.round(emp.baseSalary / workingDays) : 0;
      const deduction = alphaDays * dailyRate;
      const allowance = 500000;
      const bonus = period === periods[0] ? 250000 : 0;
      const gross = emp.baseSalary + allowance + bonus;
      const pph21 = calculatePph21(emp.maritalStatus, emp.dependents, gross);
      payrollData.push({
        userId: emp.id,
        period,
        baseSalary: emp.baseSalary,
        allowance,
        bonus,
        deduction,
        pph21,
        netSalary: gross - pph21 - deduction,
        status: period === periods[0] ? "DRAFT" : "PAID",
      });
    }
  }
  await prisma.payroll.createMany({ data: payrollData });

  console.log(
    `  [${company.code}] ${company.name} -> admin_${company.code} / admin123, hrd_${company.code} / hrd123, karyawan_${company.code} / karyawan123`
  );
}

async function main() {
  const superAdmin = await prisma.user.upsert({
    where: { username: "superadmin" },
    update: {},
    create: {
      username: "superadmin",
      password: await hash("superadmin123", 10),
      name: "Super Administrator",
      role: "SUPER_ADMIN",
    },
  });
  console.log(`  [SUPER ADMIN] superadmin / superadmin123 (${superAdmin.id})`);

  await seedCompany({
    name: "PT Maju Sejahtera",
    code: "msj",
    address: "Jl. Sudirman No. 1, Jakarta",
  });
  await seedCompany({
    name: "PT Berkah Abadi",
    code: "bka",
    address: "Jl. Pemuda No. 45, Surabaya",
  });
  await seedCompany({
    name: "PT Teknologi Nusantara",
    code: "tkn",
    address: "Jl. Gatot Subroto No. 88, Bandung",
  });
  await seedCompany({
    name: "PT Cipta Kreasi Nusantara",
    code: "ckn",
    address: "Jl. MH Thamrin No. 10, Jakarta",
  });

  console.log("\nData demo siap untuk multi-PT (termasuk payroll sistem TER).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
