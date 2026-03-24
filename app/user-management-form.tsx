'use client';

import { useActionState } from "react";

import { APP_ROLES, APP_ROLE_LABELS } from "@/lib/roles";

import {
  initialUserManagementFormState,
  type UserManagementFormState,
} from "./user-management-form-state";

type UserManagementFormProps = {
  action: (
    state: UserManagementFormState,
    formData: FormData
  ) => Promise<UserManagementFormState>;
  groups: Array<{
    id: string;
    name: string;
  }>;
};

export function UserManagementForm({
  action,
  groups,
}: UserManagementFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    initialUserManagementFormState
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <p
          className={`rounded border px-3 py-2 text-sm ${
            state.status === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : "border-red-400/30 bg-red-400/10 text-red-200"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block">Nombre</label>
          <input
            name="name"
            type="text"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            placeholder="Ej: Ana López"
            required
          />
          {state.errors.name ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.name}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block">Correo</label>
          <input
            name="email"
            type="email"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            placeholder="ana@familia.com"
            required
          />
          {state.errors.email ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.email}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block">Contraseña temporal</label>
          <input
            name="password"
            type="password"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            placeholder="Mínimo 8 caracteres"
            required
          />
          {state.errors.password ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.password}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block">Rol</label>
          <select
            name="role"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            defaultValue="ENFERMERA"
          >
            {APP_ROLES.map((role) => (
              <option key={role} value={role}>
                {APP_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
          {state.errors.role ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.role}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <label className="mb-1 block">Estado</label>
          <select
            name="isActive"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            defaultValue="true"
          >
            <option value="true">Activo</option>
            <option value="false">Inactivo</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block">Grupo</label>
          <select
            name="groupId"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            defaultValue=""
            disabled={groups.length === 0}
          >
            <option value="">
              {groups.length === 0
                ? "No hay grupos disponibles"
                : "Selecciona un grupo"}
            </option>
            {groups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.name}
              </option>
            ))}
          </select>
          {state.errors.groupId ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.groupId}</p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-white px-4 py-2 text-black disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Crear usuario"}
      </button>
    </form>
  );
}
