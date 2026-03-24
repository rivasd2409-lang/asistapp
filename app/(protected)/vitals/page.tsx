import { redirect } from "next/navigation";

import { createVitalSignRecord } from "@/app/actions";
import { VitalSignForm } from "@/app/vital-sign-form";
import { initialVitalSignFormState } from "@/app/vital-sign-form-state";
import { VitalSignsHistory } from "@/app/vital-signs-history";
import { getAppData } from "@/lib/app-data";
import { hasPermission } from "@/lib/roles";

export default async function VitalsPage() {
  const data = await getAppData();
  const viewer = data.viewer;

  if (!viewer || !hasPermission(viewer.role, "view_vitals")) {
    redirect("/dashboard");
  }

  const canRegisterVitalSigns = hasPermission(viewer.role, "register_vital_signs");

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Signos vitales</h1>
        <p className="mt-2 text-white/65">
          Registra y consulta mediciones del paciente en un solo lugar.
        </p>
      </div>

      {canRegisterVitalSigns ? (
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <h2 className="mb-4 text-lg font-semibold">Registrar signo vital</h2>
          <VitalSignForm
            action={createVitalSignRecord}
            patients={data.patients}
            initialState={initialVitalSignFormState}
          />
        </section>
      ) : null}

      <VitalSignsHistory patients={data.patients} records={data.vitalSigns} />
    </section>
  );
}
