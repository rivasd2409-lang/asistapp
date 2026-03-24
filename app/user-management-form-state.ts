export type UserManagementFormState = {
  status: "idle" | "success" | "error";
  message: string;
  errors: {
    name?: string;
    email?: string;
    password?: string;
    role?: string;
    groupId?: string;
  };
};

export const initialUserManagementFormState: UserManagementFormState = {
  status: "idle",
  message: "",
  errors: {},
};
