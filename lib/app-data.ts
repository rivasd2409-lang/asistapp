import { prisma } from "@/lib/db";

import { getCurrentUser } from "@/lib/auth";
import { normalizeMedicationUnit } from "@/app/medication-units";
import { normalizeTaskCategory } from "@/app/task-category";
import { normalizeTaskRecurrenceType } from "@/app/task-recurrence";
import { normalizeTaskStatus } from "@/app/task-status";
import { normalizeVitalSignType } from "@/app/vital-signs";
import { buildAttentionAlerts, buildNotificationItems } from "./attention";
import { hasPermission, isAssignedCareRole } from "./roles";

type CurrentUserGroupMembership = {
  id: string;
  groupId: string;
};

type AppDataPatientItem = {
  id: string;
  name: string;
  age: number;
  dni: string | null;
  clinicalSummary: string | null;
  criticalMedications: string | null;
  emergencyAlerts: string | null;
  triageMessage: string | null;
  emergencyContacts: string | null;
  groupId: string;
  createdAt: Date;
  group: {
    id: string;
    name: string;
    createdAt: Date;
  } | null;
};

type AppDataMemberItem = {
  id: string;
  userId: string;
  groupId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  };
  group: {
    id: string;
    name: string;
    createdAt: Date;
  };
};

type AppDataTaskItem = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  category: string;
  medicationName: string | null;
  dosage: string | null;
  doseAmount: number | null;
  doseUnit: string | null;
  instructions: string | null;
  dueDate: Date | null;
  recurrenceType: string;
  recurrenceInterval: number | null;
  recurrenceUnit: string | null;
  completedAt: Date | null;
  patientId: string;
  assignedMemberId: string | null;
  createdAt: Date;
  patient: {
    id: string;
    name: string;
  };
  assignedMember: {
    id: string;
    user: {
      name: string;
    };
  } | null;
  completedByMember: {
    id: string;
    user: {
      name: string;
    };
  } | null;
};

type AppDataInventoryItem = {
  id: string;
  medicationName: string;
  unit: string;
  currentStock: number;
  minimumStock: number;
  notes: string | null;
  patientId: string;
  createdAt: Date;
  patient: {
    id: string;
    name: string;
  };
};

type AppDataVitalSignItem = {
  id: string;
  patientId: string;
  type: string;
  value: string;
  unit: string;
  notes: string | null;
  recordedAt: Date;
  createdAt: Date;
  patient: {
    id: string;
    name: string;
  };
};

export async function getAppData() {
  const currentUser = await getCurrentUser();
  const now = new Date();
  const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const next2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);
  const isCareRole = currentUser ? isAssignedCareRole(currentUser.role) : false;
  const canManageFamilyWorkspace = hasPermission(
    currentUser?.role || "",
    "manage_family_workspace"
  );
  const currentUserGroupMemberships = currentUser
    ? await prisma.groupMember.findMany({
        where: {
          userId: currentUser.id,
        },
        select: {
          id: true,
          groupId: true,
        },
      })
    : [];
  const typedCurrentUserGroupMemberships =
    currentUserGroupMemberships as CurrentUserGroupMembership[];
  const currentUserGroupIds = typedCurrentUserGroupMemberships.map(
    (membership: CurrentUserGroupMembership) => membership.groupId
  );
  const taskScopeWhere =
    isCareRole && currentUser
      ? {
          OR: [
            {
              assignedMember: {
                userId: currentUser.id,
              },
            },
            {
              assignedMemberId: null,
              patient: {
                groupId: {
                  in: currentUserGroupIds,
                },
              },
              ...(currentUser.role === "APOYO_DOMESTICO"
                ? {
                    category: {
                      not: "MEDICATION",
                    },
                  }
                : {}),
            },
          ],
        }
      : undefined;

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
        where: taskScopeWhere,
        include: {
          patient: true,
          assignedMember: {
            include: {
              user: true,
            },
          },
          completedByMember: {
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
  const typedPatients = patients as AppDataPatientItem[];
  const typedMembers = members as AppDataMemberItem[];
  const typedTasks = tasks as AppDataTaskItem[];
  const typedInventoryItems = inventoryItems as AppDataInventoryItem[];
  const typedVitalSigns = vitalSigns as AppDataVitalSignItem[];

  const normalizedPatients = typedPatients.map((patient: AppDataPatientItem) => ({
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

  const normalizedTasks = typedTasks.map((task: AppDataTaskItem) => ({
    ...task,
    dueDate: task.dueDate?.toISOString() ?? null,
    completedAt: task.completedAt?.toISOString() ?? null,
    createdAt: task.createdAt.toISOString(),
    category: normalizeTaskCategory(task.category),
    recurrenceType: normalizeTaskRecurrenceType(task.recurrenceType),
    doseUnit: task.doseUnit ? normalizeMedicationUnit(task.doseUnit) : null,
    status: normalizeTaskStatus(task.status),
  }));

  const normalizedInventoryItems = typedInventoryItems.map((item: AppDataInventoryItem) => ({
    ...item,
    displayUnit: normalizeMedicationUnit(item.unit) ?? "TABLET",
  }));

  const normalizedVitalSigns = typedVitalSigns.map((record: AppDataVitalSignItem) => ({
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
  const filteredPatients = isCareRole
    ? normalizedPatients.filter((patient) => visiblePatientIds.has(patient.id))
    : normalizedPatients;
  const filteredInventoryItems = isCareRole
    ? normalizedInventoryItems.filter((item) => visiblePatientIds.has(item.patientId))
    : normalizedInventoryItems;
  const filteredVitalSigns = isCareRole
    ? normalizedVitalSigns.filter((record) => visiblePatientIds.has(record.patientId))
    : normalizedVitalSigns;
  const filteredMembers = canManageFamilyWorkspace
    ? members
    : typedMembers.filter((member: AppDataMemberItem) => member.userId === currentUser?.id);

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
