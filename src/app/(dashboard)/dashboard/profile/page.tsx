import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { formatDateTime } from "@/lib/date";
import ProfileForm from "@/components/ProfileForm";
import ChangePasswordForm from "@/components/ChangePasswordForm";

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  HRD: "HRD",
  SPV: "SPV",
  KARYAWAN: "Karyawan",
};

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-medium text-slate-900">{value || "-"}</dd>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await getCurrentUser();
  if (!session) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: {
      name: true,
      username: true,
      role: true,
      email: true,
      nik: true,
      ktp: true,
      phone: true,
      birthDate: true,
      address: true,
      joinDate: true,
      maritalStatus: true,
      dependents: true,
      createdAt: true,
      company: { select: { name: true } },
      shift: { select: { name: true } },
      supervisor: { select: { name: true } },
    },
  });

  if (!user) redirect("/login");

  const cardClass = "rounded-2xl border border-slate-200 bg-surface shadow-sm";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Profil Saya</h1>
        <p className="text-slate-500 mt-1">
          Informasi pribadi dan data kepegawaian Anda
        </p>
      </div>

      <div className={`${cardClass} p-6`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-700">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="text-xl font-bold text-slate-900">{user.name}</div>
            <div className="text-sm text-slate-500">
              {roleLabels[user.role] || user.role}
              {user.company ? ` · ${user.company.name}` : ""}
            </div>
            <div className="text-sm text-slate-500">@{user.username}</div>
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Data Pribadi
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Nama Lengkap" value={user.name} />
          <InfoItem label="Username" value={user.username} />
          <InfoItem label="Email" value={user.email || ""} />
          <InfoItem label="No. Telepon" value={user.phone || ""} />
          <InfoItem label="Tanggal Lahir" value={user.birthDate ? formatDateTime(user.birthDate) : ""} />
          <InfoItem label="Alamat" value={user.address || ""} />
          <InfoItem label="NIK" value={user.nik || ""} />
          <InfoItem label="No. KTP" value={user.ktp || ""} />
          <InfoItem label="Status Perkawinan" value={user.maritalStatus === "KAWIN" ? "Kawin" : "Lajang"} />
          <InfoItem label="Tanggungan" value={user.dependents ? String(user.dependents) : "0"} />
        </dl>
      </div>

      <div className={cardClass}>
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Data Kepegawaian
          </h2>
        </div>
        <dl className="grid grid-cols-1 gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Mulai Bekerja" value={user.joinDate ? formatDateTime(user.joinDate) : ""} />
          <InfoItem label="Perusahaan" value={user.company?.name || ""} />
          <InfoItem label="Shift" value={user.shift?.name || ""} />
          <InfoItem label="Supervisor" value={user.supervisor?.name || ""} />
          <InfoItem label="Bergabung di Aplikasi" value={formatDateTime(user.createdAt)} />
        </dl>
      </div>

      <div className={cardClass}>
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Perbarui Data Pribadi
          </h2>
        </div>
        <div className="px-6 py-6">
          <ProfileForm
            user={{
              email: user.email,
              phone: user.phone,
              birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
              address: user.address,
            }}
          />
        </div>
      </div>

      <div className={cardClass}>
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Ganti Password
          </h2>
        </div>
        <div className="px-6 py-6">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}