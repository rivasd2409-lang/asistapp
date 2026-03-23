export const TASK_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
  "DISCARDED",
] as const;

export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_BOARD_STATUSES = [
  "PENDING",
  "IN_PROGRESS",
  "COMPLETED",
] as const;

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  DISCARDED: "Discarded",
};

export const TASK_STATUS_BADGE_CLASSES: Record<TaskStatus, string> = {
  PENDING: "border-amber-400/30 bg-amber-400/15 text-amber-200",
  IN_PROGRESS: "border-sky-400/30 bg-sky-400/15 text-sky-200",
  COMPLETED: "border-emerald-400/30 bg-emerald-400/15 text-emerald-200",
  DISCARDED: "border-rose-400/30 bg-rose-400/15 text-rose-200",
};

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function normalizeTaskStatus(value: string): TaskStatus {
  return isTaskStatus(value) ? value : "PENDING";
}
