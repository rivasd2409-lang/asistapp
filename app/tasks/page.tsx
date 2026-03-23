import { createTask } from "@/app/actions";
import { TaskCreateForm } from "@/app/task-create-form";
import { TaskList } from "@/app/task-list";
import { getAppData } from "@/lib/app-data";

export default async function TasksPage() {
  const data = await getAppData();

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasks</h1>
        <p className="mt-2 text-white/65">
          Create caregiving tasks and manage them in the board.
        </p>
      </div>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <h2 className="mb-4 text-lg font-semibold">Create task</h2>
        <TaskCreateForm
          action={createTask}
          patients={data.patients}
          members={data.members}
        />
      </section>

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Task board</h2>
          <p className="text-sm text-white/60">
            Filter by patient and update status from the kanban board.
          </p>
        </div>
        <TaskList tasks={data.tasks} />
      </section>
    </section>
  );
}
