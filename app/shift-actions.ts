'use server';

import { refresh } from "next/cache";

import { prisma } from "@/lib/db";
import { requireCurrentUser, requirePermission } from "@/lib/auth";
import { hasPermission, normalizeAppRole } from "@/lib/roles";

function parseShiftDate(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(`${value}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseShiftTime(value: FormDataEntryValue | null) {
  if (typeof value !== "string" || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hoursValue, minutesValue] = value.split(":");
  const hours = Number.parseInt(hoursValue, 10);
  const minutes = Number.parseInt(minutesValue, 10);

  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }

  return { hours, minutes };
}

function parseShiftWindow(formData: FormData) {
  const shiftDate = parseShiftDate(formData.get("shiftDate"));
  const startTime = parseShiftTime(formData.get("startTime"));
  const endTime = parseShiftTime(formData.get("endTime"));

  if (!shiftDate || !startTime || !endTime) {
    return null;
  }

  const startAt = new Date(shiftDate);
  startAt.setHours(startTime.hours, startTime.minutes, 0, 0);

  const endAt = new Date(shiftDate);
  endAt.setHours(endTime.hours, endTime.minutes, 0, 0);

  if (endAt <= startAt) {
    endAt.setDate(endAt.getDate() + 1);
  }

  return { startAt, endAt };
}

export async function createPlannedShift(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const userId = (formData.get("userId") as string) || "";
  const role = normalizeAppRole((formData.get("role") as string) || "");
  const notes = ((formData.get("notes") as string) || "").trim();
  const shiftWindow = parseShiftWindow(formData);

  if (!userId || !shiftWindow) {
    return;
  }

  await prisma.plannedShift.create({
    data: {
      userId,
      role,
      startAt: shiftWindow.startAt,
      endAt: shiftWindow.endAt,
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
  const notes = ((formData.get("notes") as string) || "").trim();
  const shiftWindow = parseShiftWindow(formData);

  if (!shiftId || !userId || !shiftWindow) {
    return;
  }

  await prisma.plannedShift.update({
    where: {
      id: shiftId,
    },
    data: {
      userId,
      role,
      startAt: shiftWindow.startAt,
      endAt: shiftWindow.endAt,
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
