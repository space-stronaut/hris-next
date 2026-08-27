"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

type DepartmentRow = {
  id: string;
  name: string;
  _count: { users: number };
};

export default function DepartmentManager({
  departments,
}: {
  departments: DepartmentRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const pag = usePagination(departments.length);
  const pageDepartments = departments.slice(pag.start, pag.end);

  async function createDepartment(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/departments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menambah departemen.");
        setLoading(false);
        return;
      }
      setName("");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  async function rename(d: DepartmentRow) {
    const newName = window.prompt("Nama departemen:", d.name);
    if (newName === null || !newName.trim()) return;
    const res = await fetch(`/api/departments/${d.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Gagal mengubah departemen.");
      return;
    }
    router.refresh();
  }

  async function remove(d: DepartmentRow) {
    if (
      !confirm(
        `Hapus departemen "${d.name}"? Karyawan di dalamnya akan kehilangan departemen.`
      )
    )
      return;
    const res = await fetch(`/api/departments/${d.id}`, { method: "DELETE" });
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
        <h2 className="text-lg font-semibold text-slate-900">
          Tambah Departemen
        </h2>
        <form onSubmit={createDepartment} className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Nama departemen"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 sm:max-w-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Tambah"}
          </button>
        </form>
        {error && (
          <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Daftar Departemen ({departments.length})
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Karyawan</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageDepartments.map((d) => (
                <tr key={d.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {d.name}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {d._count.users} karyawan
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => rename(d)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => remove(d)}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {departments.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                    Belum ada departemen.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          total={departments.length}
          page={pag.page}
          pageSize={pag.pageSize}
          onPageChange={pag.goToPage}
        />
      </div>
    </div>
  );
}