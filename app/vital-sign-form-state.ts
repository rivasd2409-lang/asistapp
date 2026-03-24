export type VitalSignFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors: {
    patientId?: string;
    type?: string;
    value?: string;
    unit?: string;
    recordedAt?: string;
  };
};

export const initialVitalSignFormState: VitalSignFormState = {
  status: "idle",
  message: "",
  errors: {},
};
