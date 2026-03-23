'use server';

import { refresh } from "next/cache";

import { prisma } from "@/lib/db";

import {
  getNextOccurrenceDueDate,
  normalizeTaskRecurrenceType,
} from "./task-recurrence";
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
