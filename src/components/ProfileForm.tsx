"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function ProfileForm({
  user,
}: {
  user: {
    email: string | null;
    phone: string | null;
    birthDate: string | null;
    address: string | null;
  };
}) {
  const router = useRouter();
  const [email, setEmail] = useState(user.email || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [birthDate, setBirthDate] = useState(user.birthDate || "");
  const [address, setAddress] = useState(user.address || "");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          phone,
          birthDate: birthDate || null,
          address,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal menyimpan profil.");
        setLoading(false);
        return;
      }
      setMessage("Profil berhasil diperbarui.");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

  return (
    <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Email
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass}
          placeholder="nama@email.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          No. Telepon
        </label>
        <input
          type="text"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass}
          placeholder="0812-XXXX-XXXX"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Tanggal Lahir
        </label>
        <input
          type="date"
          value={birthDate}
          onChange={(e) => setBirthDate(e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Alamat
        </label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className={inputClass}
          placeholder="Alamat tempat tinggal"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 sm:col-span-2">
          {error}
        </div>
      )}
      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700 sm:col-span-2">
          {message}
        </div>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Simpan Profil"}
        </button>
      </div>
    </form>
  );
}