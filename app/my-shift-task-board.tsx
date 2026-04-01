'use client';

import { useEffect, useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateTaskStatus } from "./task-actions";
import {
  TASK_STATUS_BADGE_CLASSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "./task-status";

type MyShiftTask = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  dueDate: string | null;
  completedAt: string | null;
  patient: {
    id: string;
    name: string;
  };
  categoryLabel: string;
  isShared: boolean;
};

type MyShiftTaskBoardProps = {
  tasks: MyShiftTask[];
};

type TaskSection = "urgent" | "upcoming" | "completed";

function formatDueDate(value: string | null) {
  if (!value) {
    return "Sin fecha límite";
  }

  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function getTaskSection(task: MyShiftTask, now = Date.now()): TaskSection {
  if (task.status === "COMPLETED") {
    return "completed";
  }

  if (!task.dueDate) {
    return "upcoming";
  }

  const dueTime = new Date(task.dueDate).getTime();
  const dueSoonThreshold = now + 60 * 60 * 1000;

  if (dueTime <= dueSoonThreshold) {
    return "urgent";
  }

  return "upcoming";
}

function getTaskHighlightClasses(task: MyShiftTask, now = Date.now()) {
  if (task.status === "COMPLETED") {
    return "border-emerald-400/30 bg-emerald-400/10";
  }

  if (!task.dueDate) {
    return "border-white/10 bg-black/20";
  }

  const dueTime = new Date(task.dueDate).getTime();

  if (dueTime < now) {
    return "border-red-400/40 bg-red-400/10";
  }

  if (dueTime <= now + 60 * 60 * 1000) {
    return "border-amber-400/40 bg-amber-400/10";
  }

  return "border-white/10 bg-black/20";
}

function getTaskHint(task: MyShiftTask, now = Date.now()) {
  if (task.status === "COMPLETED") {
    return "Completada";
  }

  if (!task.dueDate) {
    return "Sin fecha límite";
  }

  const dueTime = new Date(task.dueDate).getTime();

  if (dueTime < now) {
    return "Vencida";
  }

  if (dueTime <= now + 60 * 60 * 1000) {
    return "Vence pronto";
  }

  return "Programada";
}

export function MyShiftTaskBoard({ tasks }: MyShiftTaskBoardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [optimisticTasks, setOptimisticTaskStatus] = useOptimistic(
    tasks,
    (currentTasks, update: { taskId: string; status: TaskStatus }) =>
      currentTasks.map((task) =>
        task.id === update.taskId
          ? {
              ...task,
              status: update.status,
              completedAt:
                update.status === "COMPLETED"
                  ? new Date().toISOString()
                  : task.completedAt,
            }
          : task
      )
  );

  function handleStatusChange(taskId: string, status: TaskStatus) {
    startTransition(async () => {
      setOptimisticTaskStatus({ taskId, status });

      try {
        await updateTaskStatus(taskId, status, {
          administeredByMemberId: null,
          recordedByMemberId: null,
        });
      } catch {
        router.refresh();
      }
    });
  }

  useEffect(() => {
    const interval = window.setInterval(() => {
      setCurrentTime(Date.now());
    }, 60_000);

    return () => window.clearInterval(interval);
  }, []);

  const now = currentTime;
  const urgentTasks = optimisticTasks.filter(
    (task) => getTaskSection(task, now) === "urgent"
  );
  const upcomingTasks = optimisticTasks.filter(
    (task) => getTaskSection(task, now) === "upcoming"
  );
  const completedTasks = optimisticTasks.filter(
    (task) => getTaskSection(task, now) === "completed"
  );

  const sections = [
    {
      id: "urgent",
      title: "Urgente",
      description: "Tareas vencidas o con vencimiento en la próxima hora.",
      tasks: urgentTasks,
      emptyMessage: "No hay tareas urgentes en este momento.",
    },
    {
      id: "upcoming",
      title: "Próximas",
      description: "Tareas del turno o del día que vienen después.",
      tasks: upcomingTasks,
      emptyMessage: "No hay próximas tareas para este turno.",
    },
    {
      id: "completed",
      title: "Completadas",
      description: "Tareas cerradas en esta ventana operativa.",
      tasks: completedTasks,
      emptyMessage: "Aún no hay tareas completadas en esta ventana.",
    },
  ] as const;

  return (
    <div className="space-y-4">
      {sections.map((section) => (
        <section
          key={section.id}
          className="rounded-2xl border border-white/15 bg-white/5 p-4"
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white">{section.title}</h3>
              <p className="text-sm text-white/60">{section.description}</p>
            </div>
            <span className="rounded-full border border-white/15 bg-black/20 px-3 py-1 text-xs font-semibold text-white/75">
              {section.tasks.length}
            </span>
          </div>

          <div className="grid gap-3 xl:grid-cols-2">
            {section.tasks.length > 0 ? (
              section.tasks.map((task) => (
                <article
                  key={task.id}
                  className={`rounded-xl border p-4 ${getTaskHighlightClasses(task, now)}`}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] uppercase tracking-wide text-white/70">
                      {task.categoryLabel}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${TASK_STATUS_BADGE_CLASSES[task.status]}`}
                    >
                      {TASK_STATUS_LABELS[task.status]}
                    </span>
                    <span className="rounded-full border border-white/15 bg-black/20 px-2.5 py-1 text-[11px] uppercase tracking-wide text-white/65">
                      {getTaskHint(task, now)}
                    </span>
                  </div>

                  <h4 className="mt-3 text-sm font-semibold text-white">{task.title}</h4>
                  <p className="mt-2 text-sm text-white/70">
                    <strong className="text-white">Paciente:</strong> {task.patient.name}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    <strong className="text-white">Fecha límite:</strong> {formatDueDate(task.dueDate)}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    <strong className="text-white">Visibilidad:</strong>{" "}
                    {task.isShared ? "Compartida con el equipo" : "Asignada directamente a ti"}
                  </p>
                  <p className="mt-1 text-sm text-white/70">
                    <strong className="text-white">Descripción:</strong> {task.description || "-"}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {task.status === "PENDING" ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(task.id, "IN_PROGRESS")}
                        className="rounded border border-sky-400/30 px-3 py-2 text-xs text-sky-200 disabled:opacity-60"
                      >
                        Marcar en curso
                      </button>
                    ) : null}

                    {task.status !== "COMPLETED" ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(task.id, "COMPLETED")}
                        className="rounded border border-emerald-400/30 px-3 py-2 text-xs text-emerald-200 disabled:opacity-60"
                      >
                        Completar tarea
                      </button>
                    ) : null}

                    {task.status !== "DISCARDED" && task.status !== "COMPLETED" ? (
                      <button
                        type="button"
                        disabled={isPending}
                        onClick={() => handleStatusChange(task.id, "DISCARDED")}
                        className="rounded border border-rose-400/30 px-3 py-2 text-xs text-rose-200 disabled:opacity-60"
                      >
                        Descartar tarea
                      </button>
                    ) : null}
                  </div>
                </article>
              ))
            ) : (
              <p className="rounded-xl border border-dashed border-white/15 px-3 py-4 text-sm text-white/55">
                {section.emptyMessage}
              </p>
            )}
          </div>
        </section>
      ))}
    </div>
  );
}
