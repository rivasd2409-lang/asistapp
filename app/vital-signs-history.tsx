'use client';

import { useMemo, useState } from "react";

import { VITAL_SIGN_LABELS, type VitalSignType } from "./vital-signs";

type PatientOption = {
  id: string;
  name: string;
};

type VitalSignRecord = {
  id: string;
  patientId: string;
  type: VitalSignType;
  value: string;
  unit: string;
  notes: string | null;
  recordedAt: string;
  createdAt: string;
  patient: PatientOption;
};

type VitalSignsHistoryProps = {
  patients: PatientOption[];
  records: VitalSignRecord[];
};

function formatRecordedAt(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function VitalSignsHistory({
  patients,
  records,
}: VitalSignsHistoryProps) {
  const [selectedPatientId, setSelectedPatientId] = useState("ALL");

  const filteredRecords = useMemo(
    () =>
      selectedPatientId === "ALL"
        ? records
        : records.filter((record) => record.patientId === selectedPatientId),
    [records, selectedPatientId]
  );

  return (
    <section className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Historial reciente</h2>
          <p className="text-sm text-white/60">
            Revisa las mediciones más recientes por paciente.
          </p>
        </div>

        <div className="w-full sm:max-w-xs">
          <label className="mb-1 block text-sm text-white/75">Filtrar por paciente</label>
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
      </div>

      <div className="space-y-2">
        {filteredRecords.length > 0 ? (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="rounded-2xl border border-white/15 bg-white/5 p-4"
            >
              <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-white/60">{record.patient.name}</p>
                  <p className="font-semibold text-white">
                    {VITAL_SIGN_LABELS[record.type]}
                  </p>
                  <p className="text-lg font-medium text-white">
                    {record.value} {record.unit}
                  </p>
                </div>

                <p className="text-sm text-white/60">
                  {formatRecordedAt(record.recordedAt)}
                </p>
              </div>

              {record.notes ? (
                <p className="mt-3 rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/75">
                  {record.notes}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
            No hay signos vitales registrados para este filtro.
          </p>
        )}
      </div>
    </section>
  );
}
