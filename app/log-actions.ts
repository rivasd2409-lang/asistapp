'use server';

import { refresh } from "next/cache";

import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/roles";

import { type LogEntryFormState } from "./log-entry-form-state";
import {
  isLogEntryCategory,
  normalizeLogEntryPriority,
} from "./logbook";

export async function createLogEntry(
  _state: LogEntryFormState,
  formData: FormData
): Promise<LogEntryFormState> {
  const user = await requireCurrentUser();

  if (!hasPermission(user.role, "create_log_entries")) {
    return {
      status: "error",
      message: "No tienes permiso para registrar entradas en la bitácora.",
      errors: {},
    };
  }

  const patientId = ((formData.get("patientId") as string) || "").trim();
  const categoryValue = ((formData.get("category") as string) || "").trim();
  const note = ((formData.get("note") as string) || "").trim();
  const priorityValue = ((formData.get("priority") as string) || "").trim();

  const errors: LogEntryFormState["errors"] = {};

  if (!patientId) {
    errors.patientId = "Selecciona un paciente.";
  }

  if (!isLogEntryCategory(categoryValue)) {
    errors.category = "Selecciona una categoría válida.";
  }

  if (!note) {
    errors.note = "Escribe una observación.";
  }

  const priority = normalizeLogEntryPriority(priorityValue);

  if (priorityValue && !priority) {
    errors.priority = "Selecciona una prioridad válida.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisa los campos marcados e inténtalo de nuevo.",
      errors,
    };
  }

  const activeAttendance = await prisma.shiftAttendance.findFirst({
    where: {
      userId: user.id,
      endedAt: null,
    },
    orderBy: {
      startedAt: "desc",
    },
  });

  await prisma.logEntry.create({
    data: {
      patientId,
      userId: user.id,
      shiftAttendanceId: activeAttendance?.id || null,
      category: categoryValue,
      note,
      priority,
    },
  });

  refresh();

  return {
    status: "success",
    message: activeAttendance
      ? "Entrada guardada y vinculada al turno activo."
      : "Entrada guardada correctamente.",
    errors: {},
  };
}
