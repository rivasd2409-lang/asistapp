export type LogEntryFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors: {
    patientId?: string;
    category?: string;
    note?: string;
    priority?: string;
  };
};

export const initialLogEntryFormState: LogEntryFormState = {
  status: "idle",
  message: "",
  errors: {},
};
