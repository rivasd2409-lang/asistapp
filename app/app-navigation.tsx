'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/tasks", label: "Tasks" },
  { href: "/inventory", label: "Inventory" },
  { href: "/patients", label: "Patients" },
];

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-white/10 bg-black/40">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2 px-4 py-4 md:px-6">
        <div className="mr-4 text-lg font-semibold text-white">Asistapp</div>
        {navItems.map((item) => {
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
