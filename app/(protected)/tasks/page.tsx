import { redirect } from "next/navigation";

import { createTask } from "@/app/actions";
import { TaskCreateForm } from "@/app/task-create-form";
import { TaskList } from "@/app/task-list";
import { getAppData } from "@/lib/app-data";
import { hasPermission } from "@/lib/roles";

export default async function TasksPage() {
  const data = await getAppData();
  const viewer = data.viewer;

  if (!viewer || !hasPermission(viewer.role, "view_tasks")) {
    redirect("/dashboard");
  }

  const canCreateTasks = hasPermission(viewer.role, "create_tasks");
  const isAssignedView = viewer.role === "ENFERMERA" || viewer.role === "APOYO_DOMESTICO";

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{isAssignedView ? "Mis tareas" : "Tareas"}</h1>
        <p className="mt-2 text-white/65">
          {isAssignedView
            ? "Aquí ves las tareas asignadas a tu rol de cuidado."
            : "Crea y gestiona las tareas del flujo de cuidado."}
        </p>
      </div>

      {canCreateTasks ? (
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <h2 className="mb-4 text-lg font-semibold">Crear tarea</h2>
          <TaskCreateForm
            action={createTask}
            patients={data.patients}
            members={data.members}
          />
        </section>
      ) : null}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Tablero de tareas</h2>
          <p className="text-sm text-white/60">
            Actualiza estados y revisa el trabajo pendiente.
          </p>
        </div>
        <TaskList tasks={data.tasks} members={data.members} />
      </section>
    </section>
  );
}
