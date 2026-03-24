import { getAppData } from "@/lib/app-data";
import { sendNotifications } from "@/lib/notifications";

export default async function DashboardPage() {
  const data = await getAppData();

  await sendNotifications(data.notificationItems);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Usuarios</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.users}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Grupos</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.groups}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Pacientes</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.patients}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Tareas</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.tasks}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Registros de inventario</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.inventoryItems}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-sm text-white/60">Signos vitales</p>
          <p className="mt-2 text-2xl font-semibold">{data.summary.vitalSigns}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg text-amber-300">!</span>
          <h2 className="text-xl font-semibold">Atención requerida</h2>
        </div>

        <div className="space-y-2">
          {data.attentionAlerts.length > 0 ? (
            data.attentionAlerts.map((alert) => (
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
            <p className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/65">
              No hay alertas importantes en este momento.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="text-lg text-sky-300">*</span>
          <h2 className="text-xl font-semibold">Registro de notificaciones</h2>
        </div>

        <div className="space-y-2">
          {data.notificationItems.length > 0 ? (
            data.notificationItems.map((item) => (
              <div
                key={item.id}
                className="rounded border border-white/10 bg-black/30 px-3 py-2 text-sm text-white/80"
              >
                {item.message}
              </div>
            ))
          ) : (
            <p className="rounded border border-white/10 bg-white/5 px-3 py-2 text-sm text-white/65">
              No hay notificaciones generadas en este momento.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
