'use client';

import { useMemo, useState } from "react";

import {
  LOG_ENTRY_CATEGORIES,
  LOG_ENTRY_CATEGORY_LABELS,
  LOG_ENTRY_PRIORITY_BADGE_CLASSES,
  LOG_ENTRY_PRIORITY_LABELS,
  type LogEntryCategory,
  type LogEntryPriority,
} from "./logbook";

type PatientOption = {
  id: string;
  name: string;
};

type LogEntryRecord = {
  id: string;
  patientId: string;
  category: LogEntryCategory;
  note: string;
  priority: LogEntryPriority | null;
  createdAt: string;
  patient: PatientOption;
  user: {
    id: string;
    name: string;
  };
};

type LogbookHistoryProps = {
  patients: PatientOption[];
  entries: LogEntryRecord[];
};

function getDefaultDateFilter() {
  return "";
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function LogbookHistory({
  patients,
  entries,
}: LogbookHistoryProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedDate, setSelectedDate] = useState(getDefaultDateFilter);

  const filteredEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (selectedPatientId !== "ALL" && entry.patientId !== selectedPatientId) {
        return false;
      }

      if (selectedCategory !== "ALL" && entry.category !== selectedCategory) {
        return false;
      }

      if (selectedDate) {
        const entryDate = new Date(entry.createdAt);
        const localEntryDate = new Date(
          entryDate.getTime() - entryDate.getTimezoneOffset() * 60_000
        )
          .toISOString()
          .slice(0, 10);

        if (localEntryDate !== selectedDate) {
          return false;
        }
      }

      return true;
    });
  }, [entries, selectedCategory, selectedDate, selectedPatientId]);

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Entradas recientes</h2>
          <p className="text-sm text-white/60">
            Filtra la bitácora por paciente, fecha o categoría.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3 xl:min-w-[780px]">
          <div>
            <label className="mb-1 block text-sm text-white/75">Paciente</label>
            <select
              value={selectedPatientId}
              onChange={(event) => setSelectedPatientId(event.target.value)}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            >
              <option value="ALL">Todos los pacientes</option>
              {patients.map((patient) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Fecha</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(event) => setSelectedDate(event.target.value)}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Categoría</label>
            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            >
              <option value="ALL">Todas las categorías</option>
              {LOG_ENTRY_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {LOG_ENTRY_CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {filteredEntries.length > 0 ? (
          filteredEntries.map((entry) => (
            <article
              key={entry.id}
              className="rounded-2xl border border-white/15 bg-white/5 p-4"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-white/60">{entry.patient.name}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-white">
                      {LOG_ENTRY_CATEGORY_LABELS[entry.category]}
                    </p>
                    {entry.priority ? (
                      <span
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium ${LOG_ENTRY_PRIORITY_BADGE_CLASSES[entry.priority]}`}
                      >
                        {LOG_ENTRY_PRIORITY_LABELS[entry.priority]}
                      </span>
                    ) : null}
                  </div>
                </div>

                <p className="text-sm text-white/60">
                  {formatCreatedAt(entry.createdAt)}
                </p>
              </div>

              <p className="mt-3 whitespace-pre-wrap rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80">
                {entry.note}
              </p>

              <p className="mt-3 text-sm text-white/60">
                Autor: {entry.user.name}
              </p>
            </article>
          ))
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
            No hay entradas de bitácora para este filtro.
          </p>
        )}
      </div>
    </section>
  );
}
