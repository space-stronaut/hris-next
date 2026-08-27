"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatRupiah, SALARY_TYPES, salaryTypeLabel } from "@/lib/format";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";
import EditUserModal from "@/components/EditUserModal";

type UserRow = {
  id: string;
  username: string;
  name: string;
  role: string;
  active: boolean;
  baseSalary: number;
  overtimeRate: number;
  maritalStatus: "LAJANG" | "KAWIN";
  dependents: number;
  shiftId: string | null;
  shift?: { name: string } | null;
  supervisorId: string | null;
  supervisor?: { name: string } | null;
  departmentId: string | null;
  department?: { name: string } | null;
  position: string | null;
  leaveQuota: number;
  leaveUsed: number;
  leaveAccrual: number;
  leaveAccrualPeriod: string;
  salaryType: string;
  createdAt: Date;
  _count: { attendances: number };
};

type ShiftRow = { id: string; name: string };
type SupervisorRow = { id: string; name: string };
type DepartmentRow = { id: string; name: string };

export default function UserManager({
  users,
  shifts,
  supervisors,
  departments,
}: {
  users: UserRow[];
  shifts: ShiftRow[];
  supervisors: SupervisorRow[];
  departments: DepartmentRow[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("KARYAWAN");
  const [baseSalary, setBaseSalary] = useState("");
  const [overtimeRate, setOvertimeRate] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("LAJANG");
  const [dependents, setDependents] = useState("0");
  const [shiftId, setShiftId] = useState(shifts[0]?.id || "");
  const [supervisorId, setSupervisorId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [position, setPosition] = useState("");
  const [leaveQuota, setLeaveQuota] = useState("12");
  const [leaveAccrual, setLeaveAccrual] = useState("1");
  const [leaveAccrualPeriod, setLeaveAccrualPeriod] = useState("MONTHLY");
  const [salaryType, setSalaryType] = useState("BULAN");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const pag = usePagination(users.length);
  const pageUsers = users.slice(pag.start, pag.end);

  async function createUser(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          username,
          password,
          role,
          baseSalary: Number(baseSalary) || 0,
          overtimeRate: Number(overtimeRate) || 0,
          maritalStatus,
          dependents: Number(dependents) || 0,
          shiftId: shiftId || null,
          supervisorId: role === "KARYAWAN" ? supervisorId || null : null,
          departmentId: departmentId || null,
          position: position || null,
          leaveQuota: Number(leaveQuota) || 0,
          leaveAccrual: Number(leaveAccrual) || 0,
          leaveAccrualPeriod,
          salaryType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menambah karyawan.");
        setLoading(false);
        return;
      }
      setName("");
      setUsername("");
      setPassword("");
      setRole("KARYAWAN");
      setBaseSalary("");
      setOvertimeRate("");
      setMaritalStatus("LAJANG");
      setDependents("0");
      setShiftId(shifts[0]?.id || "");
      setSupervisorId("");
      setDepartmentId("");
      setPosition("");
      setLeaveQuota("12");
      setLeaveAccrual("1");
      setLeaveAccrualPeriod("MONTHLY");
      setSalaryType("BULAN");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  async function toggleActive(id: string, active: boolean) {
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    const data = await res.json();
    if (!res.ok) {
      alert(data.message || "Gagal mengubah status.");
      return;
    }
    router.refresh();
  }

  async function deleteUser(id: string) {
    if (!confirm("Yakin ingin menghapus karyawan ini? Semua data terkaitnya akan ikut terhapus.")) return;
    const res = await fetch(`/api/users/${id}`, { method: "DELETE" });
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
          Tambah Karyawan
        </h2>
        <form onSubmit={createUser} className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Nama karyawan"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="username"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Password"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="KARYAWAN">Karyawan</option>
              <option value="SPV">SPV (Supervisor)</option>
              <option value="HRD">HRD</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          {role === "KARYAWAN" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Supervisor / SPV
              </label>
              <select
                value={supervisorId}
                onChange={(e) => setSupervisorId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Tidak ada</option>
                {supervisors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gaji Pokok (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Gaji per
            </label>
            <select
              value={salaryType}
              onChange={(e) => setSalaryType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {SALARY_TYPES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tarif Lembur/Jam (Rp)
            </label>
            <input
              type="number"
              min="0"
              value={overtimeRate}
              onChange={(e) => setOvertimeRate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Shift Default
            </label>
            <select
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tidak ada</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Departemen
            </label>
            <select
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Tidak ada</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Jabatan
            </label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="mis. Staff"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Jatah Cuti Awal
            </label>
            <input
              type="number"
              min="0"
              value={leaveQuota}
              onChange={(e) => setLeaveQuota(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Penambahan Cuti
            </label>
            <input
              type="number"
              min="0"
              value={leaveAccrual}
              onChange={(e) => setLeaveAccrual(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Periode Penambahan
            </label>
            <select
              value={leaveAccrualPeriod}
              onChange={(e) => setLeaveAccrualPeriod(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="MONTHLY">Per Bulan</option>
              <option value="YEARLY">Per Tahun</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Status Kawin (PTKP)
            </label>
            <select
              value={maritalStatus}
              onChange={(e) => setMaritalStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="LAJANG">Lajang (TK)</option>
              <option value="KAWIN">Kawin (K)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tanggungan (0-3)
            </label>
            <input
              type="number"
              min="0"
              max="3"
              value={dependents}
              onChange={(e) => setDependents(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="0"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600 sm:col-span-2 lg:col-span-6">
              {error}
            </div>
          )}

          <div className="sm:col-span-2 lg:col-span-6">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Menyimpan..." : "Tambah Karyawan"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Daftar Karyawan
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="px-6 py-3">Nama</th>
                <th className="px-6 py-3">Username</th>
                <th className="px-6 py-3">Role</th>
                <th className="px-6 py-3">Shift</th>
                <th className="px-6 py-3">Supervisor</th>
                <th className="px-6 py-3">Dept / Jabatan</th>
                <th className="px-6 py-3">Cuti</th>
                <th className="px-6 py-3">Gaji Pokok</th>
                <th className="px-6 py-3">Lembur/Jam</th>
                <th className="px-6 py-3">PTKP</th>
                <th className="px-6 py-3">Absensi</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {pageUsers.map((u) => (
                <tr key={u.id} className="border-b border-slate-100">
                  <td className="px-6 py-3 font-medium text-slate-900">
                    {u.name}
                  </td>
                  <td className="px-6 py-3 text-slate-600">{u.username}</td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.role === "ADMIN"
                          ? "bg-purple-100 text-purple-700"
                          : u.role === "HRD"
                          ? "bg-teal-100 text-teal-700"
                          : u.role === "SPV"
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {u.shift?.name || "-"}
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {u.supervisor?.name || "-"}
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {u.department?.name || "-"}
                    {u.position ? ` / ${u.position}` : ""}
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {u.leaveQuota} + {u.leaveAccrual}/(
                    {u.leaveAccrualPeriod === "YEARLY" ? "th" : "bln"})
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {u.baseSalary > 0
                      ? formatRupiah(u.baseSalary) +
                        ` (${salaryTypeLabel(u.salaryType)})`
                      : "-"}
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {u.overtimeRate > 0 ? formatRupiah(u.overtimeRate) + "/jam" : "-"}
                  </td>
                  <td className="px-6 py-3 text-slate-700">
                    {u.maritalStatus === "KAWIN" ? "K" : "TK"}/{u.dependents}
                  </td>
                  <td className="px-6 py-3 text-slate-600">
                    {u._count.attendances} hari
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        u.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditing(u)}
                        className="rounded-md border border-blue-300 px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(u.id, u.active)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        {u.active ? "Nonaktifkan" : "Aktifkan"}
                      </button>
                      <button
                        onClick={() => deleteUser(u.id)}
                        className="rounded-md border border-red-300 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                      >
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td
                    colSpan={13}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Belum ada karyawan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          total={users.length}
          page={pag.page}
          pageSize={pag.pageSize}
          onPageChange={pag.goToPage}
        />
      </div>

      {editing && (
        <EditUserModal
          user={editing}
          shifts={shifts}
          supervisors={supervisors}
          departments={departments}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
