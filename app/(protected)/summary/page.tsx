import { buildAttentionAlerts } from "@/lib/attention";
import { getAppData } from "@/lib/app-data";

type SummaryPageProps = {
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

function isWithinRange(value: string | null, start: Date, end: Date) {
  if (!value) {
    return false;
  }

  const current = new Date(value);

  return current >= start && current < end;
}

function formatTime(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("es-HN", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default async function SummaryPage({ searchParams }: SummaryPageProps) {
  const data = await getAppData();
  const params = await searchParams;
  const requestedPatientId = getSingleSearchParam(params.patientId);
  const requestedDate = getSingleSearchParam(params.date) ?? getTodayInputValue();
  const selectedPatient =
    data.patients.find((patient) => patient.id === requestedPatientId) ??
    data.patients[0] ??
    null;
  const selectedPatientId = selectedPatient?.id ?? "";
  const { start, end } = getDayRange(requestedDate);

  const patientTasks = data.tasks.filter((task) => task.patientId === selectedPatientId);
  const completedTasks = patientTasks.filter(
    (task) =>
      task.status === "COMPLETED" &&
      isWithinRange(task.completedAt, start, end)
  );
  const pendingTasks = patientTasks.filter(
    (task) =>
      task.status !== "COMPLETED" &&
      task.status !== "DISCARDED" &&
      isWithinRange(task.dueDate, start, end)
  );
  const completedMedicationTasks = completedTasks.filter(
    (task) => task.category === "MEDICATION"
  );
  const vitalSigns = data.vitalSigns.filter(
    (record) =>
      record.patientId === selectedPatientId &&
      isWithinRange(record.recordedAt, start, end)
  );
  const patientInventoryItems = data.inventoryItems.filter(
    (item) => item.patientId === selectedPatientId
  );
  const alerts = buildAttentionAlerts({
    now: new Date(),
    upcomingHours: 24,
    tasks: patientTasks,
    inventoryItems: patientInventoryItems,
  });

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Resumen diario</h1>
        <p className="mt-2 text-white/65">
          Revisa tareas, medicamentos, signos vitales y alertas por paciente y fecha.
        </p>
      </div>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <form action="/summary" className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto]">
          <div>
            <label className="mb-1 block text-sm text-white/75">Paciente</label>
            <select
              name="patientId"
              defaultValue={selectedPatientId}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            >
              {data.patients.map((patient) => (
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
              Ver resumen
            </button>
          </div>
        </form>
      </section>

      {selectedPatient ? (
        <div className="grid gap-4 xl:grid-cols-2">
          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Tareas</h2>
              <p className="text-sm text-white/60">
                {completedTasks.length} completadas · {pendingTasks.length} pendientes
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <p className="mb-2 text-sm font-medium text-emerald-200">Completadas</p>
                <div className="space-y-2">
                  {completedTasks.length > 0 ? (
                    completedTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded border border-emerald-400/20 bg-emerald-400/5 px-3 py-2"
                      >
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-white/60">
                          Completada a las {formatTime(task.completedAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60">
                      No hubo tareas completadas ese día.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <p className="mb-2 text-sm font-medium text-amber-200">Pendientes del día</p>
                <div className="space-y-2">
                  {pendingTasks.length > 0 ? (
                    pendingTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded border border-amber-400/20 bg-amber-400/5 px-3 py-2"
                      >
                        <p className="font-medium">{task.title}</p>
                        <p className="text-sm text-white/60">
                          Programada para {formatTime(task.dueDate)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60">
                      No hay tareas pendientes para esa fecha.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <h2 className="mb-4 text-lg font-semibold">Medicamentos</h2>
            <div className="space-y-2">
              {completedMedicationTasks.length > 0 ? (
                completedMedicationTasks.map((task) => (
                  <div
                    key={task.id}
                    className="rounded border border-sky-400/20 bg-sky-400/5 px-3 py-2"
                  >
                    <p className="font-medium">
                      {task.medicationName || task.title}
                    </p>
                    <p className="text-sm text-white/60">
                      Hora: {formatTime(task.dueDate ?? task.completedAt)}
                    </p>
                  </div>
                ))
              ) : (
                <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60">
                  No hay medicamentos completados ese día.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <h2 className="mb-4 text-lg font-semibold">Signos vitales</h2>
            <div className="space-y-2">
              {vitalSigns.length > 0 ? (
                vitalSigns.map((record) => (
                  <div
                    key={record.id}
                    className="rounded border border-white/10 bg-black/20 px-3 py-2"
                  >
                    <p className="font-medium">{record.type.replaceAll("_", " ")}</p>
                    <p className="text-sm text-white/80">
                      {record.value} {record.unit}
                    </p>
                    <p className="text-sm text-white/60">
                      {formatDateTime(record.recordedAt)}
                    </p>
                    {record.notes ? (
                      <p className="mt-1 text-sm text-white/70">{record.notes}</p>
                    ) : null}
                  </div>
                ))
              ) : (
                <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60">
                  No hay signos vitales registrados ese día.
                </p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
            <h2 className="mb-4 text-lg font-semibold">Alertas</h2>
            <div className="space-y-2">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded border px-3 py-2 text-sm ${
                      alert.tone === "danger"
                        ? "border-red-400/30 bg-red-400/10 text-red-200"
                        : "border-amber-400/30 bg-amber-400/10 text-amber-200"
                    }`}
                  >
                    {alert.message}
                  </div>
                ))
              ) : (
                <p className="rounded border border-white/10 bg-black/20 px-3 py-2 text-sm text-white/60">
                  No hay alertas activas para este paciente.
                </p>
              )}
            </div>
          </section>
        </div>
      ) : (
        <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/65">
          Crea o selecciona un paciente para ver el resumen diario.
        </p>
      )}
    </section>
  );
}
