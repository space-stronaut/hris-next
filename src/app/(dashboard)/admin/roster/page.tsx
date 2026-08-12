import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import RosterManager from "@/components/RosterManager";

export default async function AdminRosterPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") notFound();
  if (!session.companyId) notFound();

  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const [users, shifts, rosters] = await Promise.all([
    prisma.user.findMany({
      where: { companyId: session.companyId, active: true },
      select: { id: true, name: true, shiftId: true, shift: { select: { name: true } } },
      orderBy: { name: "asc" },
    }),
    prisma.shift.findMany({
      where: { companyId: session.companyId, active: true },
      select: { id: true, name: true, checkIn: true, checkOut: true },
      orderBy: { name: "asc" },
    }),
    prisma.roster.findMany({
      where: { companyId: session.companyId, dateKey: todayKey },
      include: { user: { select: { id: true, name: true } }, shift: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Roster / Jadwal Shift</h1>
        <p className="text-slate-500 mt-1">
          Atur shift per tanggal untuk mengubah jam kerja karyawan tertentu
        </p>
      </div>
      <RosterManager users={users} shifts={shifts} rosters={rosters} todayKey={todayKey} />
    </div>
  );
}