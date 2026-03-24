'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

import { hasPermission, type AppRole } from "@/lib/roles";

const navItems = [
  { href: "/dashboard", label: "Inicio", permission: "view_dashboard" },
  { href: "/summary", label: "Resumen diario", permission: "view_summary" },
  { href: "/shifts", label: "Turnos", permission: "view_shifts" },
  { href: "/tasks", label: "Tareas", permission: "view_tasks" },
  {
    href: "/medication-history",
    label: "Historial de medicación",
    permission: "view_medication_history",
  },
  { href: "/inventory", label: "Inventario", permission: "view_inventory" },
  { href: "/vitals", label: "Signos vitales", permission: "view_vitals" },
  { href: "/patients", label: "Pacientes", permission: "view_patients" },
  { href: "/users", label: "Usuarios", permission: "manage_family_workspace" },
] as const;

type AppNavigationProps = {
  role: AppRole;
};

export function AppNavigation({ role }: AppNavigationProps) {
  const pathname = usePathname();
  const visibleNavItems = navItems.filter((item) =>
    hasPermission(role, item.permission)
  );

  return (
    <nav className="border-b border-white/10 bg-black/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 md:px-6">
        <div className="mr-4 text-lg font-semibold text-white">Asistapp</div>
        {visibleNavItems.map((item) => {
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-sm transition ${
                isActive
                  ? "bg-white text-black"
                  : "bg-white/5 text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
