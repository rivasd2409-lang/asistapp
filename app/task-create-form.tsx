'use client';

import { useState } from "react";

import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  type TaskCategory,
} from "./task-category";

type PatientOption = {
  id: string;
  name: string;
};

type MemberOption = {
  id: string;
  role: string;
  user: {
    name: string;
  };
};

type TaskCreateFormProps = {
  action: (formData: FormData) => Promise<void>;
  patients: PatientOption[];
  members: MemberOption[];
};

export function TaskCreateForm({
  action,
  patients,
  members,
}: TaskCreateFormProps) {
  const [category, setCategory] = useState<TaskCategory>("GENERAL");

  return (
    <form action={action} className="space-y-3">
      <div>
        <label className="mb-1 block">TÃ­tulo</label>
        <input
          name="title"
          type="text"
          placeholder="Ej: Dar medicamento de la maÃ±ana"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block">DescripciÃ³n</label>
        <textarea
          name="description"
          placeholder="Detalles de la tarea"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block">CategorÃ­a</label>
        <select
          name="category"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
          value={category}
          onChange={(event) => setCategory(event.target.value as TaskCategory)}
        >
          {TASK_CATEGORIES.map((item) => (
            <option key={item} value={item}>
              {TASK_CATEGORY_LABELS[item]}
            </option>
          ))}
        </select>
      </div>

      {category === "MEDICATION" ? (
        <div className="grid gap-3 rounded border border-white/10 bg-white/5 p-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block">Medication name</label>
            <input
              name="medicationName"
              type="text"
              placeholder="Ej: Metformin"
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block">Dosage</label>
            <input
              name="dosage"
              type="text"
              placeholder="Ej: 500 mg"
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block">Instructions</label>
            <input
              name="instructions"
              type="text"
              placeholder="Ej: After breakfast"
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            />
          </div>
        </div>
      ) : null}

      <div>
        <label className="mb-1 block">Paciente</label>
        <select
          name="patientId"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
          defaultValue=""
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
      </div>

      <div>
        <label className="mb-1 block">Fecha y hora limite</label>
        <input
          name="dueDate"
          type="datetime-local"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
        />
      </div>

      <div>
        <label className="mb-1 block">Recurrencia</label>
        <select
          name="recurrenceType"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
          defaultValue="NONE"
        >
          <option value="NONE">NONE</option>
          <option value="DAILY">DAILY</option>
          <option value="WEEKLY">WEEKLY</option>
          <option value="CUSTOM">CUSTOM</option>
        </select>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block">Custom interval</label>
          <input
            name="recurrenceInterval"
            type="number"
            min="1"
            placeholder="Ej: 2"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block">Custom unit</label>
          <select
            name="recurrenceUnit"
            className="w-full rounded border border-white/20 bg-black px-3 py-2"
            defaultValue="DAYS"
          >
            <option value="DAYS">Every X days</option>
            <option value="HOURS">Every X hours</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block">Asignar a miembro del grupo</label>
        <select
          name="assignedMemberId"
          className="w-full rounded border border-white/20 bg-black px-3 py-2"
          defaultValue=""
        >
          <option value="">Sin asignar</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.user.name} - {member.role}
            </option>
          ))}
        </select>
      </div>

      <button
        type="submit"
        className="rounded bg-white px-4 py-2 text-black"
      >
        Crear tarea
      </button>
    </form>
  );
}
