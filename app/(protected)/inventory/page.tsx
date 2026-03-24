import { redirect } from "next/navigation";

import { createMedicationInventoryItem } from "@/app/actions";
import { MedicationInventoryForm } from "@/app/medication-inventory-form";
import { initialMedicationInventoryFormState } from "@/app/medication-inventory-form-state";
import { formatMedicationDose } from "@/app/medication-units";
import { getAppData } from "@/lib/app-data";
import { hasPermission } from "@/lib/roles";

export default async function InventoryPage() {
  const data = await getAppData();
  const viewer = data.viewer;

  if (!viewer || !hasPermission(viewer.role, "view_inventory")) {
    redirect("/dashboard");
  }

  const canUpdateInventory = hasPermission(viewer.role, "update_medication_inventory");

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Inventario</h1>
        <p className="mt-2 text-white/65">
          Controla existencias y revisa rápidamente el bajo stock.
        </p>
      </div>

      {canUpdateInventory ? (
        <section className="rounded-2xl border border-white/15 bg-white/5 p-4 md:p-5">
          <h2 className="mb-4 text-lg font-semibold">Registrar inventario</h2>
          <MedicationInventoryForm
            action={createMedicationInventoryItem}
            patients={data.patients}
            initialState={initialMedicationInventoryFormState}
          />
        </section>
      ) : null}

      <section>
        <div className="mb-4">
          <h2 className="text-lg font-semibold">Listado</h2>
          <p className="text-sm text-white/60">
            Consulta las existencias visibles para tu rol.
          </p>
        </div>

        <div className="space-y-2">
          {data.inventoryItems.map((item) => {
            const isLowStock = item.currentStock <= item.minimumStock;

            return (
              <div
                key={item.id}
                className={`rounded border p-3 ${
                  isLowStock
                    ? "border-red-400/40 bg-red-400/10"
                    : "border-white/20 bg-white/5"
                }`}
              >
                <p><strong>Medicamento:</strong> {item.medicationName}</p>
                <p><strong>Paciente:</strong> {item.patient.name}</p>
                <p>
                  <strong>Stock:</strong>{" "}
                  {formatMedicationDose(item.currentStock, item.displayUnit)}
                </p>
                <p>
                  <strong>Stock mínimo:</strong>{" "}
                  {formatMedicationDose(item.minimumStock, item.displayUnit)}
                </p>
                <p><strong>Notas:</strong> {item.notes || "-"}</p>
                {isLowStock ? (
                  <p className="mt-2 text-sm font-medium text-red-200">
                    Bajo stock
                  </p>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
