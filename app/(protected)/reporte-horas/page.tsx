import { redirect } from "next/navigation";

import { PrintReportButton } from "@/app/print-report-button";
import { requirePermission } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { APP_ROLE_LABELS, APP_ROLES, normalizeAppRole } from "@/lib/roles";
import {
  formatShiftDateTime,
  formatShiftTime,
  getLocalDateInputValue,
} from "@/lib/shifts";

type WorkedHoursPageProps = {
  searchParams: Promise<{
    start?: string | string[];
    end?: string | string[];
    userId?: string | string[];
    role?: string | string[];
  }>;
};

function getSingleSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function getDefaultStartDate() {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  return getLocalDateInputValue(firstDay);
}

function getDateRange(startValue?: string, endValue?: string) {
  const safeStart = startValue || getDefaultStartDate();
  const safeEnd = endValue || getLocalDateInputValue();

  const start = new Date(`${safeStart}T00:00:00`);
  const end = new Date(`${safeEnd}T23:59:59.999`);

  return {
    startValue: safeStart,
    endValue: safeEnd,
    start,
    end,
  };
}

function formatHours(hours: number) {
  return `${hours.toFixed(2)} h`;
}

function getDurationHours(startedAt: Date, endedAt: Date) {
  return (endedAt.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
}

function formatDuration(startedAt: Date, endedAt: Date) {
  const totalMinutes = Math.max(
    0,
    Math.round((endedAt.getTime() - startedAt.getTime()) / 60000)
  );
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
}

function formatPrintableDate(value: string) {
  return new Intl.DateTimeFormat("es-HN", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));
}

export default async function WorkedHoursReportPage({
  searchParams,
}: WorkedHoursPageProps) {
  const viewer = await requirePermission("manage_family_workspace");

  if (viewer.role !== "ADMIN_FAMILIA") {
    redirect("/dashboard");
  }

  const generatedAt = new Date();
  const params = await searchParams;
  const requestedStart = getSingleSearchParam(params.start);
  const requestedEnd = getSingleSearchParam(params.end);
  const requestedUserId = getSingleSearchParam(params.userId) ?? "";
  const requestedRole = getSingleSearchParam(params.role) ?? "";
  const { startValue, endValue, start, end } = getDateRange(
    requestedStart,
    requestedEnd
  );

  const [users, attendanceRecords] = await Promise.all([
    prisma.user.findMany({
      orderBy: {
        name: "asc",
      },
    }),
    prisma.shiftAttendance.findMany({
      where: {
        startedAt: {
          gte: start,
          lte: end,
        },
        endedAt: {
          not: null,
        },
        ...(requestedUserId ? { userId: requestedUserId } : {}),
        ...(requestedRole ? { user: { role: requestedRole } } : {}),
      },
      include: {
        user: true,
        plannedShift: true,
      },
      orderBy: {
        startedAt: "desc",
      },
    }),
  ]);

  const selectedUser =
    users.find((user) => user.id === requestedUserId) ?? null;
  const selectedRoleLabel = requestedRole
    ? APP_ROLE_LABELS[normalizeAppRole(requestedRole)]
    : "Todos";

  const summaryByUser = attendanceRecords.reduce<
    Record<
      string,
      {
        userId: string;
        name: string;
        roleLabel: string;
        totalHours: number;
        shiftCount: number;
      }
    >
  >((accumulator, record) => {
    if (!record.endedAt) {
      return accumulator;
    }

    const role = normalizeAppRole(record.user.role);
    const durationHours = getDurationHours(record.startedAt, record.endedAt);
    const existing = accumulator[record.userId];

    if (existing) {
      existing.totalHours += durationHours;
      existing.shiftCount += 1;
      return accumulator;
    }

    accumulator[record.userId] = {
      userId: record.userId,
      name: record.user.name,
      roleLabel: APP_ROLE_LABELS[role],
      totalHours: durationHours,
      shiftCount: 1,
    };

    return accumulator;
  }, {});

  const summaryItems = Object.values(summaryByUser).sort((left, right) => {
    if (right.totalHours !== left.totalHours) {
      return right.totalHours - left.totalHours;
    }

    return left.name.localeCompare(right.name, "es");
  });

  return (
    <section className="space-y-6 print:space-y-4 print:bg-white print:px-6 print:py-6 print:text-black">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between print:block">
        <div>
          <h1 className="text-2xl font-bold print:text-black">Reporte de horas</h1>
          <p className="mt-2 text-white/65 print:text-black/70">
            Revisa horas trabajadas reales a partir de registros de asistencia para apoyo de nómina.
          </p>
        </div>

        <PrintReportButton />
      </div>

      <section className="hidden rounded-2xl border border-black/15 bg-white p-4 print:block">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-black/60">Rango seleccionado</p>
            <p className="mt-1 text-sm text-black">
              {formatPrintableDate(startValue)} - {formatPrintableDate(endValue)}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-black/60">Colaborador</p>
            <p className="mt-1 text-sm text-black">
              {selectedUser?.name || "Todos"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-black/60">Rol</p>
            <p className="mt-1 text-sm text-black">{selectedRoleLabel}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-black/60">Generado el</p>
            <p className="mt-1 text-sm text-black">
              {formatShiftDateTime(generatedAt)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5 print:hidden">
        <form
          className="grid gap-4 md:grid-cols-2 xl:grid-cols-4"
          action="/reporte-horas"
        >
          <div>
            <label className="mb-1 block text-sm text-white/75">Fecha inicio</label>
            <input
              name="start"
              type="date"
              defaultValue={startValue}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Fecha fin</label>
            <input
              name="end"
              type="date"
              defaultValue={endValue}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Colaborador</label>
            <select
              name="userId"
              defaultValue={requestedUserId}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            >
              <option value="">Todos</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm text-white/75">Rol</label>
            <select
              name="role"
              defaultValue={requestedRole}
              className="w-full rounded border border-white/20 bg-black px-3 py-2"
            >
              <option value="">Todos</option>
              {APP_ROLES.map((role) => (
                <option key={role} value={role}>
                  {APP_ROLE_LABELS[role]}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 xl:col-span-4">
            <button
              type="submit"
              className="rounded bg-white px-4 py-2 text-black"
            >
              Aplicar filtros
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5 print:border-black/15 print:bg-white">
        <div className="mb-4">
          <h2 className="text-lg font-semibold print:text-black">Resumen por colaborador</h2>
          <p className="text-sm text-white/60 print:text-black/70">
            Totales calculados únicamente desde asistencias reales cerradas.
          </p>
        </div>

        <div className="space-y-3">
          {summaryItems.length > 0 ? (
            summaryItems.map((item) => {
              const averageHours =
                item.shiftCount > 0 ? item.totalHours / item.shiftCount : 0;

              return (
                <article
                  key={item.userId}
                  className="rounded-xl border border-white/10 bg-black/20 p-4 print:border-black/10 print:bg-white"
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="font-semibold text-white print:text-black">{item.name}</p>
                      <p className="text-sm text-white/60 print:text-black/70">{item.roleLabel}</p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[520px]">
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 print:border-black/10 print:bg-white">
                        <p className="text-xs uppercase tracking-wide text-white/50 print:text-black/60">
                          Horas trabajadas
                        </p>
                        <p className="mt-1 font-medium text-white print:text-black">
                          {formatHours(item.totalHours)}
                        </p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 print:border-black/10 print:bg-white">
                        <p className="text-xs uppercase tracking-wide text-white/50 print:text-black/60">
                          Turnos registrados
                        </p>
                        <p className="mt-1 font-medium text-white print:text-black">{item.shiftCount}</p>
                      </div>
                      <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 print:border-black/10 print:bg-white">
                        <p className="text-xs uppercase tracking-wide text-white/50 print:text-black/60">
                          Promedio por turno
                        </p>
                        <p className="mt-1 font-medium text-white print:text-black">
                          {formatHours(averageHours)}
                        </p>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          ) : (
            <p className="rounded-xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/60 print:border-black/15 print:text-black/70">
              No hay registros de asistencia para este filtro.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5 print:border-black/15 print:bg-white">
        <div className="mb-4">
          <h2 className="text-lg font-semibold print:text-black">Detalle de asistencias</h2>
          <p className="text-sm text-white/60 print:text-black/70">
            Vista detallada para revisar horas reales registradas y compararlas con el turno planificado.
          </p>
        </div>

        <div className="space-y-3">
          {attendanceRecords.length > 0 ? (
            attendanceRecords.map((record) => (
              <article
                key={record.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4 print:border-black/10 print:bg-white"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <p className="font-semibold text-white print:text-black">{record.user.name}</p>
                    <p className="text-sm text-white/60 print:text-black/70">
                      {APP_ROLE_LABELS[normalizeAppRole(record.user.role)]}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 print:border-black/10 print:bg-white">
                      <p className="text-xs uppercase tracking-wide text-white/50 print:text-black/60">Fecha</p>
                      <p className="mt-1 text-sm text-white print:text-black">
                        {formatShiftDateTime(record.startedAt)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 print:border-black/10 print:bg-white">
                      <p className="text-xs uppercase tracking-wide text-white/50 print:text-black/60">Hora de inicio</p>
                      <p className="mt-1 text-sm text-white print:text-black">
                        {formatShiftTime(record.startedAt)}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 print:border-black/10 print:bg-white">
                      <p className="text-xs uppercase tracking-wide text-white/50 print:text-black/60">Hora de fin</p>
                      <p className="mt-1 text-sm text-white print:text-black">
                        {record.endedAt ? formatShiftTime(record.endedAt) : "-"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 print:border-black/10 print:bg-white">
                      <p className="text-xs uppercase tracking-wide text-white/50 print:text-black/60">Duración total</p>
                      <p className="mt-1 text-sm text-white print:text-black">
                        {record.endedAt ? formatDuration(record.startedAt, record.endedAt) : "-"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 print:border-black/10 print:bg-white">
                      <p className="text-xs uppercase tracking-wide text-white/50 print:text-black/60">
                        Turno planificado relacionado
                      </p>
                      <p className="mt-1 text-sm text-white print:text-black">
                        {record.plannedShift
                          ? `${formatShiftTime(record.plannedShift.startAt)} - ${formatShiftTime(record.plannedShift.endAt)}`
                          : "Sin turno vinculado"}
                      </p>
                    </div>
                    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 print:border-black/10 print:bg-white">
                      <p className="text-xs uppercase tracking-wide text-white/50 print:text-black/60">Notas</p>
                      <p className="mt-1 text-sm text-white print:text-black">
                        {record.notes || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <p className="rounded-xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/60 print:border-black/15 print:text-black/70">
              No hay asistencias cerradas para este rango.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
