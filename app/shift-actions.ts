'use server';

import { refresh } from "next/cache";

import { prisma } from "@/lib/db";
import { requireCurrentUser, requirePermission } from "@/lib/auth";
import { hasPermission, normalizeAppRole } from "@/lib/roles";

function parseDateTime(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function createPlannedShift(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const userId = (formData.get("userId") as string) || "";
  const role = normalizeAppRole((formData.get("role") as string) || "");
  const startAt = parseDateTime(formData.get("startAt"));
  const endAt = parseDateTime(formData.get("endAt"));
  const notes = ((formData.get("notes") as string) || "").trim();

  if (!userId || !startAt || !endAt || endAt <= startAt) {
    return;
  }

  await prisma.plannedShift.create({
    data: {
      userId,
      role,
      startAt,
      endAt,
      notes: notes || null,
    },
  });

  refresh();
}

export async function updatePlannedShift(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const shiftId = (formData.get("shiftId") as string) || "";
  const userId = (formData.get("userId") as string) || "";
  const role = normalizeAppRole((formData.get("role") as string) || "");
  const startAt = parseDateTime(formData.get("startAt"));
  const endAt = parseDateTime(formData.get("endAt"));
  const notes = ((formData.get("notes") as string) || "").trim();

  if (!shiftId || !userId || !startAt || !endAt || endAt <= startAt) {
    return;
  }

  await prisma.plannedShift.update({
    where: {
      id: shiftId,
    },
    data: {
      userId,
      role,
      startAt,
      endAt,
      notes: notes || null,
    },
  });

  refresh();
}

export async function deletePlannedShift(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const shiftId = (formData.get("shiftId") as string) || "";

  if (!shiftId) {
    return;
  }

  await prisma.plannedShift.delete({
    where: {
      id: shiftId,
    },
  });

  refresh();
}

export async function startShiftAttendance(formData: FormData) {
  const user = await requireCurrentUser();

  if (!hasPermission(user.role, "mark_shift")) {
    return;
  }

  const plannedShiftId = ((formData.get("plannedShiftId") as string) || "").trim();
  const notes = ((formData.get("notes") as string) || "").trim();

  const activeAttendance = await prisma.shiftAttendance.findFirst({
    where: {
      userId: user.id,
      endedAt: null,
    },
  });

  if (activeAttendance) {
    return;
  }

  if (plannedShiftId) {
    const plannedShift = await prisma.plannedShift.findUnique({
      where: {
        id: plannedShiftId,
      },
    });

    if (!plannedShift || plannedShift.userId !== user.id) {
      return;
    }
  }

  await prisma.shiftAttendance.create({
    data: {
      plannedShiftId: plannedShiftId || null,
      userId: user.id,
      startedAt: new Date(),
      notes: notes || null,
    },
  });

  refresh();
}

export async function endShiftAttendance(formData: FormData) {
  const user = await requireCurrentUser();

  if (!hasPermission(user.role, "mark_shift")) {
    return;
  }

  const attendanceId = ((formData.get("attendanceId") as string) || "").trim();
  const notes = ((formData.get("notes") as string) || "").trim();

  const attendance = await prisma.shiftAttendance.findFirst({
    where: attendanceId
      ? {
          id: attendanceId,
          userId: user.id,
          endedAt: null,
        }
      : {
          userId: user.id,
          endedAt: null,
        },
    orderBy: {
      startedAt: "desc",
    },
  });

  if (!attendance) {
    return;
  }

  await prisma.shiftAttendance.update({
    where: {
      id: attendance.id,
    },
    data: {
      endedAt: new Date(),
      notes: notes || attendance.notes,
    },
  });

  refresh();
}
