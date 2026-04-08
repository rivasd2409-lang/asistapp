import Link from "next/link";
import { redirect } from "next/navigation";

import { MyShiftTaskBoard } from "@/app/my-shift-task-board";
import { endShiftAttendance, startShiftAttendance } from "@/app/shift-actions";
import { TASK_CATEGORY_LABELS, normalizeTaskCategory } from "@/app/task-category";
import { normalizeTaskStatus } from "@/app/task-status";
import { requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatShiftDateTime, formatShiftTime } from "@/lib/shifts";

function getTodayRange(baseDate: Date) {
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

function isWithinRange(value: Date | null, start: Date, end: Date) {
  if (!value) {
    return false;
  }

  return value >= start && value < end;
}

function formatElapsedTime(startedAt: Date, now: Date) {
  const diffMs = Math.max(0, now.getTime() - startedAt.getTime());
  const totalMinutes = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} min`;
  }

  return `${hours} h ${minutes.toString().padStart(2, "0")} min`;
}

export default async function MyShiftPage() {
  const viewer = await requireCurrentUser();

  if (viewer.role === "FAMILIAR_LECTURA") {
    redirect("/dashboard");
  }

  const now = new Date();
  const { start: todayStart, end: todayEnd } = getTodayRange(now);
  const currentUserGroupMemberships = await prisma.groupMember.findMany({
    where: {
      userId: viewer.id,
    },
    select: {
      groupId: true,
    },
  });
  const currentUserGroupIds = currentUserGroupMemberships.map(
  (membership: typeof currentUserGroupMemberships[number]) => membership.groupId
);
    (membership) => membership.groupId
  );

  const [activeAttendance, todayPlannedShift, nextPlannedShift, visibleTasks] =
    await Promise.all([
      prisma.shiftAttendance.findFirst({
        where: {
          userId: viewer.id,
          endedAt: null,
        },
        include: {
          plannedShift: true,
        },
        orderBy: {
          startedAt: "desc",
        },
      }),
      prisma.plannedShift.findFirst({
        where: {
          userId: viewer.id,
          startAt: {
            gte: todayStart,
            lt: todayEnd,
          },
        },
        orderBy: {
          startAt: "asc",
        },
      }),
      prisma.plannedShift.findFirst({
        where: {
          userId: viewer.id,
          endAt: {
            gte: now,
          },
        },
        orderBy: {
          startAt: "asc",
        },
      }),
      prisma.task.findMany({
        where: {
          OR: [
            {
              assignedMember: {
                userId: viewer.id,
              },
            },
            {
              assignedMemberId: null,
              patient: {
                groupId: {
                  in: currentUserGroupIds,
                },
              },
              ...(viewer.role === "APOYO_DOMESTICO"
                ? {
                    category: {
                      not: "MEDICATION",
                    },
                  }
                : {}),
            },
          ],
        },
        include: {
          patient: true,
        },
        orderBy: [
          {
            dueDate: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),
    ]);

  const shiftWindow = activeAttendance?.plannedShift
    ? {
        start: activeAttendance.plannedShift.startAt,
        end: activeAttendance.plannedShift.endAt,
      }
    : todayPlannedShift
      ? {
          start: todayPlannedShift.startAt,
          end: todayPlannedShift.endAt,
        }
      : activeAttendance
        ? {
            start: activeAttendance.startedAt,
            end: todayEnd,
          }
        : null;

  const operationalTasks = visibleTasks.filter((task) => {
    if (task.status === "COMPLETED") {
      return (
        isWithinRange(task.completedAt, todayStart, todayEnd) ||
        (shiftWindow
          ? isWithinRange(task.completedAt, shiftWindow.start, shiftWindow.end)
          : false)
      );
    }

    if (!task.dueDate) {
      return false;
    }

    return (
      task.dueDate < now ||
      isWithinRange(task.dueDate, todayStart, todayEnd) ||
      (shiftWindow
        ? isWithinRange(task.dueDate, shiftWindow.start, shiftWindow.end)
        : false)
    );
  });

  const personalTasks = operationalTasks.map((task) => {
    const category = normalizeTaskCategory(task.category);

    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: normalizeTaskStatus(task.status),
      dueDate: task.dueDate ? task.dueDate.toISOString() : null,
      completedAt: task.completedAt ? task.completedAt.toISOString() : null,
      patient: {
        id: task.patient.id,
        name: task.patient.name,
      },
      categoryLabel: TASK_CATEGORY_LABELS[category],
      isShared: !task.assignedMemberId,
    };
  });

  const hasTodayPlannedShift = Boolean(todayPlannedShift);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Mi turno</h1>
          <p className="mt-2 text-white/65">
            Revisa tu estado operativo del día, tus próximos turnos y las tareas más importantes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/vitals"
            className="rounded border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Registrar signo vital
          </Link>
          <Link
            href="/tasks"
            className="rounded border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Registrar medicamento
          </Link>
          <Link
            href="/patients"
            className="rounded border border-white/20 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
          >
            Ver paciente
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Estado del turno</h2>
              <p className="text-sm text-white/60">
                Vista operativa del turno actual o del turno pendiente de hoy.
              </p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-medium ${
                activeAttendance
                  ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                  : hasTodayPlannedShift
                    ? "border-amber-400/30 bg-amber-400/10 text-amber-200"
                    : "border-white/15 bg-white/5 text-white/70"
              }`}
            >
              {activeAttendance
                ? "En turno"
                : hasTodayPlannedShift
                  ? "Turno pendiente"
                  : "Sin turno hoy"}
            </span>
          </div>

          {activeAttendance ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4">
                <p className="text-sm text-white/60">Hora de inicio</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {formatShiftDateTime(activeAttendance.startedAt)}
                </p>
                <p className="mt-3 text-sm text-white/60">Turno planificado</p>
                <p className="mt-1 text-sm text-white/85">
                  {activeAttendance.plannedShift
                    ? `${formatShiftTime(activeAttendance.plannedShift.startAt)} - ${formatShiftTime(activeAttendance.plannedShift.endAt)}`
                    : "Sin turno planificado vinculado"}
                </p>
                <p className="mt-3 text-sm text-white/60">Tiempo transcurrido</p>
                <p className="mt-1 text-sm font-medium text-emerald-200">
                  {formatElapsedTime(activeAttendance.startedAt, now)}
                </p>
              </div>

              <form action={endShiftAttendance}>
                <input type="hidden" name="attendanceId" value={activeAttendance.id} />
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-2 text-black"
                >
                  Finalizar turno
                </button>
              </form>
            </div>
          ) : todayPlannedShift ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4">
                <p className="text-sm text-white/60">Horario de hoy</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {formatShiftTime(todayPlannedShift.startAt)} - {formatShiftTime(todayPlannedShift.endAt)}
                </p>
                <p className="mt-3 text-sm text-white/60">Inicio programado</p>
                <p className="mt-1 text-sm text-white/85">
                  {formatShiftDateTime(todayPlannedShift.startAt)}
                </p>
              </div>

              <form action={startShiftAttendance}>
                <input
                  type="hidden"
                  name="plannedShiftId"
                  value={todayPlannedShift.id}
                />
                <button
                  type="submit"
                  className="rounded bg-white px-4 py-2 text-black"
                >
                  Iniciar turno
                </button>
              </form>
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/60">
              No tienes un turno planificado para hoy.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <h2 className="text-lg font-semibold">Próximo turno</h2>
          <p className="mt-1 text-sm text-white/60">
            Próxima planificación registrada para tu usuario.
          </p>

          {nextPlannedShift ? (
            <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4">
              <p className="text-sm text-white/60">Inicio</p>
              <p className="mt-1 text-lg font-semibold text-white">
                {formatShiftDateTime(nextPlannedShift.startAt)}
              </p>
              <p className="mt-3 text-sm text-white/60">Horario</p>
              <p className="mt-1 text-sm text-white/85">
                {formatShiftTime(nextPlannedShift.startAt)} - {formatShiftTime(nextPlannedShift.endAt)}
              </p>
              <p className="mt-3 text-sm text-white/60">Notas</p>
              <p className="mt-1 text-sm text-white/85">
                {nextPlannedShift.notes || "Sin notas"}
              </p>
            </div>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-white/15 px-4 py-4 text-sm text-white/60">
              No hay un próximo turno planificado para tu usuario.
            </p>
          )}
        </section>
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Mis tareas</h2>
          <p className="text-sm text-white/60">
            Solo se muestran tareas del día, del turno actual o tareas vencidas pendientes de resolver.
          </p>
        </div>

        <MyShiftTaskBoard tasks={personalTasks} />
      </section>
    </section>
  );
}
