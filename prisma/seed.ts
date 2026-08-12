import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
import { hash } from "bcryptjs";
import { workingDaysInMonth } from "../src/lib/date";

const adapter = new PrismaMariaDb(process.env.DATABASE_URL as string);
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
  user: Awaited<ReturnType<typeof prisma.user.create>>;
  onTimeIn: string[];
  lateIn: string[];
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

  await prisma.meeting.deleteMany({ where: { companyId: c.id } });
  const companyUsers = await prisma.user.findMany({
    where: { companyId: c.id },
    select: { id: true },
  });
  const ids = companyUsers.map((u) => u.id);
  await prisma.claim.deleteMany({ where: { userId: { in: ids } } });
  await prisma.payroll.deleteMany({ where: { userId: { in: ids } } });
  await prisma.leave.deleteMany({ where: { userId: { in: ids } } });
  await prisma.attendance.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { companyId: c.id } });

  await prisma.user.create({
    data: {
      username: `admin_${company.code}`,
      password: adminPassword,
      name: `Admin ${company.name}`,
      role: "ADMIN",
      companyId: c.id,
    },
  });  const hrd = await prisma.user.create({
    data: {
      username: `hrd_${company.code}`,
      password: hrdPassword,
      name: `HRD ${company.name}`,
      role: "HRD",
      companyId: c.id,
      baseSalary: 6000000,
    },
  });

  const budi = await prisma.user.create({
    data: {
      username: `budi_${company.code}`,
      password,
      name: "Budi Santoso",
      role: "KARYAWAN",
      companyId: c.id,
      baseSalary: 4500000,
    },
  });

  const sari = await prisma.user.create({
    data: {
      username: `sari_${company.code}`,
      password,
      name: "Sari Dewi",
      role: "KARYAWAN",
      companyId: c.id,
      baseSalary: 5000000,
    },
  });

  const dayKeys = lastWorkingDays(26);
  const employees: EmployeeSeed[] = [
    {
      user: budi,
      onTimeIn: ["07:45", "07:52", "07:58"],
      lateIn: ["08:10", "08:24", "08:35"],
    },
    {
      user: sari,
      onTimeIn: ["07:40", "07:50", "07:55"],
      lateIn: ["08:05", "08:20", "08:40"],
    },
  ];

  // ============ ABSENSI ============
  for (const emp of employees) {
    for (let i = 0; i < dayKeys.length; i++) {
      const key = dayKeys[i];
      if ((i * 7 + emp.user.id.length) % 6 === 0) continue;
      const isLate = (i * 3 + emp.user.id.length) % 4 === 0;
      const inTime = isLate
        ? emp.lateIn[(i + 1) % emp.lateIn.length]
        : emp.onTimeIn[(i + 1) % emp.onTimeIn.length];
      const [ih, im] = inTime.split(":").map(Number);
      const checkIn = new Date(`${key}T${inTime}:00`);
      const checkOut = new Date(`${key}T17:00:00`);

      await prisma.attendance.create({
        data: {
          userId: emp.user.id,
          dateKey: key,
          checkIn,
          checkOut,
          status: ih > 8 || (ih === 8 && im > 0) ? "TERLAMBAT" : "HADIR",
        },
      });
    }
  }

  // absensi hari ini (biar panel check-in tampil tidak kosong)
  const todayKey = toKey(new Date());
  for (const emp of employees) {
    const exists = await prisma.attendance.findUnique({
      where: { userId_dateKey: { userId: emp.user.id, dateKey: todayKey } },
    });
    if (!exists) {
      await prisma.attendance.create({
        data: {
          userId: emp.user.id,
          dateKey: todayKey,
          checkIn: new Date(`${todayKey}T07:58:00`),
          checkOut: null,
          status: "HADIR",
        },
      });
    }
  }

  // ============ CUTI ============
  const leaveSamples = [
    { user: budi, startDate: dayKeys[2], endDate: dayKeys[4], type: "CUTI_TAHUNAN", reason: "Liburan keluarga ke Bali", status: "APPROVED", approvedById: hrd.id },
    { user: sari, startDate: dayKeys[6], endDate: dayKeys[6], type: "CUTI_SAKIT", reason: "Demam dan tidak enak badan", status: "APPROVED", approvedById: hrd.id },
    { user: budi, startDate: dayKeys[9], endDate: dayKeys[10], type: "IZIN", reason: "Urusan pribadi", status: "PENDING", approvedById: null },
    { user: sari, startDate: dayKeys[12], endDate: dayKeys[12], type: "IZIN", reason: "Menghadiri acara keluarga", status: "REJECTED", approvedById: hrd.id },
    { user: budi, startDate: dayKeys[14], endDate: dayKeys[15], type: "CUTI_LAINNYA", reason: "Persiapan pernikahan", status: "PENDING", approvedById: null },
  ];
  for (const l of leaveSamples) {
    await prisma.leave.create({
      data: {
        userId: l.user.id,
        startDate: l.startDate,
        endDate: l.endDate,
        type: l.type,
        reason: l.reason,
        status: l.status,
        approvedById: l.approvedById,
        createdAt: new Date(),
      },
    });
  }

  // ============ KLAIM ============
  const claimSamples = [
    { user: budi, type: "TRANSPORT", amount: 250000, date: dayKeys[3], description: "Tiket transportasi dinas ke Jakarta", status: "APPROVED", approvedById: hrd.id },
    { user: sari, type: "MEDIS", amount: 375000, date: dayKeys[5], description: "Obat-obatan dan biaya berobat", status: "APPROVED", approvedById: hrd.id },
    { user: budi, type: "MAKAN", amount: 120000, date: dayKeys[8], description: "Uang makan rapat proyek", status: "PENDING", approvedById: null },
    { user: sari, type: "OPERASIONAL", amount: 500000, date: dayKeys[10], description: "Pembelian perlengkapan kantor", status: "PENDING", approvedById: null },
    { user: budi, type: "LAINNYA", amount: 80000, date: dayKeys[13], description: "Biaya parkir dan tol", status: "REJECTED", approvedById: hrd.id },
  ];
  for (const cItem of claimSamples) {
    await prisma.claim.create({
      data: {
        userId: cItem.user.id,
        type: cItem.type,
        amount: cItem.amount,
        date: cItem.date,
        description: cItem.description,
        status: cItem.status,
        approvedById: cItem.approvedById,
        createdAt: new Date(),
      },
    });
  }

  // ============ MEETING ============
  const meetingSamples = [
    { title: `Rapat Evaluasi ${company.name}`, date: toKey(new Date(Date.now() + 2 * 86400000)), time: "09:00", location: "Ruang Rapat A", agenda: "Evaluasi kinerja dan target bulan depan", createdById: hrd.id },
    { title: `Sosialisasi Kebijakan ${company.name}`, date: toKey(new Date(Date.now() + 5 * 86400000)), time: "10:30", location: "Ruang Rapat B", agenda: "Penyampaian kebijakan cuti dan klaim terbaru", createdById: hrd.id },
    { title: "Meeting Koordinasi Tim", date: toKey(new Date(Date.now() + 9 * 86400000)), time: "14:00", location: "Zoom", agenda: "Koordinasi proyek lintas divisi", createdById: hrd.id },
  ];
  for (const m of meetingSamples) {
    await prisma.meeting.create({ data: { ...m, companyId: c.id } });
  }

  // ============ PAYROLL ============
  const periods = [currentPeriod(), "2026-07"];
  for (const period of periods) {
    for (const emp of [...employees, { user: hrd, onTimeIn: [], lateIn: [] }]) {
      const att = await prisma.attendance.findMany({
        where: { userId: emp.user.id, dateKey: { startsWith: period } },
      });
      const hadir = att.filter((a) => a.status === "HADIR").length;
      const terlambat = att.filter((a) => a.status === "TERLAMBAT").length;
      const workingDays = workingDaysInMonth(period);
      const workDays = hadir + terlambat;
      const alphaDays = Math.min(3, Math.max(0, workingDays - workDays));
      const dailyRate = workingDays > 0 ? Math.round(emp.user.baseSalary / workingDays) : 0;
      const deduction = alphaDays * dailyRate;
      const allowance = 500000;
      const bonus = period === periods[0] ? 250000 : 0;
      const netSalary = emp.user.baseSalary + allowance + bonus - deduction;

      await prisma.payroll.upsert({
        where: { userId_period: { userId: emp.user.id, period } },
        update: {},
        create: {
          userId: emp.user.id,
          period,
          baseSalary: emp.user.baseSalary,
          allowance,
          bonus,
          deduction,
          netSalary,
          status: period === periods[0] ? "DRAFT" : "PAID",
        },
      });
    }
  }

  console.log(
    `  [${company.code}] ${company.name} -> admin_${company.code} / admin123, hrd_${company.code} / hrd123, budi_${company.code} / karyawan123, sari_${company.code} / karyawan123`
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

  console.log("\nData demo siap untuk multi-PT.");
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
