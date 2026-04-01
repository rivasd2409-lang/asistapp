'use client';

import { useActionState } from "react";

import { type LogEntryFormState } from "./log-entry-form-state";
import {
  LOG_ENTRY_CATEGORIES,
  LOG_ENTRY_CATEGORY_LABELS,
  LOG_ENTRY_PRIORITIES,
  LOG_ENTRY_PRIORITY_LABELS,
} from "./logbook";

type PatientOption = {
  id: string;
  name: string;
};

type LogEntryFormProps = {
  action: (
    state: LogEntryFormState,
    formData: FormData
  ) => Promise<LogEntryFormState>;
  initialState: LogEntryFormState;
  patients: PatientOption[];
};

export function LogEntryForm({
  action,
  initialState,
  patients,
}: LogEntryFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.message ? (
        <p
          className={`rounded border px-3 py-2 text-sm ${
            state.status === "success"
              ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
              : state.status === "error"
                ? "border-red-400/30 bg-red-400/10 text-red-200"
                : "border-white/15 bg-white/5 text-white/70"
          }`}
        >
          {state.message}
        </p>
      ) : null}

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block">Paciente</label>
          <select
            name="patientId"
            defaultValue=""
            required
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
          >
            <option value="" disabled>
              Selecciona un paciente
            </option>
            {patients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.name}
              </option>
            ))}
          </select>
          {state.errors.patientId ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.patientId}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block">Categoría</label>
          <select
            name="category"
            defaultValue="GENERAL"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
          >
            {LOG_ENTRY_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {LOG_ENTRY_CATEGORY_LABELS[category]}
              </option>
            ))}
          </select>
          {state.errors.category ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.category}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block">Prioridad</label>
          <select
            name="priority"
            defaultValue=""
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
          >
            <option value="">Sin prioridad especial</option>
            {LOG_ENTRY_PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {LOG_ENTRY_PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
          {state.errors.priority ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.priority}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block">Observación</label>
        <textarea
          name="note"
          rows={5}
          placeholder="Describe lo ocurrido durante el turno o el día."
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
          required
        />
        {state.errors.note ? (
          <p className="mt-1 text-sm text-red-200">{state.errors.note}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-white px-4 py-2 text-black disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar entrada"}
      </button>
    </form>
  );
}
