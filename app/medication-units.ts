export const MEDICATION_UNITS = [
  "TABLET",
  "CAPSULE",
  "ML",
  "DROP",
] as const;

export type MedicationUnit = (typeof MEDICATION_UNITS)[number];

export function isMedicationUnit(value: string): value is MedicationUnit {
  return MEDICATION_UNITS.includes(value as MedicationUnit);
}

export function normalizeMedicationUnit(value: string): MedicationUnit | null {
  return isMedicationUnit(value) ? value : null;
}

export const MEDICATION_UNIT_LABELS: Record<MedicationUnit, string> = {
  TABLET: "tableta",
  CAPSULE: "cápsula",
  ML: "ml",
  DROP: "gota",
};

export function formatMedicationDose(
  amount: number | null,
  unit: string | null,
  fallback: string | null = null
) {
  const normalizedUnit = unit ? normalizeMedicationUnit(unit) : null;

  if (
    amount !== null &&
    amount !== undefined &&
    Number.isFinite(amount) &&
    amount > 0 &&
    normalizedUnit
  ) {
    const label = MEDICATION_UNIT_LABELS[normalizedUnit];
    const plural =
      amount === 1 ? label : normalizedUnit === "ML" ? label : `${label}s`;

    return `${amount} ${plural}`;
  }

  return fallback || "-";
}
