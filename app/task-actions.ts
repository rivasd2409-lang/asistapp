'use server';

import { refresh } from "next/cache";
import { type Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { requireCurrentUser } from "@/lib/auth";
import { hasPermission, isAssignedCareRole } from "@/lib/roles";

import { normalizeMedicationUnit } from "./medication-units";
import {
  getNextOccurrenceDueDate,
  normalizeTaskRecurrenceType,
} from "./task-recurrence";
import { normalizeTaskCategory } from "./task-category";
import { isTaskStatus, type TaskStatus } from "./task-status";

type TaskStatusUpdateOptions = {
  administeredByMemberId?: string | null;
  recordedByMemberId?: string | null;
};

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  options?: TaskStatusUpdateOptions
) {
  const currentUser = await requireCurrentUser();

  if (!hasPermission(currentUser.role, "update_task_status")) {
    throw new Error("No autorizado para actualizar tareas.");
  }

  if (!taskId || !isTaskStatus(status)) {
    throw new Error("Invalid task status update.");
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const currentTask = await tx.task.findUnique({
      where: { id: taskId },
      include: {
        assignedMember: true,
        patient: {
          select: {
            groupId: true,
          },
        },
      },
    });

    if (!currentTask) {
      throw new Error("Task not found.");
    }

    const recurrenceType = normalizeTaskRecurrenceType(
      currentTask.recurrenceType
    );
    const category = normalizeTaskCategory(currentTask.category);
    const now = new Date();
    const currentGroupMember = await tx.groupMember.findFirst({
      where: {
        userId: currentUser.id,
        groupId: currentTask.patient.groupId,
      },
    });

    if (isAssignedCareRole(currentUser.role)) {
      if (currentTask.assignedMemberId) {
        if (currentTask.assignedMember?.userId !== currentUser.id) {
          throw new Error("No autorizado para esta tarea.");
        }
      } else {
        if (!currentGroupMember) {
          throw new Error("No autorizado para esta tarea.");
        }

        if (currentUser.role === "APOYO_DOMESTICO" && category === "MEDICATION") {
          throw new Error("No autorizado para completar esta tarea.");
        }
      }
    }

    const completionMemberId =
      status === "COMPLETED"
        ? options?.administeredByMemberId || currentGroupMember?.id || null
        : null;

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? now : null,
        completedByMemberId: completionMemberId,
      },
    });

    const shouldCreateNextOccurrence =
      status === "COMPLETED" &&
      currentTask.status !== "COMPLETED" &&
      recurrenceType !== "NONE" &&
      !currentTask.nextOccurrenceTaskId;

    const shouldCreateMedicationAdministration =
      status === "COMPLETED" &&
      currentTask.status !== "COMPLETED" &&
      category === "MEDICATION" &&
      !!currentTask.medicationName;

    const shouldDecrementInventory =
      status === "COMPLETED" &&
      currentTask.status !== "COMPLETED" &&
      category === "MEDICATION" &&
      !!currentTask.medicationName;

    if (shouldCreateMedicationAdministration) {
      await tx.medicationAdministration.create({
        data: {
          taskId: currentTask.id,
          patientId: currentTask.patientId,
          medicationName: currentTask.medicationName as string,
          dosage: currentTask.dosage,
          instructions: currentTask.instructions,
          administeredAt: now,
          administeredByMemberId: completionMemberId,
          recordedByMemberId:
            options?.recordedByMemberId || currentGroupMember?.id || null,
          notes: null,
        },
      });
    }

    if (shouldDecrementInventory) {
      const medicationName = currentTask.medicationName;

      if (!medicationName) {
        return updatedTask;
      }

      const inventoryItem = await tx.medicationInventory.findFirst({
        where: {
          patientId: currentTask.patientId,
          medicationName,
        },
        orderBy: {
          createdAt: "desc",
        },
      });

      if (inventoryItem) {
        const inventoryUnit = normalizeMedicationUnit(inventoryItem.unit);
        const doseUnit = currentTask.doseUnit
          ? normalizeMedicationUnit(currentTask.doseUnit)
          : null;
        const decrementAmount =
          currentTask.doseAmount &&
          Number.isFinite(currentTask.doseAmount) &&
          currentTask.doseAmount > 0
            ? currentTask.doseAmount
            : null;

        if (!inventoryUnit || !doseUnit || !decrementAmount) {
          return updatedTask;
        }

        if (inventoryUnit !== doseUnit) {
          return updatedTask;
        }

        await tx.medicationInventory.update({
          where: { id: inventoryItem.id },
          data: {
            currentStock: Math.max(0, inventoryItem.currentStock - decrementAmount),
          },
        });
      }
    }

    if (!shouldCreateNextOccurrence) {
      return updatedTask;
    }

    const nextDueDate = getNextOccurrenceDueDate({
      dueDate: currentTask.dueDate,
      recurrenceType,
      recurrenceInterval: currentTask.recurrenceInterval,
      recurrenceUnit: currentTask.recurrenceUnit,
    });

    const nextTask = await tx.task.create({
      data: {
        title: currentTask.title,
        description: currentTask.description,
        status: "PENDING",
        category,
        medicationName: currentTask.medicationName,
        dosage: currentTask.dosage,
        doseAmount: currentTask.doseAmount,
        doseUnit: currentTask.doseUnit,
        instructions: currentTask.instructions,
        dueDate: nextDueDate,
        recurrenceType: currentTask.recurrenceType,
        recurrenceInterval: currentTask.recurrenceInterval,
        recurrenceUnit: currentTask.recurrenceUnit,
        patientId: currentTask.patientId,
        assignedMemberId: currentTask.assignedMemberId,
      },
    });

    await tx.task.update({
      where: { id: taskId },
      data: {
        nextOccurrenceTaskId: nextTask.id,
      },
    });

    return updatedTask;
  });

  refresh();
}
