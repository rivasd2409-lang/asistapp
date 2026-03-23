import { prisma } from "@/lib/db";

import { formatMedicationDose, normalizeMedicationUnit } from "@/app/medication-units";
import { normalizeTaskCategory } from "@/app/task-category";
import { normalizeTaskRecurrenceType } from "@/app/task-recurrence";
import { normalizeTaskStatus } from "@/app/task-status";

export async function getAppData() {
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  const [users, groups, patients, members, tasks, inventoryItems] =
    await Promise.all([
      prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.group.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.findMany({
        orderBy: { createdAt: "desc" },
      }),
      prisma.groupMember.findMany({
        include: {
          user: true,
          group: true,
        },
        orderBy: {
          id: "desc",
        },
      }),
      prisma.task.findMany({
        include: {
          patient: true,
          assignedMember: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
      prisma.medicationInventory.findMany({
        include: {
          patient: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      }),
    ]);

  const normalizedTasks = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    category: normalizeTaskCategory(task.category),
    recurrenceType: normalizeTaskRecurrenceType(task.recurrenceType),
    doseUnit: task.doseUnit ? normalizeMedicationUnit(task.doseUnit) : null,
    status: normalizeTaskStatus(task.status),
  }));

  const normalizedInventoryItems = inventoryItems.map((item) => ({
    ...item,
    displayUnit: normalizeMedicationUnit(item.unit) ?? "TABLET",
  }));

  const normalizedTasksWithInventory = normalizedTasks.map((task) => {
    if (task.category !== "MEDICATION" || !task.medicationName) {
      return {
        ...task,
        inventory: null,
      };
    }

    const matchingInventoryItem = normalizedInventoryItems.find(
      (item) =>
        item.patientId === task.patientId &&
        item.medicationName === task.medicationName
    );

    return {
      ...task,
      inventory: matchingInventoryItem
        ? {
            currentStock: matchingInventoryItem.currentStock,
            minimumStock: matchingInventoryItem.minimumStock,
            unit: matchingInventoryItem.displayUnit,
          }
        : null,
    };
  });

  const attentionAlerts = [
    ...normalizedInventoryItems
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
    ...normalizedTasksWithInventory
      .filter((task) => {
        if (!task.dueDate) return false;
        if (task.status === "COMPLETED" || task.status === "DISCARDED") {
          return false;
        }

        const dueDate = new Date(task.dueDate);

        return dueDate >= now && dueDate <= next24Hours;
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

  const notificationItems = [
    ...normalizedInventoryItems
      .filter((item) => item.currentStock <= item.minimumStock)
      .map((item) => ({
        id: `low-stock-${item.id}`,
        kind: "low_stock" as const,
        message: `${item.medicationName} tiene bajo stock (${formatMedicationDose(
          item.currentStock,
          item.displayUnit
        )})`,
      })),
    ...normalizedTasksWithInventory
      .filter((task) => {
        if (!task.dueDate) return false;
        if (task.status === "COMPLETED" || task.status === "DISCARDED") {
          return false;
        }

        const dueDate = new Date(task.dueDate);

        return dueDate >= now && dueDate <= next2Hours;
      })
      .map((task) => ({
        id: `task-due-${task.id}`,
        kind: "task_due_soon" as const,
        message: `Hora de dar ${task.title} a ${task.patient.name} (${new Intl.DateTimeFormat(
          "en-US",
          {
            hour: "numeric",
            minute: "2-digit",
          }
        ).format(new Date(task.dueDate as string))})`,
      })),
  ];

  return {
    users,
    groups,
    patients,
    members,
    tasks: normalizedTasksWithInventory,
    inventoryItems: normalizedInventoryItems,
    attentionAlerts,
    notificationItems,
    summary: {
      users: users.length,
      groups: groups.length,
      patients: patients.length,
      tasks: normalizedTasksWithInventory.length,
      inventoryItems: normalizedInventoryItems.length,
    },
  };
}
