'use client';

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { formatMedicationDose, type MedicationUnit } from "./medication-units";
import {
  TASK_CATEGORY_BADGE_CLASSES,
  TASK_CATEGORY_LABELS,
  type TaskCategory,
} from "./task-category";
import {
  formatTaskRecurrence,
  type TaskRecurrenceType,
} from "./task-recurrence";
import { updateTaskStatus } from "./task-actions";
import {
  TASK_BOARD_STATUSES,
  TASK_STATUS_BADGE_CLASSES,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  type TaskStatus,
} from "./task-status";

type TaskListItem = {
  id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  medicationName: string | null;
  dosage: string | null;
  doseAmount: number | null;
  doseUnit: MedicationUnit | null;
  instructions: string | null;
  status: TaskStatus;
  dueDate: string | null;
  createdAt: string;
  recurrenceType: TaskRecurrenceType;
  recurrenceInterval: number | null;
  recurrenceUnit: string | null;
  inventory: {
    currentStock: number;
    minimumStock: number;
    unit: MedicationUnit;
  } | null;
  patient: {
    id: string;
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

function getDueDateTimestamp(dueDate: string | null) {
  if (!dueDate) {
    return Number.POSITIVE_INFINITY;
  }

  return new Date(dueDate).getTime();
}

function formatDueDate(dueDate: string | null) {
  if (!dueDate) {
    return "No due date";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dueDate));
}

function isTaskOverdue(task: TaskListItem) {
  if (!task.dueDate) {
    return false;
  }

  if (task.status === "COMPLETED" || task.status === "DISCARDED") {
    return false;
  }

  return new Date(task.dueDate).getTime() < Date.now();
}

export function TaskList({ tasks }: TaskListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedPatientId, setSelectedPatientId] = useState("ALL");
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

  const patientOptions = optimisticTasks.reduce<
    Array<{ id: string; name: string }>
  >((patients, task) => {
    if (patients.some((patient) => patient.id === task.patient.id)) {
      return patients;
    }

    return [...patients, task.patient];
  }, []);

  const visibleTasks =
    selectedPatientId === "ALL"
      ? optimisticTasks
      : optimisticTasks.filter((task) => task.patient.id === selectedPatientId);

  const sortedVisibleTasks = [...visibleTasks].sort((left, right) => {
    const dueDateDifference =
      getDueDateTimestamp(left.dueDate) - getDueDateTimestamp(right.dueDate);

    if (dueDateDifference !== 0) {
      return dueDateDifference;
    }

    return (
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
    );
  });

  const tasksByStatus = {
    PENDING: sortedVisibleTasks.filter((task) => task.status === "PENDING"),
    IN_PROGRESS: sortedVisibleTasks.filter(
      (task) => task.status === "IN_PROGRESS"
    ),
    COMPLETED: sortedVisibleTasks.filter((task) => task.status === "COMPLETED"),
    DISCARDED: sortedVisibleTasks.filter((task) => task.status === "DISCARDED"),
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
    const overdue = isTaskOverdue(task);
    const recurrenceLabel = formatTaskRecurrence({
      recurrenceType: task.recurrenceType,
      recurrenceInterval: task.recurrenceInterval,
      recurrenceUnit: task.recurrenceUnit,
    });
    const isLowStock =
      task.inventory !== null &&
      task.inventory.currentStock <= task.inventory.minimumStock;

    return (
      <article
        key={task.id}
        className={`rounded-xl border bg-black/40 p-4 shadow-sm ${
          overdue
            ? "border-red-400/50 ring-1 ring-red-400/30"
            : "border-white/15"
        }`}
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
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${TASK_CATEGORY_BADGE_CLASSES[task.category]}`}
              >
                {TASK_CATEGORY_LABELS[task.category]}
              </span>
              <span
                className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide ${TASK_STATUS_BADGE_CLASSES[task.status]}`}
              >
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
            <h4 className="text-sm font-semibold leading-5 text-white">
              {task.title}
            </h4>
          </div>
        </div>

        <div className="space-y-2 text-sm text-white/80">
          <p>
            <strong className="text-white">Description:</strong>{" "}
            {task.description || "-"}
          </p>
          <p>
            <strong className="text-white">Patient:</strong> {task.patient.name}
          </p>
          <p className={overdue ? "text-red-200" : ""}>
            <strong className="text-white">Due:</strong> {formatDueDate(task.dueDate)}
          </p>
          <p>
            <strong className="text-white">Recurrence:</strong> {recurrenceLabel}
          </p>
          {task.category === "MEDICATION" ? (
            <>
              <p>
                <strong className="text-white">Medication:</strong>{" "}
                {task.medicationName || "-"}
              </p>
              <p>
                <strong className="text-white">Dose:</strong>{" "}
                {formatMedicationDose(task.doseAmount, task.doseUnit, task.dosage)}
              </p>
              <p>
                <strong className="text-white">Instructions:</strong>{" "}
                {task.instructions || "-"}
              </p>
              {task.inventory ? (
                <div
                  className={`rounded-lg border px-3 py-2 ${
                    isLowStock
                      ? "border-amber-400/30 bg-amber-400/10"
                      : "border-white/15 bg-white/5"
                  }`}
                >
                  <p className="text-xs uppercase tracking-wide text-white/55">
                    Inventario
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white">
                    Stock actual:{" "}
                    {formatMedicationDose(
                      task.inventory.currentStock,
                      task.inventory.unit
                    )}
                  </p>
                  <p className="mt-1 text-xs text-white/65">
                    Stock mínimo:{" "}
                    {formatMedicationDose(
                      task.inventory.minimumStock,
                      task.inventory.unit
                    )}
                  </p>
                </div>
              ) : (
                <p className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white/55">
                  Sin inventario registrado
                </p>
              )}
            </>
          ) : null}
        </div>

        {overdue ? (
          <p className="mt-3 rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-xs font-medium text-red-200">
            Overdue task
          </p>
        ) : null}

        {task.category === "MEDICATION" && isLowStock ? (
          <p className="mt-3 rounded border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-xs font-medium text-amber-200">
            Stock bajo
          </p>
        ) : null}

        <p className="mt-3 text-sm text-white/80">
          <strong className="text-white">Assigned to:</strong>{" "}
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
        className={`rounded-2xl border p-4 transition md:p-5 ${
          isActiveDropTarget
            ? "border-white/40 bg-white/10"
            : "border-white/15 bg-white/5"
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
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">{TASK_STATUS_LABELS[status]}</h3>
            <p className="text-xs text-white/55">Tasks in this stage</p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${TASK_STATUS_BADGE_CLASSES[status]}`}
          >
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
      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-white">Filter by patient</h3>
            <p className="text-xs text-white/55">
              Show tasks for one patient or view the full board
            </p>
          </div>

          <div className="w-full sm:max-w-xs">
            <label className="mb-2 block text-xs font-medium uppercase tracking-wide text-white/60">
              Patient
            </label>
            <select
              className="w-full rounded-xl border border-white/15 bg-black px-3 py-2 text-sm text-white"
              value={selectedPatientId}
              onChange={(event) => setSelectedPatientId(event.target.value)}
            >
              <option value="ALL">All patients</option>
              {patientOptions.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {TASK_BOARD_STATUSES.map(renderColumn)}
      </div>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold">
              {TASK_STATUS_LABELS.DISCARDED}
            </h3>
            <p className="text-xs text-white/55">Hidden from the main board</p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold ${TASK_STATUS_BADGE_CLASSES.DISCARDED}`}
          >
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
