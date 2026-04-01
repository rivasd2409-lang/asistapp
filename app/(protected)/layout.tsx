import { AppNavigation } from "../app-navigation";
import { signOut } from "../auth-actions";
import { ThemeSelector } from "../theme-selector";

import { requireCurrentUser } from "@/lib/auth";

export default async function ProtectedLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await requireCurrentUser();

  return (
    <div className="min-h-full">
      <div className="print:hidden">
        <AppNavigation role={user.role} />
      </div>
      <div className="border-b border-white/10 bg-white/[0.03] print:hidden">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
          <div>
            <p className="text-sm font-medium text-white">{user.name}</p>
            <p className="text-sm text-white/55">
              {user.roleLabel} · {user.email}
            </p>
          </div>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <ThemeSelector />
            <form action={signOut}>
              <button
                type="submit"
                className="rounded border border-white/20 px-4 py-2 text-sm text-white transition hover:bg-white/10"
              >
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6 md:px-6 print:max-w-none print:px-0 print:py-0">
        {children}
      </main>
    </div>
  );
}
