export type MedicationInventoryFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors: {
    medicationName?: string;
    unit?: string;
    currentStock?: string;
    minimumStock?: string;
    patientId?: string;
  };
};

export const initialMedicationInventoryFormState: MedicationInventoryFormState = {
  status: "idle",
  message: "",
  errors: {},
};
