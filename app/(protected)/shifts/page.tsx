import Link from "next/link";
import { redirect } from "next/navigation";

import {
  createPlannedShift,
  deletePlannedShift,
  endShiftAttendance,
  startShiftAttendance,
  updatePlannedShift,
} from "@/app/shift-actions";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  formatShiftDateTime,
  formatShiftDay,
  formatShiftTime,
  getShiftDateInputValue,
  getShiftTimeInputValue,
  getWeekDays,
  getWeekRange,
  parseWeekStart,
} from "@/lib/shifts";
import {
  APP_ROLE_LABELS,
  hasPermission,
  isAssignedCareRole,
  normalizeAppRole,
} from "@/lib/roles";

type ShiftsPageProps = {
  searchParams: Promise<{
    weekStart?: string | string[];
  }>;
};

type ShiftUserItem = {
  id: string;
  name: string;
  role: string;
};

type PlannedShiftItem = {
  id: string;
  userId: string;
  role: string;
  startAt: Date;
  endAt: Date;
  notes: string | null;
  user: ShiftUserItem;
};

type AttendanceItem = {
  id: string;
  userId: string;
  plannedShiftId: string | null;
  startedAt: Date;
  endedAt: Date | null;
  notes: string | null;
  user: ShiftUserItem;
  plannedShift: {
    id: string;
    userId: string;
    role: string;
    startAt: Date;
    endAt: Date;
    notes: string | null;
    user: ShiftUserItem;
  } | null;
};

function getSingleSearchParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

function sameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export default async function ShiftsPage({ searchParams }: ShiftsPageProps) {
  const viewer = await requireCurrentUser();

  if (!hasPermission(viewer.role, "view_shifts")) {
    redirect("/dashboard");
  }

  const params = await searchParams;
  const weekStart = parseWeekStart(getSingleSearchParam(params.weekStart));
  const previousWeek = new Date(weekStart);
  previousWeek.setDate(previousWeek.getDate() - 7);
  const nextWeek = new Date(weekStart);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const weekDays = getWeekDays(weekStart);
  const { start, end } = getWeekRange(weekStart);
  const isAssignedRole = isAssignedCareRole(viewer.role);
  const canManageShifts = hasPermission(viewer.role, "manage_family_workspace");
  const canMarkShift = hasPermission(viewer.role, "mark_shift");

  const [staffUsers, plannedShifts, attendanceRecords, activeAttendance] =
    await Promise.all([
      canManageShifts
        ? prisma.user.findMany({
            where: {
              isActive: true,
              role: {
                in: ["ENFERMERA", "APOYO_DOMESTICO"],
              },
            },
            orderBy: {
              name: "asc",
            },
          })
        : Promise.resolve([]),
      prisma.plannedShift.findMany({
        where: {
          startAt: {
            gte: start,
            lt: end,
          },
          ...(isAssignedRole ? { userId: viewer.id } : {}),
        },
        include: {
          user: true,
        },
        orderBy: {
          startAt: "asc",
        },
      }),
      prisma.shiftAttendance.findMany({
        where: {
          startedAt: {
            gte: start,
            lt: end,
          },
          ...(isAssignedRole ? { userId: viewer.id } : {}),
        },
        include: {
          user: true,
          plannedShift: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          startedAt: "desc",
        },
      }),
      canMarkShift
        ? prisma.shiftAttendance.findFirst({
            where: {
              userId: viewer.id,
              endedAt: null,
            },
            orderBy: {
              startedAt: "desc",
            },
          })
        : Promise.resolve(null),
    ]);
  const typedStaffUsers = staffUsers as ShiftUserItem[];
  const typedPlannedShifts = plannedShifts as PlannedShiftItem[];
  const typedAttendanceRecords = attendanceRecords as AttendanceItem[];

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {isAssignedRole ? "Mi turno" : "Turnos semanales"}
          </h1>
          <p className="mt-2 text-white/65">
            {canManageShifts
              ? "Planifica la semana, reasigna colaboradores y revisa asistencia real."
              : "Consulta tus turnos de la semana y registra tu entrada o salida."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href={`/shifts?weekStart=${previousWeek.toISOString().slice(0, 10)}`}
            className="rounded border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Semana anterior
          </Link>
          <span className="rounded border border-white/15 bg-white/5 px-3 py-2 text-sm text-white">
            {formatShiftDay(weekDays[0])} - {formatShiftDay(weekDays[6])}
          </span>
          <Link
            href={`/shifts?weekStart=${nextWeek.toISOString().slice(0, 10)}`}
            className="rounded border border-white/20 px-3 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Semana siguiente
          </Link>
        </div>
      </div>

      {canManageShifts ? (
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <h2 className="mb-4 text-lg font-semibold">Crear turno planificado</h2>
          <form action={createPlannedShift} className="grid gap-3 lg:grid-cols-5">
            <div>
              <label className="mb-1 block text-sm text-white/75">Colaborador</label>
              <select
                name="userId"
                className="w-full rounded border border-white/20 bg-black px-3 py-2"
                defaultValue=""
                required
              >
                <option value="" disabled>
                  Selecciona un colaborador
                </option>
                {typedStaffUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} - {APP_ROLE_LABELS[normalizeAppRole(user.role)]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/75">Rol</label>
              <select
                name="role"
                className="w-full rounded border border-white/20 bg-black px-3 py-2"
                defaultValue="ENFERMERA"
              >
                <option value="ENFERMERA">Enfermera</option>
                <option value="APOYO_DOMESTICO">Apoyo doméstico</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/75">Fecha</label>
              <input
                name="shiftDate"
                type="date"
                defaultValue={getShiftDateInputValue(weekStart)}
                className="w-full rounded border border-white/20 bg-black px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/75">Hora de inicio</label>
              <input
                name="startTime"
                type="time"
                defaultValue={getShiftTimeInputValue(weekStart)}
                className="w-full rounded border border-white/20 bg-black px-3 py-2"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-white/75">Hora de fin</label>
              <input
                name="endTime"
                type="time"
                defaultValue={getShiftTimeInputValue(
                  new Date(weekStart.getTime() + 8 * 60 * 60 * 1000)
                )}
                className="w-full rounded border border-white/20 bg-black px-3 py-2"
                required
              />
            </div>

            <div className="lg:col-span-4">
              <label className="mb-1 block text-sm text-white/75">Notas</label>
              <input
                name="notes"
                type="text"
                placeholder="Opcional"
                className="w-full rounded border border-white/20 bg-black px-3 py-2"
              />
            </div>

            <div className="lg:col-span-5">
              <p className="mb-3 text-sm text-white/60">
                Si la hora de fin es menor que la de inicio, el turno se guardará para el día siguiente.
              </p>
              <button
                type="submit"
                className="rounded bg-white px-4 py-2 text-black"
              >
                Guardar turno
              </button>
            </div>
          </form>
        </section>
      ) : null}

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Calendario semanal</h2>
          <p className="text-sm text-white/60">
            Vista simple por día con los turnos planificados de la semana.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-7">
          {weekDays.map((day) => {
            const dayShifts = typedPlannedShifts.filter((shift) =>
              sameDay(shift.startAt, day)
            );

            return (
              <section
                key={day.toISOString()}
                className="rounded-2xl border border-white/15 bg-white/5 p-4"
              >
                <div className="mb-3 border-b border-white/10 pb-3">
                  <h3 className="font-semibold text-white">{formatShiftDay(day)}</h3>
                </div>

                <div className="space-y-3">
                  {dayShifts.length > 0 ? (
                    dayShifts.map((shift) => {
                      const canInteractWithShift =
                        canMarkShift && shift.userId === viewer.id;
                      const canEndThisShift =
                        activeAttendance &&
                        activeAttendance.userId === viewer.id &&
                        (activeAttendance.plannedShiftId === shift.id ||
                          !activeAttendance.plannedShiftId);

                      return (
                        <article
                          key={shift.id}
                          className="rounded-xl border border-white/10 bg-black/20 p-3"
                        >
                          <p className="font-medium text-white">{shift.user.name}</p>
                          <p className="text-sm text-white/65">
                            {APP_ROLE_LABELS[normalizeAppRole(shift.role)]}
                          </p>
                          <p className="mt-2 text-sm text-white/80">
                            {formatShiftTime(shift.startAt)} - {formatShiftTime(shift.endAt)}
                          </p>
                          {shift.notes ? (
                            <p className="mt-2 text-sm text-white/65">{shift.notes}</p>
                          ) : null}

                          {canManageShifts ? (
                            <details className="mt-3 rounded border border-white/10 bg-white/5 p-3">
                              <summary className="cursor-pointer text-sm text-white/80">
                                Editar turno
                              </summary>
                              <form action={updatePlannedShift} className="mt-3 space-y-3">
                                <input type="hidden" name="shiftId" value={shift.id} />
                                <div>
                                  <label className="mb-1 block text-sm text-white/75">
                                    Colaborador
                                  </label>
                                  <select
                                    name="userId"
                                    defaultValue={shift.userId}
                                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                                  >
                                    {typedStaffUsers.map((user) => (
                                      <option key={user.id} value={user.id}>
                                        {user.name} - {APP_ROLE_LABELS[normalizeAppRole(user.role)]}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-sm text-white/75">Rol</label>
                                  <select
                                    name="role"
                                    defaultValue={normalizeAppRole(shift.role)}
                                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                                  >
                                    <option value="ENFERMERA">Enfermera</option>
                                    <option value="APOYO_DOMESTICO">Apoyo doméstico</option>
                                  </select>
                                </div>
                                <div className="grid gap-3 md:grid-cols-3">
                                  <div>
                                    <label className="mb-1 block text-sm text-white/75">Fecha</label>
                                    <input
                                      name="shiftDate"
                                      type="date"
                                      defaultValue={getShiftDateInputValue(shift.startAt)}
                                      className="w-full rounded border border-white/20 bg-black px-3 py-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-sm text-white/75">
                                      Hora de inicio
                                    </label>
                                    <input
                                      name="startTime"
                                      type="time"
                                      defaultValue={getShiftTimeInputValue(shift.startAt)}
                                      className="w-full rounded border border-white/20 bg-black px-3 py-2"
                                    />
                                  </div>
                                  <div>
                                    <label className="mb-1 block text-sm text-white/75">
                                      Hora de fin
                                    </label>
                                    <input
                                      name="endTime"
                                      type="time"
                                      defaultValue={getShiftTimeInputValue(shift.endAt)}
                                      className="w-full rounded border border-white/20 bg-black px-3 py-2"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="mb-1 block text-sm text-white/75">Notas</label>
                                  <input
                                    name="notes"
                                    type="text"
                                    defaultValue={shift.notes || ""}
                                    className="w-full rounded border border-white/20 bg-black px-3 py-2"
                                  />
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <button
                                    type="submit"
                                    className="rounded bg-white px-3 py-2 text-sm text-black"
                                  >
                                    Guardar cambios
                                  </button>
                                  <p className="text-sm text-white/55">
                                    Si la hora de fin es menor que la de inicio, el turno se interpreta como nocturno.
                                  </p>
                                </div>
                              </form>
                              <form action={deletePlannedShift} className="mt-2">
                                <input type="hidden" name="shiftId" value={shift.id} />
                                <button
                                  type="submit"
                                  className="rounded border border-red-400/30 px-3 py-2 text-sm text-red-200"
                                >
                                  Eliminar turno
                                </button>
                              </form>
                            </details>
                          ) : null}

                          {canInteractWithShift && !activeAttendance ? (
                            <form action={startShiftAttendance} className="mt-3">
                              <input type="hidden" name="plannedShiftId" value={shift.id} />
                              <button
                                type="submit"
                                className="rounded border border-emerald-400/30 px-3 py-2 text-sm text-emerald-200"
                              >
                                Marcar inicio
                              </button>
                            </form>
                          ) : null}

                          {canInteractWithShift && canEndThisShift ? (
                            <form action={endShiftAttendance} className="mt-3">
                              <input
                                type="hidden"
                                name="attendanceId"
                                value={activeAttendance?.id || ""}
                              />
                              <button
                                type="submit"
                                className="rounded border border-amber-400/30 px-3 py-2 text-sm text-amber-200"
                              >
                                Marcar fin
                              </button>
                            </form>
                          ) : null}
                        </article>
                      );
                    })
                  ) : (
                    <p className="rounded border border-dashed border-white/15 px-3 py-4 text-sm text-white/55">
                      Sin turnos planificados
                    </p>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold">Asistencia</h2>
            <p className="text-sm text-white/60">
              Registro real de entrada y salida para la semana seleccionada.
            </p>
          </div>
          {activeAttendance ? (
            <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-200">
              Turno activo
            </span>
          ) : null}
        </div>

        <div className="space-y-2">
          {attendanceRecords.length > 0 ? (
            typedAttendanceRecords.map((attendance) => (
              <div
                key={attendance.id}
                className="rounded-xl border border-white/10 bg-black/20 p-4"
              >
                <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                  <div>
                    <p className="font-medium text-white">{attendance.user.name}</p>
                    <p className="text-sm text-white/65">
                      Inicio: {formatShiftDateTime(attendance.startedAt)}
                    </p>
                    <p className="text-sm text-white/65">
                      Fin: {attendance.endedAt ? formatShiftDateTime(attendance.endedAt) : "En curso"}
                    </p>
                  </div>
                  {attendance.plannedShift ? (
                    <p className="text-sm text-white/60">
                      Planificado: {formatShiftTime(attendance.plannedShift.startAt)} - {formatShiftTime(attendance.plannedShift.endAt)}
                    </p>
                  ) : (
                    <p className="text-sm text-white/60">Sin turno vinculado</p>
                  )}
                </div>

                {attendance.notes ? (
                  <p className="mt-2 text-sm text-white/65">{attendance.notes}</p>
                ) : null}
              </div>
            ))
          ) : (
            <p className="rounded border border-dashed border-white/15 px-3 py-4 text-sm text-white/55">
              No hay asistencia registrada para esta semana.
            </p>
          )}
        </div>
      </section>
    </section>
  );
}
