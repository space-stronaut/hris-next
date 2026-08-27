"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { formatDateKey } from "@/lib/date";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/lib/usePagination";

type MeetingRow = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  agenda: string | null;
  participants: { user: { id: string; name: string } }[];
};

type UserOpt = {
  id: string;
  name: string;
  role: string;
};

type EditingMeeting = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  agenda: string;
  participantIds: string[];
};

type ToastData = { type: "success" | "error"; message: string };

const inputCls =
  "w-full rounded-lg border border-slate-300 bg-surface px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500";

function ParticipantPicker({
  users,
  selected,
  onChange,
}: {
  users: UserOpt[];
  selected: string[];
  onChange: (ids: string[]) => void;
}) {
  function toggle(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((x) => x !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  return (
    <div className="grid max-h-40 gap-1 overflow-y-auto rounded-lg border border-slate-200 p-2 sm:grid-cols-2">
      {users.length === 0 && (
        <p className="px-2 py-1 text-sm text-slate-500 sm:col-span-2">
          Belum ada karyawan yang bisa diundang.
        </p>
      )}
      {users.map((u) => (
        <label
          key={u.id}
          className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 transition hover:bg-blue-50"
        >
          <input
            type="checkbox"
            checked={selected.includes(u.id)}
            onChange={() => toggle(u.id)}
            className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="truncate">{u.name}</span>
        </label>
      ))}
    </div>
  );
}

export default function MeetingManager({
  meetings,
  users,
}: {
  meetings: MeetingRow[];
  users: UserOpt[];
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  const [agenda, setAgenda] = useState("");
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastData | null>(null);

  const pag = usePagination(meetings.length);
  const pageMeetings = meetings.slice(pag.start, pag.end);

  const [editing, setEditing] = useState<EditingMeeting | null>(null);
  const [editLoading, setEditLoading] = useState(false);

  function showToast(type: ToastData["type"], message: string) {
    setToast({ type, message });
    window.setTimeout(() => setToast(null), 3500);
  }

  async function createMeeting(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          date,
          time,
          location,
          agenda,
          participantIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal membuat meeting.");
        setLoading(false);
        return;
      }
      setTitle("");
      setDate("");
      setTime("");
      setLocation("");
      setAgenda("");
      setParticipantIds([]);
      setLoading(false);
      showToast("success", "Meeting berhasil dibuat.");
      router.refresh();
    } catch {
      setError("Terjadi kesalahan.");
      setLoading(false);
    }
  }

  function openEdit(m: MeetingRow) {
    setEditing({
      id: m.id,
      title: m.title,
      date: m.date,
      time: m.time,
      location: m.location,
      agenda: m.agenda || "",
      participantIds: m.participants.map((p) => p.user.id),
    });
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setEditLoading(true);
    try {
      const res = await fetch(`/api/meeting/${editing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editing.title,
          date: editing.date,
          time: editing.time,
          location: editing.location,
          agenda: editing.agenda,
          participantIds: editing.participantIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast("error", data.message || "Gagal memperbarui meeting.");
        setEditLoading(false);
        return;
      }
      setEditing(null);
      setEditLoading(false);
      showToast("success", "Meeting berhasil diperbarui.");
      router.refresh();
    } catch {
      showToast("error", "Terjadi kesalahan.");
      setEditLoading(false);
    }
  }

  async function deleteMeeting(id: string) {
    if (!confirm("Yakin ingin menghapus meeting ini?")) return;
    const res = await fetch(`/api/meeting/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      showToast("error", data.message || "Gagal menghapus.");
      return;
    }
    showToast("success", "Meeting berhasil dihapus.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {toast && (
        <div
          className={`fixed right-4 top-4 z-50 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toast.type === "success"
              ? "bg-green-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <form
        onSubmit={createMeeting}
        className="rounded-2xl border border-slate-200 bg-surface p-6 shadow-sm"
      >
        <h2 className="text-lg font-semibold text-slate-900">Buat Meeting</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Judul
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={inputCls}
              placeholder="Judul meeting"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Tanggal
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Waktu
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Lokasi
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
              className={inputCls}
              placeholder="Ruang / online"
            />
          </div>
          <div className="lg:col-span-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Agenda
            </label>
            <textarea
              value={agenda}
              onChange={(e) => setAgenda(e.target.value)}
              rows={2}
              className={inputCls}
              placeholder="Agenda meeting (opsional)"
            />
          </div>
          <div className="lg:col-span-5">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Peserta ({participantIds.length} dipilih)
            </label>
            <ParticipantPicker
              users={users}
              selected={participantIds}
              onChange={setParticipantIds}
            />
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-600">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "Menyimpan..." : "Buat Meeting"}
        </button>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-surface shadow-sm">
        <div className="border-b border-slate-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            Daftar Meeting ({meetings.length})
          </h2>
        </div>
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
                <th className="px-6 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {meetings.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                    Belum ada meeting.
                  </td>
                </tr>
              )}
              {pageMeetings.map((m) => (
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
                          .slice(0, 3)
                          .map((p) => p.user.name)
                          .join(", ")}
                    {m.participants.length > 3 && (
                      <span className="text-slate-400">
                        {" "}
                        +{m.participants.length - 3} lainnya
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(m)}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteMeeting(m.id)}
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
          total={meetings.length}
          page={pag.page}
          pageSize={pag.pageSize}
          onPageChange={pag.goToPage}
        />
      </div>

      {editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <form
            onSubmit={saveEdit}
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-surface p-6 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Edit Meeting
              </h2>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Judul
                </label>
                <input
                  type="text"
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={editing.date}
                  onChange={(e) =>
                    setEditing({ ...editing, date: e.target.value })
                  }
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Waktu
                </label>
                <input
                  type="time"
                  value={editing.time}
                  onChange={(e) =>
                    setEditing({ ...editing, time: e.target.value })
                  }
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lokasi
                </label>
                <input
                  type="text"
                  value={editing.location}
                  onChange={(e) =>
                    setEditing({ ...editing, location: e.target.value })
                  }
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Agenda
                </label>
                <input
                  type="text"
                  value={editing.agenda}
                  onChange={(e) =>
                    setEditing({ ...editing, agenda: e.target.value })
                  }
                  className={inputCls}
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Peserta ({editing.participantIds.length} dipilih)
                </label>
                <ParticipantPicker
                  users={users}
                  selected={editing.participantIds}
                  onChange={(ids) =>
                    setEditing({ ...editing, participantIds: ids })
                  }
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={editLoading}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
              >
                {editLoading ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}