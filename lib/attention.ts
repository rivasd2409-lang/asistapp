import { formatMedicationDose } from "@/app/medication-units";

type AttentionTask = {
  id: string;
  title: string;
  dueDate: string | null;
  status: string;
  patient: {
    name: string;
  };
};

type AttentionInventoryItem = {
  id: string;
  medicationName: string;
  currentStock: number;
  minimumStock: number;
  displayUnit: string;
};

type BuildAttentionInput = {
  now: Date;
  upcomingHours: number;
  tasks: AttentionTask[];
  inventoryItems: AttentionInventoryItem[];
};

export function buildAttentionAlerts({
  now,
  upcomingHours,
  tasks,
  inventoryItems,
}: BuildAttentionInput) {
  const upcomingDeadline = new Date(now.getTime() + upcomingHours * 60 * 60 * 1000);

  return [
    ...inventoryItems
      .filter((item) => item.currentStock <= item.minimumStock)
      .map((item) => ({
        id: `inventory-${item.id}`,
        tone: "danger" as const,
        sortKey: 1,
        timestamp: 0,
        message: `${item.medicationName} tiene bajo stock (${formatMedicationDose(
          item.currentStock,
          item.displayUnit
        )})`,
      })),
    ...tasks
      .filter((task) => {
        if (!task.dueDate) return false;
        if (task.status === "COMPLETED" || task.status === "DISCARDED") {
          return false;
        }

        const dueDate = new Date(task.dueDate);

        return dueDate >= now && dueDate <= upcomingDeadline;
      })
      .map((task) => ({
        id: `task-${task.id}`,
        tone: "warning" as const,
        sortKey: 2,
        timestamp: new Date(task.dueDate as string).getTime(),
        message: `${task.title} - próxima dosis ${new Intl.DateTimeFormat(
          "es-HN",
          {
            dateStyle: "medium",
            timeStyle: "short",
          }
        ).format(new Date(task.dueDate as string))}`,
      })),
  ].sort((left, right) => {
    if (left.sortKey !== right.sortKey) {
      return left.sortKey - right.sortKey;
    }

    return left.timestamp - right.timestamp;
  });
}

export function buildNotificationItems({
  now,
  upcomingHours,
  tasks,
  inventoryItems,
}: BuildAttentionInput) {
  const upcomingDeadline = new Date(now.getTime() + upcomingHours * 60 * 60 * 1000);

  return [
    ...inventoryItems
      .filter((item) => item.currentStock <= item.minimumStock)
      .map((item) => ({
        id: `low-stock-${item.id}`,
        kind: "low_stock" as const,
        message: `${item.medicationName} tiene bajo stock (${formatMedicationDose(
          item.currentStock,
          item.displayUnit
        )})`,
      })),
    ...tasks
      .filter((task) => {
        if (!task.dueDate) return false;
        if (task.status === "COMPLETED" || task.status === "DISCARDED") {
          return false;
        }

        const dueDate = new Date(task.dueDate);

        return dueDate >= now && dueDate <= upcomingDeadline;
      })
      .map((task) => ({
        id: `task-due-${task.id}`,
        kind: "task_due_soon" as const,
        message: `Hora de dar ${task.title} a ${task.patient.name} (${new Intl.DateTimeFormat(
          "es-HN",
          {
            hour: "numeric",
            minute: "2-digit",
          }
        ).format(new Date(task.dueDate as string))})`,
      })),
  ];
}
