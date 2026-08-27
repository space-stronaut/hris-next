"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

type LocationRow = {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  radiusMeters: number;
  active: boolean;
};

export default function LocationManager({
  locations,
}: {
  locations: LocationRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [radiusMeters, setRadiusMeters] = useState("100");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pag = usePagination(locations.length);
  const pageLocations = locations.slice(pag.start, pag.end);

  function useMyLocation(e: React.MouseEvent) {
    e.preventDefault();
    if (!navigator.geolocation) {
      setError("Perangkat tidak mendukung GPS.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setError("");
      },
      () => setError("Gagal mendapatkan lokasi Anda. Isi koordinat manual."),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  }

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          latitude: Number(latitude),
          longitude: Number(longitude),
          radiusMeters: Number(radiusMeters) || 100,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menambah lokasi.");
        setLoading(false);
        return;
      }
      setName("");
      setLatitude("");
      setLongitude("");
      setRadiusMeters("100");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  async function toggle(id: string, active: boolean) {
    const res = await fetch(`/api/locations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Gagal.");
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Hapus lokasi ini?")) return;
    const res = await fetch(`/api/locations/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Gagal menghapus.");
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Tambah Lokasi</h2>
        <form onSubmit={create} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="cth. Kantor Pusat"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Latitude
            </label>
            <input
              type="number"
              step="any"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Longitude
            </label>
            <input
              type="number"
              step="any"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Radius (m)
            </label>
            <input
              type="number"
              min="20"
              max="5000"
              value={radiusMeters}
              onChange={(e) => setRadiusMeters(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 sm:col-span-2 lg:col-span-4">
              {error}
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-4 flex gap-3">
            <button
              type="button"
              onClick={useMyLocation}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
            >
              Gunakan Lokasi Saya
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Tambah Lokasi"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">Daftar Lokasi</h2>
          {locations.length === 0 && (
            <p className="mt-1 text-sm text-slate-500">
              Belum ada lokasi. Karyawan OFFICE dapat absen di mana saja selama belum
              ada lokasi.
            </p>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Koordinat</th>
                <th className="px-6 py-3">Radius</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageLocations.map((l) => (
                <tr key={l.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">{l.name}</td>
                  <td className="px-6 py-3 text-slate-600">
                    {l.latitude.toFixed(6)}, {l.longitude.toFixed(6)}
                  </td>
                  <td className="px-6 py-3 text-slate-700">{l.radiusMeters} m</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        l.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}
                    >
                      {l.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => toggle(l.id, l.active)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        {l.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => remove(l.id)}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          total={locations.length}
          page={pag.page}
          pageSize={pag.pageSize}
          onPageChange={pag.goToPage}
        />
      </div>
    </div>
  );
}