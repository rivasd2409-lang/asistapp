'use client';

import { useActionState } from "react";

import { type MedicationInventoryFormState } from "./medication-inventory-form-state";
import {
  MEDICATION_UNITS,
  MEDICATION_UNIT_LABELS,
} from "./medication-units";

type PatientOption = {
  id: string;
  name: string;
};

type MedicationInventoryFormProps = {
  action: (
    state: MedicationInventoryFormState,
    formData: FormData
  ) => Promise<MedicationInventoryFormState>;
  patients: PatientOption[];
  initialState: MedicationInventoryFormState;
};

export function MedicationInventoryForm({
  action,
  patients,
  initialState,
}: MedicationInventoryFormProps) {
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

      <div>
        <label className="mb-1 block">Medicamento</label>
        <input
          name="medicationName"
          type="text"
          placeholder="Ej: Metformin"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
          required
        />
        {state.errors.medicationName ? (
          <p className="mt-1 text-sm text-red-200">{state.errors.medicationName}</p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block">Unidad de inventario</label>
          <select
            name="unit"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            defaultValue="TABLET"
            required
          >
            {MEDICATION_UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {MEDICATION_UNIT_LABELS[unit]}
              </option>
            ))}
          </select>
          {state.errors.unit ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.unit}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block">Paciente</label>
          <select
            name="patientId"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            defaultValue=""
            required
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
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block">Stock actual</label>
          <input
            name="currentStock"
            type="number"
            min="0"
            step="0.1"
            placeholder="Ej: 12"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            required
          />
          {state.errors.currentStock ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.currentStock}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block">Stock mínimo</label>
          <input
            name="minimumStock"
            type="number"
            min="0"
            step="0.1"
            placeholder="Ej: 4"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            required
          />
          {state.errors.minimumStock ? (
            <p className="mt-1 text-sm text-red-200">{state.errors.minimumStock}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label className="mb-1 block">Notas</label>
        <textarea
          name="notes"
          placeholder="Información opcional, por ejemplo: tomar con comida"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-white px-4 py-2 text-black disabled:opacity-60"
      >
        {pending ? "Guardando..." : "Guardar inventario"}
      </button>
    </form>
  );
}
