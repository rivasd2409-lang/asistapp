import { redirect } from "next/navigation";

import {
  createMedicationInventoryItem,
  updateMedicationInventoryItem,
} from "@/app/actions";
import { MedicationInventoryForm } from "@/app/medication-inventory-form";
import { initialMedicationInventoryFormState } from "@/app/medication-inventory-form-state";
import {
  formatMedicationDose,
  MEDICATION_UNITS,
  MEDICATION_UNIT_LABELS,
} from "@/app/medication-units";
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
          {data.inventoryItems.map((item: typeof data.inventoryItems[number]) => {
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
                {canUpdateInventory ? (
                  <details className="mt-3 rounded border border-white/10 bg-black/20 p-3">
                    <summary className="cursor-pointer text-sm font-medium text-white/80">
                      Editar inventario
                    </summary>
                    <form action={updateMedicationInventoryItem} className="mt-3 space-y-3">
                      <input type="hidden" name="inventoryItemId" value={item.id} />

                      <div className="grid gap-3 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-sm text-white/75">
                            Medicamento
                          </label>
                          <input
                            name="medicationName"
                            type="text"
                            defaultValue={item.medicationName}
                            className="w-full rounded border border-white/20 bg-black px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-white/75">
                            Paciente
                          </label>
                          <select
                            name="patientId"
                            defaultValue={item.patientId}
                            className="w-full rounded border border-white/20 bg-black px-3 py-2"
                            required
                          >
                            {data.patients.map((patient) => (
                              <option key={patient.id} value={patient.id}>
                                {patient.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid gap-3 md:grid-cols-3">
                        <div>
                          <label className="mb-1 block text-sm text-white/75">Unidad</label>
                          <select
                            name="unit"
                            defaultValue={item.unit}
                            className="w-full rounded border border-white/20 bg-black px-3 py-2"
                            required
                          >
                            {MEDICATION_UNITS.map((unit) => (
                              <option key={unit} value={unit}>
                                {MEDICATION_UNIT_LABELS[unit]}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-white/75">
                            Stock actual
                          </label>
                          <input
                            name="currentStock"
                            type="number"
                            min="0"
                            step="0.1"
                            defaultValue={item.currentStock}
                            className="w-full rounded border border-white/20 bg-black px-3 py-2"
                            required
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-sm text-white/75">
                            Stock mínimo
                          </label>
                          <input
                            name="minimumStock"
                            type="number"
                            min="0"
                            step="0.1"
                            defaultValue={item.minimumStock}
                            className="w-full rounded border border-white/20 bg-black px-3 py-2"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-1 block text-sm text-white/75">Notas</label>
                        <textarea
                          name="notes"
                          defaultValue={item.notes || ""}
                          rows={3}
                          className="w-full rounded border border-white/20 bg-black px-3 py-2"
                        />
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="submit"
                          className="rounded bg-white px-4 py-2 text-sm text-black"
                        >
                          Guardar cambios
                        </button>
                        <p className="text-sm text-white/55">
                          Si ya existe otro registro con el mismo paciente y medicamento, no se guardará el cambio.
                        </p>
                      </div>
                    </form>
                  </details>
                ) : null}
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
