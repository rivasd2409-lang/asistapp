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

export function isTaskStatus(value: string): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}

export function normalizeTaskStatus(value: string): TaskStatus {
  return isTaskStatus(value) ? value : "PENDING";
}
