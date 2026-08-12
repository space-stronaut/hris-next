import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatRupiah } from "@/lib/format";
import { formatDateTime } from "@/lib/date";
import ClaimForm from "@/components/ClaimForm";

const typeLabels: Record<string, string> = {
  TRANSPORT: "Transportasi",
  MAKAN: "Makan",
  MEDIS: "Kesehatan / Medis",
  PENDIDIKAN: "Pendidikan",
  OPERASIONAL: "Operasional",
  LAINNYA: "Lainnya",
};

function statusBadge(status: string) {
  const map: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
        map[status] || "bg-slate-100 text-slate-700"
      }`}
    >
      {status}
    </span>
  );
}

export default async function MyClaimsPage() {
  const session = await getCurrentUser();
  if (!session) return null;

  const claims = await prisma.claim.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  const approved = claims.filter((c) => c.status === "APPROVED");
  const pending = claims.filter((c) => c.status === "PENDING");
  const totalApproved = approved.reduce((sum, c) => sum + c.amount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Klaim Saya</h1>
        <p className="text-slate-500 mt-1">
          Disetujui: {approved.length} · Menunggu: {pending.length} · Total
          disetujui: {formatRupiah(totalApproved)}
        </p>
      </div>

      <ClaimForm />

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Riwayat Klaim
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Tanggal</th>
                <th className="px-6 py-3">Jenis</th>
                <th className="px-6 py-3">Deskripsi</th>
                <th className="px-6 py-3">Nominal</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Diajukan</th>
              </tr>
            </thead>
            <tbody>
              {claims.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    Belum ada pengajuan klaim.
                  </td>
                </tr>
              )}
              {claims.map((c) => (
                <tr key={c.id} className="border-b border-slate-100">
                  <td className="px-6 py-3">{c.date}</td>
                  <td className="px-6 py-3">{typeLabels[c.type] || c.type}</td>
                  <td className="px-6 py-3 text-slate-600">{c.description}</td>
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {formatRupiah(c.amount)}
                  </td>
                  <td className="px-6 py-3">{statusBadge(c.status)}</td>
                  <td className="px-6 py-3 text-slate-500">
                    {formatDateTime(c.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
