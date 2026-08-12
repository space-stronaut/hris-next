import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import MeetingManager from "@/components/MeetingManager";

export default async function HrdMeetingsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const [meetings, users] = await Promise.all([
    prisma.meeting.findMany({
      where: { companyId: session.companyId },
      orderBy: [{ date: "asc" }, { time: "asc" }],
      include: {
        participants: { include: { user: { select: { id: true, name: true } } } },
      },
    }),
    prisma.user.findMany({
      where: { companyId: session.companyId, active: true },
      orderBy: { name: "asc" },
      select: { id: true, name: true, role: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Manajemen Meeting</h1>
        <p className="text-slate-500 mt-1">Jadwalkan dan kelola meeting</p>
      </div>
      <MeetingManager meetings={meetings} users={users} />
    </div>
  );
}