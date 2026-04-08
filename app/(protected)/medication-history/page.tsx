import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";

type MedicationHistoryPageProps = {
  searchParams: Promise<{
    patientId?: string | string[];
    date?: string | string[];
  }>;
};

function getSingleSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getTodayInputValue() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 10);
}

function getDayRange(dateValue: string) {
  const start = new Date(`${dateValue}T00:00:00`);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function MedicationHistoryPage({
  searchParams,
}: MedicationHistoryPageProps) {
  await requirePermission("view_medication_history");

  const params = await searchParams;
  const patients = await prisma.patient.findMany({
    orderBy: { createdAt: "desc" },
  });

  const requestedPatientId = getSingleSearchParam(params.patientId);
  const requestedDate = getSingleSearchParam(params.date) ?? getTodayInputValue();

  const selectedPatient =
    patients.find(
      (patient: typeof patients[number]) => patient.id === requestedPatientId
    ) ??
    patients[0] ??
    null;

  const selectedPatientId = selectedPatient?.id ?? "";
  const { start, end } = getDayRange(requestedDate);

  const records = selectedPatientId
    ? await prisma.medicationAdministration.findMany({
        where: {
          patientId: selectedPatientId,
          administeredAt: {
            gte: start,
            lt: end,
          },
        },
        include: {
          patient: true,
          administeredByMember: {
            include: {
              user: true,
            },
          },
          recordedByMember: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          administeredAt: "desc",
        },
      })
    : [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Historial de medicación</h1>
        <p className="mt-2 text-white/65">
          Revisa cuándo se administró cada medicamento y quién lo registró.
        </p>
      </div>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <form
          action="/medication-history"
          className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]"
        >
          <div>
            <label className="mb-1 block text-sm text-white/75">Paciente</label>
            <select
              name="patientId"
              defaultValue={selectedPatientId}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            >
              {patients.map((patient: typeof patients[number]) => (
                <option key={patient.id} value={patient.id}>
                  {patient.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Fecha</label>
            <input
              name="date"
              type="date"
              defaultValue={requestedDate}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded bg-white px-4 py-2 text-black md:w-auto"
            >
              Ver historial
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Administraciones</h2>
          <p className="text-sm text-white/60">{records.length} registros</p>
        </div>

        <div className="space-y-2">
          {records.length > 0 ? (
            records.map((record: typeof records[number]) => (
              <div
                key={record.id}
                className="rounded-2xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div className="space-y-1">
                    <p className="text-sm text-white/60">{record.patient.name}</p>
                    <p className="font-semibold text-white">{record.medicationName}</p>
                    <p className="text-sm text-white/80">
                      Dosis: {record.dosage || "-"}
                    </p>
                  </div>
                  <p className="text-sm text-white/60">
                    {formatDateTime(record.administeredAt)}
                  </p>
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  <p className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75">
                    Administrado por:{" "}
                    {record.administeredByMember?.user.name || "Sin registrar"}
                  </p>
                  <p className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75">
                    Instrucciones: {record.instructions || "-"}
                  </p>
                </div>

                <p className="mt-2 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75">
                  Registrado por:{" "}
                  {record.recordedByMember?.user.name || "Sin registrar"}
                </p>

                {record.notes ? (
                  <p className="mt-3 rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/75">
                    Notas: {record.notes}
                  </p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60">
              No hay administraciones registradas para este paciente en esa fecha.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}