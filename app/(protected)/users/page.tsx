import { redirect } from "next/navigation";

import { UserManagementForm } from "@/app/user-management-form";
import { createManagedUser, updateManagedUser } from "@/app/user-actions";
import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth";
import { APP_ROLES, APP_ROLE_LABELS, normalizeAppRole } from "@/lib/roles";

export default async function UsersPage() {
  const viewer = await requireCurrentUser();

  if (viewer.role !== "ADMIN_FAMILIA") {
    redirect("/dashboard");
  }

  const [users, groups] = await Promise.all([
    prisma.user.findMany({
      include: {
        groupMembers: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.group.findMany({
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="mt-2 text-white/65">
          Crea y administra colaboradores del flujo de cuidado desde un solo lugar.
        </p>
      </div>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <h2 className="mb-4 text-lg font-semibold">Crear colaborador</h2>
        <UserManagementForm action={createManagedUser} groups={groups} />
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Colaboradores registrados</h2>
          <p className="text-sm text-white/60">
            Cambia rol y estado para controlar acceso, turnos y asignaciones.
          </p>
        </div>

        <div className="space-y-3">
          {users.map((user) => (
            <article
              key={user.id}
              className="rounded-2xl border border-white/10 bg-black/20 p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-white">{user.name}</p>
                  <p className="text-sm text-white/65">{user.email}</p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/80">
                      {APP_ROLE_LABELS[normalizeAppRole(user.role)]}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 ${
                        user.isActive
                          ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                          : "border-amber-400/30 bg-amber-400/10 text-amber-200"
                      }`}
                    >
                      {user.isActive ? "Activo" : "Inactivo"}
                    </span>
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-white/70">
                      {user.groupMembers.length > 0
                        ? `Grupos: ${user.groupMembers.map((member) => member.group.name).join(", ")}`
                        : "Sin grupo vinculado"}
                    </span>
                  </div>
                </div>

                <form action={updateManagedUser} className="grid gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                  <input type="hidden" name="userId" value={user.id} />

                  <div>
                    <label className="mb-1 block text-sm text-white/75">Rol</label>
                    <select
                      name="role"
                      defaultValue={normalizeAppRole(user.role)}
                      className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    >
                      {APP_ROLES.map((role) => (
                        <option key={role} value={role}>
                          {APP_ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="mb-1 block text-sm text-white/75">Estado</label>
                    <select
                      name="isActive"
                      defaultValue={user.isActive ? "true" : "false"}
                      className="w-full rounded border border-white/20 bg-black px-3 py-2"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full rounded bg-white px-4 py-2 text-black"
                    >
                      Guardar cambios
                    </button>
                  </div>
                </form>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  );
}
