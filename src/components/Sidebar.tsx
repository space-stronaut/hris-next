"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import NotificationBell from "@/components/NotificationBell";

type NavItem = { href: string; label: string; icon: string; roles: string[] };

type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    title: "Utama",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: "grid", roles: ["ADMIN", "HRD", "KARYAWAN"] },
    ],
  },
  {
    title: "Cuti & Gaji",
    items: [
      { href: "/dashboard/leave", label: "Cuti Saya", icon: "calendar", roles: ["ADMIN", "HRD", "KARYAWAN"] },
      { href: "/dashboard/payroll", label: "Gaji Saya", icon: "card", roles: ["ADMIN", "HRD", "KARYAWAN"] },
      { href: "/dashboard/overtime", label: "Lembur Saya", icon: "clock", roles: ["ADMIN", "HRD", "KARYAWAN"] },
      { href: "/dashboard/corrections", label: "Koreksi Absensi", icon: "edit", roles: ["ADMIN", "HRD", "KARYAWAN"] },
    ],
  },
  {
    title: "Klaim & Meeting",
    items: [
      { href: "/dashboard/claims", label: "Klaim Saya", icon: "file", roles: ["ADMIN", "HRD", "KARYAWAN"] },
      { href: "/dashboard/meetings", label: "Meeting", icon: "users", roles: ["ADMIN", "HRD", "KARYAWAN"] },
    ],
  },
  {
    title: "HRD",
    items: [
      { href: "/hrd", label: "Dashboard HRD", icon: "chart", roles: ["ADMIN", "HRD"] },
      { href: "/hrd/leaves", label: "Persetujuan Cuti", icon: "check", roles: ["ADMIN", "HRD"] },
      { href: "/hrd/claims", label: "Persetujuan Klaim", icon: "check", roles: ["ADMIN", "HRD"] },
      { href: "/hrd/overtime", label: "Persetujuan Lembur", icon: "clock", roles: ["ADMIN", "HRD"] },
      { href: "/hrd/corrections", label: "Koreksi Absensi", icon: "edit", roles: ["ADMIN", "HRD"] },
      { href: "/hrd/payroll", label: "Payroll", icon: "dollar", roles: ["ADMIN", "HRD"] },
      { href: "/hrd/meetings", label: "Manajemen Meeting", icon: "users", roles: ["ADMIN", "HRD"] },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/admin", label: "Dashboard Admin", icon: "shield", roles: ["ADMIN"] },
      { href: "/admin/users", label: "Karyawan", icon: "users", roles: ["ADMIN"] },
      { href: "/admin/shifts", label: "Shift & Jam Kerja", icon: "briefcase", roles: ["ADMIN"] },
      { href: "/admin/roster", label: "Roster", icon: "calendar", roles: ["ADMIN"] },
      { href: "/admin/attendance", label: "Rekap Absensi", icon: "clock", roles: ["ADMIN"] },
    ],
  },
  {
    title: "Super Admin",
    items: [
      { href: "/super/companies", label: "Kelola Perusahaan", icon: "briefcase", roles: ["SUPER_ADMIN"] },
    ],
  },
];

const iconPaths: Record<string, React.ReactNode> = {
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="17" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </>
  ),
  card: (
    <>
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </>
  ),
  users: (
    <>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </>
  ),
  chart: (
    <>
      <line x1="12" y1="20" x2="12" y2="10" />
      <line x1="18" y1="20" x2="18" y2="4" />
      <line x1="6" y1="20" x2="6" y2="16" />
    </>
  ),
  check: (
    <>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </>
  ),
  dollar: (
    <>
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </>
  ),
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
  clock: (
    <>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </>
  ),
  briefcase: (
    <>
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
};

const baseStroke = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function SidebarIcon({ name }: { name: string }) {
  return <svg {...baseStroke}>{iconPaths[name]}</svg>;
}

export default function Sidebar({
  name,
  role,
  companyName,
}: {
  name: string;
  role: string;
  companyName?: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("sidebar-collapsed");
  });
  const [dark, setDark] = useState<boolean>(() => {
    if (typeof document === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("absensi-theme", next ? "dark" : "light");
    } catch {}
  }

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    document.documentElement.classList.toggle("sidebar-collapsed", next);
    try {
      localStorage.setItem("absensi-sidebar", next ? "collapsed" : "expanded");
    } catch {}
  }

  const visibleGroups = groups
    .map((g) => ({
      title: g.title,
      items: g.items.filter((i) => i.roles.includes(role)),
    }))
    .filter((g) => g.items.length > 0);

  const roleLabel =
    role === "SUPER_ADMIN"
      ? "Super Admin"
      : role === "ADMIN"
      ? "Admin"
      : role === "HRD"
      ? "HRD"
      : "Karyawan";

  async function logout() {
    setLoading(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
      router.refresh();
    }
  }

  const activeHref =
    visibleGroups
      .flatMap((g) => g.items)
      .filter(
        (i) => pathname === i.href || pathname.startsWith(i.href + "/")
      )
      .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const navContent = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-6">
      {visibleGroups.map((group) => (
        <div key={group.title}>
          {!collapsed && (
            <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
              {group.title}
            </div>
          )}
          <div className="space-y-1">
            {group.items.map((item) => {
              const active = item.href === activeHref;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                    collapsed ? "justify-center" : ""
                  } ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  <span className="shrink-0">
                    <SidebarIcon name={item.icon} />
                  </span>
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  const userFooter = (
    <div className="border-t border-slate-200 p-3">
      {!collapsed ? (
        <button
          onClick={toggleTheme}
          className="mb-3 flex w-full items-center justify-between rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-100"
        >
          <span>{dark ? "Mode Gelap" : "Mode Terang"}</span>
          <span aria-hidden="true">
            {dark ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
              </svg>
            )}
          </span>
        </button>
      ) : (
        <button
          onClick={toggleTheme}
          title="Ganti tema"
          className="mb-3 flex w-full items-center justify-center rounded-lg border border-slate-300 py-2 text-slate-600 transition hover:bg-slate-100"
        >
          {dark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
            </svg>
          )}
        </button>
      )}

      {collapsed ? (
        <div className="flex flex-col items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700"
            title={`${name} · ${roleLabel}`}
          >
            {name.charAt(0).toUpperCase()}
          </div>
          <button
            onClick={logout}
            disabled={loading}
            title="Keluar"
            className="rounded-lg border border-slate-300 p-2 text-slate-600 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-60"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-slate-900">
              {name}
            </div>
            <div className="truncate text-xs text-slate-500">
              {companyName ? `${companyName} · ${roleLabel}` : roleLabel}
            </div>
          </div>
          <button
            onClick={logout}
            disabled={loading}
            title="Keluar"
            className="rounded-lg border border-slate-300 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:opacity-60"
          >
            {loading ? "..." : "Keluar"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-surface px-4 lg:hidden">
        <button
          onClick={() => setOpen(true)}
          className="rounded-lg border border-slate-300 p-2 text-slate-600 hover:bg-slate-100"
          aria-label="Buka menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <span className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            A
          </span>
          <span className="font-semibold text-slate-900">HRIS Ultimate</span>
        </span>
        <NotificationBell />
      </header>

      {/* Desktop sidebar */}
      <aside
        className={`hidden shrink-0 flex-col border-r border-slate-200 bg-surface transition-all duration-300 lg:flex ${
          collapsed ? "w-[68px]" : "w-64"
        }`}
      >
        <div
          className={`flex h-14 items-center border-b border-slate-200 ${
            collapsed ? "justify-center px-2" : "gap-2 px-5"
          }`}
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            A
          </span>
          {!collapsed && (
            <span className="truncate text-lg font-semibold text-slate-900">
              HRIS Ultimate
            </span>
          )}
        </div>
        <div
          className={`flex items-center border-b border-slate-200 ${
            collapsed
              ? "flex-col gap-1 py-2"
              : "h-12 justify-center px-3"
          }`}
        >
          <NotificationBell />
          {collapsed ? (
            <button
              onClick={toggleCollapsed}
              title="Perbesar sidebar"
              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="21" y1="12" x2="11" y2="12" />
                <polyline points="15 8 19 12 15 16" />
                <line x1="3" y1="4" x2="9" y2="4" />
                <line x1="3" y1="20" x2="9" y2="20" />
              </svg>
            </button>
          ) : (
            <div className="ml-auto">
              <button
                onClick={toggleCollapsed}
                title="Perkecil sidebar"
                className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" y1="12" x2="13" y2="12" />
                  <polyline points="9 8 5 12 9 16" />
                  <line x1="15" y1="4" x2="21" y2="4" />
                  <line x1="15" y1="20" x2="21" y2="20" />
                </svg>
              </button>
            </div>
          )}
        </div>
        {navContent}
        {userFooter}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col bg-surface shadow-xl">
            <div className="flex h-14 items-center justify-between border-b border-slate-200 px-5">
              <span className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
                  A
                </span>
                <span className="text-lg font-semibold text-slate-900">HRIS Ultimate</span>
              </span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Tutup menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            {navContent}
            {userFooter}
          </div>
        </div>
      )}
    </>
  );
}
