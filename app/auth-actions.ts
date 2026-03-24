'use server';

import { redirect } from "next/navigation";

import { prisma } from "@/lib/db";
import {
  clearUserSession,
  createUserSession,
  hashPassword,
  hasCredentialedUsers,
  verifyPassword,
} from "@/lib/auth";

import { type AuthFormState } from "./auth-form-state";

export async function signIn(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";

  if (!email || !password) {
    return {
      status: "error",
      message: "Ingresa tu correo y contraseña.",
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (user && !user.isActive) {
    return {
      status: "error",
      message: "Tu usuario está inactivo. Contacta al administrador de la familia.",
    };
  }

  if (!user?.passwordHash || !verifyPassword(password, user.passwordHash)) {
    return {
      status: "error",
      message: "Credenciales inválidas.",
    };
  }

  await createUserSession(user.id);
  redirect("/dashboard");
}

export async function createFirstAdmin(
  _state: AuthFormState,
  formData: FormData
): Promise<AuthFormState> {
  if (await hasCredentialedUsers()) {
    return {
      status: "error",
      message: "La cuenta inicial ya fue creada. Inicia sesión.",
    };
  }

  const name = ((formData.get("name") as string) || "").trim();
  const email = ((formData.get("email") as string) || "").trim().toLowerCase();
  const password = (formData.get("password") as string) || "";

  if (!name || !email || !password) {
    return {
      status: "error",
      message: "Completa nombre, correo y contraseña.",
    };
  }

  if (password.length < 8) {
    return {
      status: "error",
      message: "La contraseña debe tener al menos 8 caracteres.",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  let userId = existingUser?.id ?? "";

  if (existingUser?.passwordHash) {
    return {
      status: "error",
      message: "Ese usuario ya tiene acceso. Inicia sesión.",
    };
  }

  const passwordHash = hashPassword(password);

  if (existingUser) {
    await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: {
        name,
        role: existingUser.role || "ADMIN_FAMILIA",
        passwordHash,
        isActive: true,
      },
    });

    userId = existingUser.id;
  } else {
    const createdUser = await prisma.user.create({
      data: {
        name,
        email,
        role: "ADMIN_FAMILIA",
        passwordHash,
        isActive: true,
      },
    });

    userId = createdUser.id;
  }

  await createUserSession(userId);
  redirect("/dashboard");
}

export async function signOut() {
  await clearUserSession();
  redirect("/sign-in");
}
