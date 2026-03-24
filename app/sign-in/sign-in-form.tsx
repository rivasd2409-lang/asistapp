'use client';

import { useActionState } from "react";

import { type AuthFormState } from "../auth-form-state";

type SignInFormProps = {
  action: (state: AuthFormState, formData: FormData) => Promise<AuthFormState>;
  initialState: AuthFormState;
  title: string;
  description: string;
  submitLabel: string;
  showName?: boolean;
};

export function SignInForm({
  action,
  initialState,
  title,
  description,
  submitLabel,
  showName = false,
}: SignInFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <section className="rounded-2xl border border-white/15 bg-white/5 p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-white">{title}</h1>
      <p className="mt-2 text-sm text-white/65">{description}</p>

      <form action={formAction} className="mt-6 space-y-4">
        {state.message ? (
          <p className="rounded border border-red-400/30 bg-red-400/10 px-3 py-2 text-sm text-red-200">
            {state.message}
          </p>
        ) : null}

        {showName ? (
          <div>
            <label className="mb-1 block text-sm text-white/75">Nombre</label>
            <input
              name="name"
              type="text"
              className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
              required
            />
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-sm text-white/75">Correo</label>
          <input
            name="email"
            type="email"
            autoComplete="email"
            className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-white/75">Contraseña</label>
          <input
            name="password"
            type="password"
            autoComplete={showName ? "new-password" : "current-password"}
            className="w-full rounded border border-white/20 bg-black px-3 py-2 text-white"
            required
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded bg-white px-4 py-2 font-medium text-black disabled:opacity-60"
        >
          {pending ? "Procesando..." : submitLabel}
        </button>
      </form>
    </section>
  );
}
