'use client';

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { updateTaskStatus } from "./task-actions";
import {
  TASK_BOARD_STATUSES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "./task-status";

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
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dropTargetStatus, setDropTargetStatus] = useState<TaskStatus | null>(
    null
  );

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

  const tasksByStatus = {
    PENDING: optimisticTasks.filter((task) => task.status === "PENDING"),
    IN_PROGRESS: optimisticTasks.filter(
      (task) => task.status === "IN_PROGRESS"
    ),
    COMPLETED: optimisticTasks.filter((task) => task.status === "COMPLETED"),
    DISCARDED: optimisticTasks.filter((task) => task.status === "DISCARDED"),
  };

  function renderQuickActions(task: TaskListItem) {
    const availableStatuses = TASK_STATUSES.filter(
      (status) => status !== task.status
    );

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {availableStatuses.map((status) => (
          <button
            key={status}
            type="button"
            className="rounded border border-white/20 px-2 py-1 text-xs"
            disabled={isPending}
            onClick={() => handleStatusChange(task.id, status)}
          >
            Move to {TASK_STATUS_LABELS[status]}
          </button>
        ))}
      </div>
    );
  }

  function renderTaskCard(task: TaskListItem) {
    return (
      <article
        key={task.id}
        className="rounded border border-white/20 bg-black/30 p-3"
        draggable={!isPending}
        onDragStart={(event) => {
          setDraggedTaskId(task.id);
          event.dataTransfer.setData("text/task-id", task.id);
          event.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => {
          setDraggedTaskId(null);
          setDropTargetStatus(null);
        }}
      >
        <p><strong>Title:</strong> {task.title}</p>
        <p><strong>Description:</strong> {task.description || "-"}</p>
        <p><strong>Patient:</strong> {task.patient.name}</p>
        <p>
          <strong>Assigned to:</strong>{" "}
          {task.assignedMember?.user.name || "Sin asignar"}
        </p>
        {renderQuickActions(task)}
      </article>
    );
  }

  function renderColumn(status: (typeof TASK_BOARD_STATUSES)[number]) {
    const columnTasks = tasksByStatus[status];
    const isActiveDropTarget = dropTargetStatus === status;

    return (
      <section
        key={status}
        className={`rounded border p-4 transition ${
          isActiveDropTarget
            ? "border-white bg-white/10"
            : "border-white/20 bg-white/5"
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
          setDropTargetStatus(status);
        }}
        onDragLeave={() => {
          if (dropTargetStatus === status) {
            setDropTargetStatus(null);
          }
        }}
        onDrop={(event) => {
          event.preventDefault();
          const taskId = event.dataTransfer.getData("text/task-id");

          setDraggedTaskId(null);
          setDropTargetStatus(null);

          if (!taskId) {
            return;
          }

          handleStatusChange(taskId, status);
        }}
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">{TASK_STATUS_LABELS[status]}</h3>
          <span className="rounded border border-white/20 px-2 py-1 text-xs">
            {columnTasks.length}
          </span>
        </div>

        <div className="space-y-3">
          {columnTasks.length > 0 ? (
            columnTasks.map(renderTaskCard)
          ) : (
            <p className="rounded border border-dashed border-white/20 p-3 text-sm text-white/60">
              {draggedTaskId && isActiveDropTarget
                ? "Drop task here"
                : "No tasks in this column"}
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      <div className="grid gap-4 lg:grid-cols-3">
        {TASK_BOARD_STATUSES.map(renderColumn)}
      </div>

      <section className="rounded border border-white/20 bg-white/5 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {TASK_STATUS_LABELS.DISCARDED}
          </h3>
          <span className="rounded border border-white/20 px-2 py-1 text-xs">
            {tasksByStatus.DISCARDED.length}
          </span>
        </div>

        <div className="space-y-3">
          {tasksByStatus.DISCARDED.length > 0 ? (
            tasksByStatus.DISCARDED.map(renderTaskCard)
          ) : (
            <p className="rounded border border-dashed border-white/20 p-3 text-sm text-white/60">
              No discarded tasks
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
