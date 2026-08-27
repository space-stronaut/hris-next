"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { SALARY_TYPES } from "@/lib/format";
import Modal from "@/components/Modal";

type EditUser = {
  id: string;
  name: string;
  role: string;
  active: boolean;
  baseSalary: number;
  overtimeRate: number;
  maritalStatus: "LAJANG" | "KAWIN";
  dependents: number;
  shiftId: string | null;
  supervisorId: string | null;
  departmentId: string | null;
  position: string | null;
  leaveQuota: number;
  leaveAccrual: number;
  leaveAccrualPeriod: string;
  salaryType: string;
};

type ShiftRow = { id: string; name: string };
type SupervisorRow = { id: string; name: string };
type DepartmentRow = { id: string; name: string };

const inputClass =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

export default function EditUserModal({
  user,
  shifts,
  supervisors,
  departments,
  onClose,
}: {
  user: EditUser;
  shifts: ShiftRow[];
  supervisors: SupervisorRow[];
  departments: DepartmentRow[];
  onClose: () => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);
  const [baseSalary, setBaseSalary] = useState(String(user.baseSalary));
  const [overtimeRate, setOvertimeRate] = useState(String(user.overtimeRate));
  const [maritalStatus, setMaritalStatus] = useState(user.maritalStatus);
  const [dependents, setDependents] = useState(String(user.dependents));
  const [shiftId, setShiftId] = useState(user.shiftId || "");
  const [supervisorId, setSupervisorId] = useState(user.supervisorId || "");
  const [departmentId, setDepartmentId] = useState(user.departmentId || "");
  const [position, setPosition] = useState(user.position || "");
  const [leaveQuota, setLeaveQuota] = useState(String(user.leaveQuota));
  const [leaveAccrual, setLeaveAccrual] = useState(String(user.leaveAccrual));
  const [leaveAccrualPeriod, setLeaveAccrualPeriod] = useState(
    user.leaveAccrualPeriod || "MONTHLY"
  );
  const [salaryType, setSalaryType] = useState(user.salaryType || "BULAN");
  const [active, setActive] = useState(user.active);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name,
        role,
        baseSalary: Number(baseSalary) || 0,
        overtimeRate: Number(overtimeRate) || 0,
        maritalStatus,
        dependents: Number(dependents) || 0,
        shiftId: shiftId || null,
        departmentId: departmentId || null,
        position: position || null,
        leaveQuota: Number(leaveQuota) || 0,
        leaveAccrual: Number(leaveAccrual) || 0,
        leaveAccrualPeriod,
        salaryType,
        active,
      };
      if (role === "KARYAWAN") {
        payload.supervisorId = supervisorId || null;
      }
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan perubahan.");
        setLoading(false);
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={`Edit · ${user.name}`}>
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nama Lengkap
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Role
          </label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className={inputClass}
          >
            <option value="KARYAWAN">Karyawan</option>
            <option value="SPV">SPV (Supervisor)</option>
            <option value="HRD">HRD</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gaji Pokok (Rp)
          </label>
          <input
            type="number"
            min="0"
            value={baseSalary}
            onChange={(e) => setBaseSalary(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Gaji per
          </label>
          <select
            value={salaryType}
            onChange={(e) => setSalaryType(e.target.value)}
            className={inputClass}
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
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status Kawin (PTKP)
          </label>
          <select
            value={maritalStatus}
            onChange={(e) =>
              setMaritalStatus(e.target.value === "KAWIN" ? "KAWIN" : "LAJANG")
            }
            className={inputClass}
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
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Shift Default
          </label>
          <select
            value={shiftId}
            onChange={(e) => setShiftId(e.target.value)}
            className={inputClass}
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
            className={inputClass}
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
            className={inputClass}
            placeholder="mis. Staff"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Status
          </label>
          <select
            value={active ? "1" : "0"}
            onChange={(e) => setActive(e.target.value === "1")}
            className={inputClass}
          >
            <option value="1">Aktif</option>
            <option value="0">Nonaktif</option>
          </select>
        </div>

        <div className="sm:col-span-2">
          <h3 className="text-sm font-semibold text-slate-800">Pengaturan Cuti</h3>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Jatah Awal (hari)
          </label>
          <input
            type="number"
            min="0"
            value={leaveQuota}
            onChange={(e) => setLeaveQuota(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Penambahan (hari)
          </label>
          <input
            type="number"
            min="0"
            value={leaveAccrual}
            onChange={(e) => setLeaveAccrual(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Periode Penambahan
          </label>
          <select
            value={leaveAccrualPeriod}
            onChange={(e) => setLeaveAccrualPeriod(e.target.value)}
            className={inputClass}
          >
            <option value="MONTHLY">Per Bulan</option>
            <option value="YEARLY">Per Tahun</option>
          </select>
        </div>

        {role === "KARYAWAN" && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Supervisor / SPV
            </label>
            <select
              value={supervisorId}
              onChange={(e) => setSupervisorId(e.target.value)}
              className={inputClass}
            >
              <option value="">Tidak ada</option>
              {supervisors.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            {supervisors.length === 0 && (
              <p className="mt-1 text-xs text-slate-500">
                Belum ada user dengan role SPV. Buat SPV dulu agar bisa ditetapkan
                sebagai supervisor.
              </p>
            )}
          </div>
        )}

        {role !== "KARYAWAN" && (
          <div className="sm:col-span-2">
            <p className="text-xs text-slate-500">
              Supervisor hanya berlaku untuk karyawan (role Karyawan).
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 sm:col-span-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}