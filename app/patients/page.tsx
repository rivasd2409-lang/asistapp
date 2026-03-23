import {
  addUserToGroup,
  createGroup,
  createPatient,
  createUser,
} from "@/app/actions";
import { getAppData } from "@/lib/app-data";

export default async function PatientsPage() {
  const data = await getAppData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Patients</h1>
        <p className="mt-2 text-white/65">
          Manage users, groups, patients, and group members.
        </p>
      </div>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Users</h2>
          <form action={createUser}>
            <button
              type="submit"
              className="rounded bg-white px-4 py-2 text-black"
            >
              Crear usuario de prueba
            </button>
          </form>
        </div>

        <div className="space-y-2">
          {data.users.map((user) => (
            <div key={user.id} className="rounded border border-white/20 p-3">
              <p><strong>Nombre:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rol:</strong> {user.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Groups</h2>
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Patients</h2>
          <form action={createPatient}>
            <button
              type="submit"
              className="rounded bg-white px-4 py-2 text-black"
            >
              Crear paciente demo
            </button>
          </form>
        </div>

        <div className="space-y-2">
          {data.patients.map((patient) => (
            <div key={patient.id} className="rounded border border-white/20 p-3">
              <p><strong>Nombre:</strong> {patient.name}</p>
              <p><strong>Edad:</strong> {patient.age}</p>
              <p><strong>Group ID:</strong> {patient.groupId}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <h2 className="mb-4 text-lg font-semibold">Group members</h2>

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
              defaultValue="ADMIN"
            >
              <option value="ADMIN">ADMIN</option>
              <option value="FAMILY">FAMILY</option>
              <option value="CAREGIVER">CAREGIVER</option>
              <option value="HOUSEKEEPING">HOUSEKEEPING</option>
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
              <p><strong>Email:</strong> {member.user.email}</p>
              <p><strong>Grupo:</strong> {member.group.name}</p>
              <p><strong>Rol:</strong> {member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
