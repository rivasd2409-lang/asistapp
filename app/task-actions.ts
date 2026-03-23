'use server';

import { refresh } from "next/cache";

import { prisma } from "@/lib/db";

import { isTaskStatus, type TaskStatus } from "./task-status";

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  if (!taskId || !isTaskStatus(status)) {
    throw new Error("Invalid task status update.");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { status },
  });

  refresh();
}
