import { prisma } from "@/lib/db";

import { TaskList } from "./task-list";
import { normalizeTaskStatus } from "./task-status";

async function createUser() {
  "use server";

  await prisma.user.upsert({
    where: { email: "daniel@example.com" },
    update: {},
    create: {
      name: "Daniel",
      email: "daniel@example.com",
      role: "ADMIN",
    },
  });
}

async function createGroup() {
  "use server";

  const existingGroup = await prisma.group.findFirst({
    where: { name: "Cuidado Wilfredo y Olga" },
  });

  if (!existingGroup) {
    await prisma.group.create({
      data: {
        name: "Cuidado Wilfredo y Olga",
      },
    });
  }
}

async function createPatient() {
  "use server";

  const group = await prisma.group.findFirst({
    where: { name: "Cuidado Wilfredo y Olga" },
  });

  if (!group) return;

  const existingPatient = await prisma.patient.findFirst({
    where: {
      name: "Wilfredo Rivas Flores",
      groupId: group.id,
    },
  });

  if (!existingPatient) {
    await prisma.patient.create({
      data: {
        name: "Wilfredo Rivas Flores",
        age: 67,
        groupId: group.id,
      },
    });
  }
}

async function addUserToGroup(formData: FormData) {
  "use server";

  const userId = formData.get("userId") as string;
  const groupId = formData.get("groupId") as string;
  const role = (formData.get("role") as string) || "ADMIN";

  if (!userId || !groupId) return;

  const existing = await prisma.groupMember.findFirst({
    where: {
      userId,
      groupId,
    },
  });

  if (!existing) {
    await prisma.groupMember.create({
      data: {
        userId,
        groupId,
        role,
      },
    });
  }
}

async function createTask(formData: FormData) {
  "use server";

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const patientId = formData.get("patientId") as string;
  const assignedMemberId = formData.get("assignedMemberId") as string;

  if (!title || !patientId) return;

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      patientId,
      assignedMemberId: assignedMemberId || null,
      status: "PENDING",
    },
  });
}

export default async function Home() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });

  const groups = await prisma.group.findMany({
    orderBy: { createdAt: "desc" },
  });

  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
  });

  const members = await prisma.groupMember.findMany({
    include: {
      user: true,
      group: true,
    },
    orderBy: {
      id: "desc",
    },
  });

  const tasks = await prisma.task.findMany({
    include: {
      patient: true,
      assignedMember: {
        include: {
          user: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const normalizedTasks = tasks.map((task) => ({
    ...task,
    status: normalizeTaskStatus(task.status),
  }));

  return (
    <main className="p-6 space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Asistapp Ã°Å¸Å¡â‚¬</h1>
        <p className="mt-4">Usuarios en base de datos: {users.length}</p>

        <form action={createUser} className="mt-4">
          <button
            type="submit"
            className="rounded bg-white px-4 py-2 text-black"
          >
            Crear usuario de prueba
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {users.map((user) => (
            <div key={user.id} className="rounded border border-white/20 p-3">
              <p><strong>Nombre:</strong> {user.name}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Rol:</strong> {user.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xl font-semibold">Grupos: {groups.length}</p>

        <form action={createGroup}>
          <button
            type="submit"
            className="rounded bg-white px-4 py-2 text-black"
          >
            Crear grupo demo
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {groups.map((group) => (
            <div key={group.id} className="rounded border border-white/20 p-3">
              <p><strong>Grupo:</strong> {group.name}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xl font-semibold">
          Pacientes: {patients.length}
        </p>

        <form action={createPatient}>
          <button
            type="submit"
            className="rounded bg-white px-4 py-2 text-black"
          >
            Crear paciente demo
          </button>
        </form>

        <div className="mt-4 space-y-2">
          {patients.map((patient) => (
            <div key={patient.id} className="rounded border border-white/20 p-3">
              <p><strong>Nombre:</strong> {patient.name}</p>
              <p><strong>Edad:</strong> {patient.age}</p>
              <p><strong>Group ID:</strong> {patient.groupId}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xl font-semibold">
          Miembros del grupo: {members.length}
        </p>

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
              {users.map((user) => (
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
              {groups.map((group) => (
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
          {members.map((member) => (
            <div key={member.id} className="rounded border border-white/20 p-3">
              <p><strong>Usuario:</strong> {member.user.name}</p>
              <p><strong>Email:</strong> {member.user.email}</p>
              <p><strong>Grupo:</strong> {member.group.name}</p>
              <p><strong>Rol:</strong> {member.role}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="mb-2 text-xl font-semibold">
          Tareas: {tasks.length}
        </p>

        <form action={createTask} className="space-y-3">
          <div>
            <label className="mb-1 block">TÃƒÂ­tulo</label>
            <input
              name="title"
              type="text"
              placeholder="Ej: Dar medicamento de la maÃƒÂ±ana"
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block">DescripciÃƒÂ³n</label>
            <textarea
              name="description"
              placeholder="Detalles de la tarea"
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block">Paciente</label>
            <select
              name="patientId"
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
              defaultValue=""
            >
              <option value="" disabled>
                Selecciona un paciente
              </option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block">Asignar a miembro del grupo</label>
            <select
              name="assignedMemberId"
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
              defaultValue=""
            >
              <option value="">Sin asignar</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.user.name} - {member.role}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            className="rounded bg-white px-4 py-2 text-black"
          >
            Crear tarea
          </button>
        </form>

        <TaskList tasks={normalizedTasks} />
      </section>
    </main>
  );
}
