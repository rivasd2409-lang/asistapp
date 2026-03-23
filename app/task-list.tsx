'use client';

import { useOptimistic, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateTaskStatus } from "./task-actions";
import { TASK_STATUSES, type TaskStatus } from "./task-status";

type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  patient: {
    name: string;
  };
  assignedMember: {
    user: {
      name: string;
    };
  } | null;
};

type TaskListProps = {
  tasks: TaskListItem[];
};

export function TaskList({ tasks }: TaskListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [optimisticTasks, setOptimisticTaskStatus] = useOptimistic(
    tasks,
    (currentTasks, update: { taskId: string; status: TaskStatus }) =>
      currentTasks.map((task) =>
        task.id === update.taskId ? { ...task, status: update.status } : task
      )
  );

  function handleStatusChange(taskId: string, status: TaskStatus) {
    setOptimisticTaskStatus({ taskId, status });

    startTransition(async () => {
      try {
        await updateTaskStatus(taskId, status);
      } catch {
        router.refresh();
      }
    });
  }

  return (
    <div className="mt-4 space-y-2">
      {optimisticTasks.map((task) => (
        <div key={task.id} className="rounded border border-white/20 p-3">
          <p><strong>Título:</strong> {task.title}</p>
          <p><strong>Descripción:</strong> {task.description || "—"}</p>
          <p><strong>Estado:</strong> {task.status}</p>
          <p><strong>Paciente:</strong> {task.patient.name}</p>
          <p>
            <strong>Asignado a:</strong>{" "}
            {task.assignedMember?.user.name || "Sin asignar"}
          </p>

          <div className="mt-3">
            <label className="mb-1 block text-sm">Cambiar estado</label>
            <select
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
              disabled={isPending}
              onChange={(event) =>
                handleStatusChange(task.id, event.target.value as TaskStatus)
              }
              value={task.status}
            >
              {TASK_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
