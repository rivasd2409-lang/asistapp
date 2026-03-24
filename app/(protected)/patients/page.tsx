import Link from "next/link";

import {
  addUserToGroup,
  createGroup,
  createPatient,
} from "@/app/actions";
import { getAppData } from "@/lib/app-data";
import {
  APP_ROLES,
  APP_ROLE_LABELS,
  hasPermission,
  normalizeAppRole,
} from "@/lib/roles";

export default async function PatientsPage() {
  const data = await getAppData();
  const viewer = data.viewer;

  if (!viewer || !hasPermission(viewer.role, "view_patients")) {
    return null;
  }

  const canManageFamilyWorkspace = hasPermission(
    viewer.role,
    "manage_family_workspace"
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pacientes</h1>
        <p className="mt-2 text-white/65">
          {canManageFamilyWorkspace
            ? "Gestiona grupos, pacientes y miembros de apoyo."
            : "Consulta la información relevante de los pacientes y su red de cuidado."}
        </p>
      </div>

      {canManageFamilyWorkspace ? (
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold">Gestión de usuarios</h2>
              <p className="text-sm text-white/60">
                Crea colaboradores y administra acceso desde el módulo dedicado.
              </p>
            </div>
            <Link
              href="/users"
              className="rounded bg-white px-4 py-2 text-center text-black"
            >
              Ir a usuarios
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Pacientes</h2>
          {canManageFamilyWorkspace ? (
            <form action={createPatient}>
              <button
                type="submit"
                className="rounded bg-white px-4 py-2 text-black"
              >
                Crear paciente demo
              </button>
            </form>
          ) : null}
        </div>

        <div className="space-y-2">
          {data.patients.map((patient) => (
            <div key={patient.id} className="rounded border border-white/20 p-3">
              <p><strong>Nombre:</strong> {patient.name}</p>
              <p><strong>Edad:</strong> {patient.age}</p>
              <p><strong>ID del grupo:</strong> {patient.groupId}</p>
            </div>
          ))}
        </div>
      </section>

      {canManageFamilyWorkspace ? (
        <>
          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Grupos</h2>
              <form action={createGroup}>
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-2 text-black"
                >
                  Crear grupo demo
                </button>
              </form>
            </div>

            <div className="space-y-2">
              {data.groups.map((group) => (
                <div key={group.id} className="rounded border border-white/20 p-3">
                  <p><strong>Grupo:</strong> {group.name}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <h2 className="mb-4 text-lg font-semibold">Miembros del grupo</h2>

            <form action={addUserToGroup} className="space-y-3">
              <div>
                <label className="mb-1 block">Usuario</label>
                <select
                  name="userId"
                  className="w-full rounded border border-white/20 bg-black px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecciona un usuario
                  </option>
                  {data.users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block">Grupo</label>
                <select
                  name="groupId"
                  className="w-full rounded border border-white/20 bg-black px-3 py-2"
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecciona un grupo
                  </option>
                  {data.groups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block">Rol dentro del grupo</label>
                <select
                  name="role"
                  className="w-full rounded border border-white/20 bg-black px-3 py-2"
                  defaultValue="FAMILIAR_LECTURA"
                >
                  {APP_ROLES.map((role) => (
                    <option key={role} value={role}>
                      {APP_ROLE_LABELS[role]}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                className="rounded bg-white px-4 py-2 text-black"
              >
                Agregar usuario al grupo
              </button>
            </form>

            <div className="mt-4 space-y-2">
              {data.members.map((member) => (
                <div key={member.id} className="rounded border border-white/20 p-3">
                  <p><strong>Usuario:</strong> {member.user.name}</p>
                  <p><strong>Correo:</strong> {member.user.email}</p>
                  <p><strong>Grupo:</strong> {member.group.name}</p>
                  <p>
                    <strong>Rol:</strong> {APP_ROLE_LABELS[normalizeAppRole(member.role)]}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <h2 className="mb-4 text-lg font-semibold">Equipo visible</h2>
          <div className="space-y-2">
            {data.members.map((member) => (
              <div key={member.id} className="rounded border border-white/20 p-3">
                <p><strong>Usuario:</strong> {member.user.name}</p>
                <p><strong>Grupo:</strong> {member.group.name}</p>
                <p><strong>Rol:</strong> {APP_ROLE_LABELS[normalizeAppRole(member.role)]}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
