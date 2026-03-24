import { redirect } from "next/navigation";

import { createFirstAdmin, signIn } from "@/app/auth-actions";
import { initialAuthFormState } from "@/app/auth-form-state";
import { getCurrentUser, hasCredentialedUsers } from "@/lib/auth";

import { SignInForm } from "./sign-in-form";

export default async function SignInPage() {
  const [currentUser, credentialedUsersExist] = await Promise.all([
    getCurrentUser(),
    hasCredentialedUsers(),
  ]);

  if (currentUser) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-10 md:px-6">
      <div className="grid w-full gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.03] p-8">
          <p className="text-sm uppercase tracking-[0.25em] text-white/45">Asistapp</p>
          <h2 className="mt-4 text-4xl font-semibold leading-tight text-white">
            Cuidado coordinado, ahora con acceso seguro.
          </h2>
          <p className="mt-4 max-w-xl text-base text-white/65">
            Inicia sesión para acceder a inicio, tareas, inventario, signos
            vitales e historial de medicación.
          </p>
        </section>

        {credentialedUsersExist ? (
          <SignInForm
            action={signIn}
            initialState={initialAuthFormState}
            title="Iniciar sesión"
            description="Accede con tu correo y contraseña."
            submitLabel="Entrar"
          />
        ) : (
          <SignInForm
            action={createFirstAdmin}
            initialState={initialAuthFormState}
            title="Crear cuenta inicial"
            description="Como todavía no existe un usuario con acceso, crea la primera cuenta administradora."
            submitLabel="Crear cuenta y entrar"
            showName
          />
        )}
      </div>
    </main>
  );
}
