import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDateKey } from "@/lib/date";

export default async function MeetingsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const meetings = await prisma.meeting.findMany({
    where: { companyId: session.companyId },
    orderBy: [{ date: "asc" }, { time: "asc" }],
    include: {
      participants: { include: { user: { select: { id: true, name: true } } } },
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Meeting</h1>
        <p className="text-slate-500 mt-1">Jadwal meeting yang dijadwalkan HRD</p>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Jadwal Meeting ({meetings.length})
          </h2>
        </div>
        {meetings.length === 0 ? (
          <div className="px-6 py-10 text-center text-slate-500">
            Belum ada meeting yang dijadwalkan.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3">Tanggal</th>
                  <th className="px-6 py-3">Waktu</th>
                  <th className="px-6 py-3">Judul</th>
                  <th className="px-6 py-3">Lokasi</th>
                  <th className="px-6 py-3">Agenda</th>
                  <th className="px-6 py-3">Peserta</th>
                </tr>
              </thead>
              <tbody>
                {meetings.map((m) => (
                  <tr key={m.id} className="border-b border-slate-100">
                    <td className="px-6 py-3 whitespace-nowrap">
                      {formatDateKey(m.date)}
                    </td>
                    <td className="px-6 py-3">{m.time}</td>
                    <td className="px-6 py-3 font-medium text-slate-900">
                      {m.title}
                    </td>
                    <td className="px-6 py-3 text-slate-600">{m.location}</td>
                    <td className="px-6 py-3 text-slate-600">{m.agenda || "-"}</td>
                    <td className="px-6 py-3 text-slate-600">
                      {m.participants.length === 0
                        ? "-"
                        : m.participants
                            .map((p) => p.user.name)
                            .join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
