'use server';

import { refresh } from "next/cache";

import { prisma } from "@/lib/db";

import { normalizeMedicationUnit } from "./medication-units";
import {
  getNextOccurrenceDueDate,
  normalizeTaskRecurrenceType,
} from "./task-recurrence";
import { normalizeTaskCategory } from "./task-category";
import { isTaskStatus, type TaskStatus } from "./task-status";

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  if (!taskId || !isTaskStatus(status)) {
    throw new Error("Invalid task status update.");
  }

  await prisma.$transaction(async (tx) => {
    const currentTask = await tx.task.findUnique({
      where: { id: taskId },
    });

    if (!currentTask) {
      throw new Error("Task not found.");
    }

    const recurrenceType = normalizeTaskRecurrenceType(
      currentTask.recurrenceType
    );
    const category = normalizeTaskCategory(currentTask.category);
    const now = new Date();

    const updatedTask = await tx.task.update({
      where: { id: taskId },
      data: {
        status,
        completedAt: status === "COMPLETED" ? now : null,
      },
    });

    const shouldCreateNextOccurrence =
      status === "COMPLETED" &&
      currentTask.status !== "COMPLETED" &&
      recurrenceType !== "NONE" &&
      !currentTask.nextOccurrenceTaskId;

    const shouldDecrementInventory =
      status === "COMPLETED" &&
      currentTask.status !== "COMPLETED" &&
      category === "MEDICATION" &&
      !!currentTask.medicationName;

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
