export const TASK_RECURRENCE_TYPES = [
  "NONE",
  "DAILY",
  "WEEKLY",
  "CUSTOM",
] as const;

export type TaskRecurrenceType = (typeof TASK_RECURRENCE_TYPES)[number];

export const TASK_CUSTOM_RECURRENCE_UNITS = ["DAYS", "HOURS"] as const;

export type TaskCustomRecurrenceUnit =
  (typeof TASK_CUSTOM_RECURRENCE_UNITS)[number];

export function isTaskRecurrenceType(
  value: string
): value is TaskRecurrenceType {
  return TASK_RECURRENCE_TYPES.includes(value as TaskRecurrenceType);
}

export function normalizeTaskRecurrenceType(value: string): TaskRecurrenceType {
  return isTaskRecurrenceType(value) ? value : "NONE";
}

export function isTaskCustomRecurrenceUnit(
  value: string
): value is TaskCustomRecurrenceUnit {
  return TASK_CUSTOM_RECURRENCE_UNITS.includes(
    value as TaskCustomRecurrenceUnit
  );
}

export function formatTaskRecurrence(options: {
  recurrenceType: TaskRecurrenceType;
  recurrenceInterval: number | null;
  recurrenceUnit: string | null;
}) {
  if (options.recurrenceType === "NONE") {
    return "Una vez";
  }

  if (options.recurrenceType === "DAILY") {
    return "Diaria";
  }

  if (options.recurrenceType === "WEEKLY") {
    return "Semanal";
  }

  if (
    options.recurrenceType === "CUSTOM" &&
    options.recurrenceInterval &&
    options.recurrenceInterval > 0 &&
    options.recurrenceUnit &&
    isTaskCustomRecurrenceUnit(options.recurrenceUnit)
  ) {
    const unit = options.recurrenceUnit === "DAYS" ? "día" : "hora";
    const plural = options.recurrenceInterval === 1 ? unit : `${unit}s`;

    return `Cada ${options.recurrenceInterval} ${plural}`;
  }

  return "Personalizada";
}

export function getNextOccurrenceDueDate(options: {
  dueDate: Date | null;
  recurrenceType: TaskRecurrenceType;
  recurrenceInterval: number | null;
  recurrenceUnit: string | null;
}) {
  if (options.recurrenceType === "NONE") {
    return null;
  }

  const baseDate = options.dueDate ?? new Date();
  const nextDate = new Date(baseDate);

  if (options.recurrenceType === "DAILY") {
    nextDate.setDate(nextDate.getDate() + 1);
    return nextDate;
  }

  if (options.recurrenceType === "WEEKLY") {
    nextDate.setDate(nextDate.getDate() + 7);
    return nextDate;
  }

  if (
    options.recurrenceType === "CUSTOM" &&
    options.recurrenceInterval &&
    options.recurrenceInterval > 0 &&
    options.recurrenceUnit &&
    isTaskCustomRecurrenceUnit(options.recurrenceUnit)
  ) {
    if (options.recurrenceUnit === "DAYS") {
      nextDate.setDate(nextDate.getDate() + options.recurrenceInterval);
      return nextDate;
    }

    nextDate.setHours(nextDate.getHours() + options.recurrenceInterval);
    return nextDate;
  }

  return null;
}
