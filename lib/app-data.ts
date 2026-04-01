import { prisma } from "@/lib/db";

import { getCurrentUser } from "@/lib/auth";
import { normalizeMedicationUnit } from "@/app/medication-units";
import { normalizeTaskCategory } from "@/app/task-category";
import { normalizeTaskRecurrenceType } from "@/app/task-recurrence";
import { normalizeTaskStatus } from "@/app/task-status";
import { normalizeVitalSignType } from "@/app/vital-signs";
import { buildAttentionAlerts, buildNotificationItems } from "./attention";
import { hasPermission, isAssignedCareRole } from "./roles";

export async function getAppData() {
  const currentUser = await getCurrentUser();
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const isAssignedOnlyScope = currentUser
    ? isAssignedCareRole(currentUser.role)
    : false;
  const canManageFamilyWorkspace = hasPermission(
    currentUser?.role || "",
    "manage_family_workspace"
  );

  const [users, groups, patients, members, tasks, inventoryItems, vitalSigns] =
    await Promise.all([
      canManageFamilyWorkspace
        ? prisma.user.findMany({
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      canManageFamilyWorkspace
        ? prisma.group.findMany({
            orderBy: { createdAt: "desc" },
          })
        : Promise.resolve([]),
      prisma.patient.findMany({
        include: {
          group: true,
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.groupMember.findMany({
        where: {
          user: {
            isActive: true,
          },
        },
        include: {
          user: true,
          group: true,
        },
        orderBy: {
          id: "desc",
        },
      }),
      prisma.task.findMany({
        where:
          isAssignedOnlyScope && currentUser
            ? {
                assignedMember: {
                  userId: currentUser.id,
                },
              }
            : undefined,
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
      prisma.vitalSign.findMany({
        include: {
          patient: true,
        },
        orderBy: {
          recordedAt: "desc",
        },
      }),
    ]);

  const normalizedPatients = patients.map((patient) => ({
    ...patient,
    createdAt: patient.createdAt.toISOString(),
    group: patient.group
      ? {
          id: patient.group.id,
          name: patient.group.name,
          createdAt: patient.group.createdAt.toISOString(),
        }
      : null,
  }));

  const normalizedTasks = tasks.map((task) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
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

  const normalizedVitalSigns = vitalSigns.map((record) => ({
    ...record,
    type: normalizeVitalSignType(record.type),
    recordedAt: record.recordedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
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

  const visiblePatientIds = new Set(
    normalizedTasksWithInventory.map((task) => task.patientId)
  );
  const filteredPatients = isAssignedOnlyScope
    ? normalizedPatients.filter((patient) => visiblePatientIds.has(patient.id))
    : normalizedPatients;
  const filteredInventoryItems = isAssignedOnlyScope
    ? normalizedInventoryItems.filter((item) => visiblePatientIds.has(item.patientId))
    : normalizedInventoryItems;
  const filteredVitalSigns = isAssignedOnlyScope
    ? normalizedVitalSigns.filter((record) => visiblePatientIds.has(record.patientId))
    : normalizedVitalSigns;
  const filteredMembers = canManageFamilyWorkspace
    ? members
    : members.filter((member) => member.userId === currentUser?.id);

  const attentionAlerts = buildAttentionAlerts({
    now,
    upcomingHours: (next24Hours.getTime() - now.getTime()) / (60 * 60 * 1000),
    tasks: normalizedTasksWithInventory,
    inventoryItems: filteredInventoryItems,
  });

  const notificationItems = buildNotificationItems({
    now,
    upcomingHours: (next2Hours.getTime() - now.getTime()) / (60 * 60 * 1000),
    tasks: normalizedTasksWithInventory,
    inventoryItems: filteredInventoryItems,
  });

  return {
    users,
    groups,
    patients: filteredPatients,
    members: filteredMembers,
    tasks: normalizedTasksWithInventory,
    inventoryItems: filteredInventoryItems,
    vitalSigns: filteredVitalSigns,
    attentionAlerts,
    notificationItems,
    viewer: currentUser,
    summary: {
      users: users.length,
      groups: groups.length,
      patients: filteredPatients.length,
      tasks: normalizedTasksWithInventory.length,
      inventoryItems: filteredInventoryItems.length,
      vitalSigns: filteredVitalSigns.length,
    },
  };
}
