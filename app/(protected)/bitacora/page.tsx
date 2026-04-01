import { redirect } from "next/navigation";

import { createLogEntry } from "@/app/log-actions";
import { LogEntryForm } from "@/app/log-entry-form";
import { initialLogEntryFormState } from "@/app/log-entry-form-state";
import { LogbookHistory } from "@/app/logbook-history";
import { normalizeLogEntryCategory, normalizeLogEntryPriority } from "@/app/logbook";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasPermission } from "@/lib/roles";

export default async function BitacoraPage() {
  const viewer = await requireCurrentUser();

  if (!hasPermission(viewer.role, "view_logbook")) {
    redirect("/dashboard");
  }

  const canCreateEntries = hasPermission(viewer.role, "create_log_entries");

  const [patients, entries] = await Promise.all([
    prisma.patient.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.logEntry.findMany({
      include: {
        patient: true,
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 100,
    }),
  ]);

  const normalizedEntries = entries.map((entry: typeof entries[number]) => ({
    id: entry.id,
    patientId: entry.patientId,
    note: entry.note,
    createdAt: entry.createdAt.toISOString(),
    category: normalizeLogEntryCategory(entry.category),
    priority: normalizeLogEntryPriority(entry.priority),
    patient: {
      id: entry.patient.id,
      name: entry.patient.name,
    },
    user: {
      id: entry.user.id,
      name: entry.user.name,
    },
  }));

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Bitácora</h1>
        <p className="mt-2 text-white/65">
          Registra observaciones importantes del turno y consulta el historial diario del cuidado.
        </p>
      </div>

      {canCreateEntries ? (
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <h2 className="mb-4 text-lg font-semibold">Nueva entrada</h2>
          <LogEntryForm
            action={createLogEntry}
            initialState={initialLogEntryFormState}
            patients={patients.map((patient: typeof patients[number]) => ({
              id: patient.id,
              name: patient.name,
            }))}
          />
        </section>
      ) : null}

      <LogbookHistory
        patients={patients.map((patient: typeof patients[number]) => ({
          id: patient.id,
          name: patient.name,
        }))}
        entries={normalizedEntries}
      />
    </section>
  );
}
