export const APP_ROLES = [
  "ADMIN_FAMILIA",
  "ENFERMERA",
  "APOYO_DOMESTICO",
  "FAMILIAR_LECTURA",
] as const;

export type AppRole = (typeof APP_ROLES)[number];

export type AppPermission =
  | "view_dashboard"
  | "view_summary"
  | "view_logbook"
  | "create_log_entries"
  | "view_shifts"
  | "view_tasks"
  | "create_tasks"
  | "update_task_status"
  | "register_vital_signs"
  | "view_vitals"
  | "update_medication_inventory"
  | "view_inventory"
  | "view_patients"
  | "manage_family_workspace"
  | "view_medication_history"
  | "mark_shift"
  | "add_daily_observations";

const LEGACY_ROLE_MAP: Record<string, AppRole> = {
  ADMIN: "ADMIN_FAMILIA",
  FAMILY: "FAMILIAR_LECTURA",
  CAREGIVER: "ENFERMERA",
  HOUSEKEEPING: "APOYO_DOMESTICO",
};

export const APP_ROLE_LABELS: Record<AppRole, string> = {
  ADMIN_FAMILIA: "Admin familia",
  ENFERMERA: "Enfermera",
  APOYO_DOMESTICO: "Apoyo doméstico",
  FAMILIAR_LECTURA: "Familiar lectura",
};

const ROLE_PERMISSIONS: Record<AppRole, AppPermission[]> = {
  ADMIN_FAMILIA: [
    "view_dashboard",
    "view_summary",
    "view_logbook",
    "create_log_entries",
    "view_shifts",
    "view_tasks",
    "create_tasks",
    "update_task_status",
    "register_vital_signs",
    "view_vitals",
    "update_medication_inventory",
    "view_inventory",
    "view_patients",
    "manage_family_workspace",
    "view_medication_history",
    "mark_shift",
    "add_daily_observations",
  ],
  ENFERMERA: [
    "view_dashboard",
    "view_summary",
    "view_logbook",
    "create_log_entries",
    "view_shifts",
    "view_tasks",
    "update_task_status",
    "register_vital_signs",
    "view_vitals",
    "update_medication_inventory",
    "view_inventory",
    "view_patients",
    "view_medication_history",
    "mark_shift",
  ],
  APOYO_DOMESTICO: [
    "view_dashboard",
    "view_summary",
    "view_logbook",
    "create_log_entries",
    "view_shifts",
    "view_tasks",
    "update_task_status",
    "view_patients",
    "view_medication_history",
    "mark_shift",
    "add_daily_observations",
  ],
  FAMILIAR_LECTURA: [
    "view_dashboard",
    "view_summary",
    "view_logbook",
    "view_shifts",
    "view_patients",
    "view_medication_history",
  ],
};

export function isAppRole(value: string): value is AppRole {
  return APP_ROLES.includes(value as AppRole);
}

export function normalizeAppRole(value: string): AppRole {
  if (isAppRole(value)) {
    return value;
  }

  return LEGACY_ROLE_MAP[value] ?? "FAMILIAR_LECTURA";
}

export function hasPermission(role: string, permission: AppPermission) {
  const normalizedRole = normalizeAppRole(role);

  return ROLE_PERMISSIONS[normalizedRole].includes(permission);
}

export function isAssignedCareRole(role: string) {
  const normalizedRole = normalizeAppRole(role);

  return normalizedRole === "ENFERMERA" || normalizedRole === "APOYO_DOMESTICO";
}
