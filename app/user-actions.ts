'use server';

import { refresh } from "next/cache";
import { type Prisma } from "@prisma/client";

import { hashPassword, requireCurrentUser, requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { APP_ROLES, normalizeAppRole } from "@/lib/roles";

import { type UserManagementFormState } from "./user-management-form-state";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createManagedUser(
  _state: UserManagementFormState,
  formData: FormData
): Promise<UserManagementFormState> {
  await requirePermission("manage_family_workspace");

  const name = ((formData.get("name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";
  const roleValue = ((formData.get("role") as string) || "").trim();
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const role = normalizeAppRole(roleValue);
  const isActive = ((formData.get("isActive") as string) || "true") === "true";

  const errors: UserManagementFormState["errors"] = {};

  if (!name) {
    errors.name = "Ingresa el nombre del colaborador.";
  }

  if (!email || !isValidEmail(email)) {
    errors.email = "Ingresa un correo válido.";
  }

  if (!password || password.length < 8) {
    errors.password = "La contraseña debe tener al menos 8 caracteres.";
  }

  if (!APP_ROLES.includes(role)) {
    errors.role = "Selecciona un rol válido.";
  }

  const existingGroups = await prisma.group.findMany({
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  if (existingGroups.length > 0 && !groupId) {
    errors.groupId = "Selecciona un grupo para vincular al colaborador.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisa los campos marcados e inténtalo de nuevo.",
      errors,
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return {
      status: "error",
      message: "Ya existe un usuario con ese correo.",
      errors: {
        email: "Ese correo ya está registrado.",
      },
    };
  }

  const passwordHash = hashPassword(password);

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const createdUser = await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        role,
        isActive,
      },
    });

    if (groupId) {
      await tx.groupMember.create({
        data: {
          userId: createdUser.id,
          groupId,
          role,
        },
      });
    }
  });

  refresh();

  return {
    status: "success",
    message: "Usuario creado correctamente.",
    errors: {},
  };
}

export async function updateManagedUser(formData: FormData) {
  const currentUser = await requireCurrentUser();

  if (currentUser.role !== "ADMIN_FAMILIA") {
    return;
  }

  const userId = ((formData.get("userId") as string) || "").trim();
  const role = normalizeAppRole(((formData.get("role") as string) || "").trim());
  const isActive = ((formData.get("isActive") as string) || "true") === "true";

  if (!userId) {
    return;
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!targetUser) {
    return;
  }

  if (currentUser.id === userId && !isActive) {
    return;
  }

  const wouldRemoveAdmin =
    targetUser.role === "ADMIN_FAMILIA" &&
    (role !== "ADMIN_FAMILIA" || !isActive);

  if (wouldRemoveAdmin) {
    const activeAdminCount = await prisma.user.count({
      where: {
        role: "ADMIN_FAMILIA",
        isActive: true,
      },
    });

    if (activeAdminCount <= 1) {
      return;
    }
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        role,
        isActive,
      },
    });

    await tx.groupMember.updateMany({
      where: {
        userId,
      },
      data: {
        role,
      },
    });

    if (!isActive) {
      await tx.session.deleteMany({
        where: {
          userId,
        },
      });
    }
  });

  refresh();
}
