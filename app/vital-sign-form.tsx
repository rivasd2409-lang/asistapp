'use client';

import { useActionState, useState } from "react";

import { type VitalSignFormState } from "./vital-sign-form-state";
import {
  VITAL_SIGN_DEFAULT_UNITS,
  VITAL_SIGN_LABELS,
  VITAL_SIGN_TYPES,
  type VitalSignType,
} from "./vital-signs";

type PatientOption = {
  id: string;
  name: string;
};

type VitalSignFormProps = {
  action: (
    state: VitalSignFormState,
    formData: FormData
  ) => Promise<VitalSignFormState>;
  patients: PatientOption[];
  initialState: VitalSignFormState;
};

const initialType = "BLOOD_PRESSURE" satisfies VitalSignType;

function getDefaultRecordedAt() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 16);
}

export function VitalSignForm({
  action,
  patients,
  initialState,
}: VitalSignFormProps) {
  const [state, formAction, pending] = useActionState(action, initialState);
  const [type, setType] = useState<VitalSignType>(initialType);

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

      <div className="grid gap-3 md:grid-cols-2">
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
          <label className="mb-1 block">Tipo</label>
          <select
            name="type"
            value={type}
            onChange={(event) => setType(event.target.value as VitalSignType)}
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
          >
            {VITAL_SIGN_TYPES.map((vitalType) => (
              <option key={vitalType} value={vitalType}>
                {VITAL_SIGN_LABELS[vitalType]}
              </option>
            ))}
          </select>
          {state.errors.type ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.type}</p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="mb-1 block">Valor</label>
          <input
            name="value"
            type="text"
            placeholder={
              type === "BLOOD_PRESSURE" ? "Ej: 120/80" : "Ej: 72"
            }
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            required
          />
          {state.errors.value ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.value}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block">Unidad</label>
          <input
            key={type}
            name="unit"
            type="text"
            defaultValue={VITAL_SIGN_DEFAULT_UNITS[type]}
            placeholder="Ej: bpm"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            required
          />
          {state.errors.unit ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.unit}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block">Fecha y hora registrada</label>
          <input
            name="recordedAt"
            type="datetime-local"
            defaultValue={getDefaultRecordedAt()}
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            required
          />
          {state.errors.recordedAt ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.recordedAt}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block">Notas</label>
        <textarea
          name="notes"
          placeholder="Información adicional opcional"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-white px-4 py-2 text-black disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar signo vital"}
      </button>
    </form>
  );
}
