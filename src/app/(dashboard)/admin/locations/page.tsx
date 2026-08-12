import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import LocationManager from "@/components/LocationManager";

export default async function AdminLocationsPage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");
  if (session.role !== "ADMIN") notFound();
  if (!session.companyId) notFound();

  const locations = await prisma.location.findMany({
    where: { companyId: session.companyId },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Geofence / Lokasi Absensi</h1>
        <p className="text-slate-500 mt-1">
          Tentukan area kantor; absensi OFFICE wajib berada dalam radius lokasi ini
        </p>
      </div>
      <LocationManager locations={locations} />
    </div>
  );
}