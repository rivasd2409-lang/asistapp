export const LOG_ENTRY_CATEGORIES = [
  "GENERAL",
  "CONDUCTA",
  "SUENO",
  "ALIMENTACION",
  "HIDRATACION",
  "MEDICACION",
  "SIGNOS_VITALES",
  "INCIDENTE",
  "COMUNICACION_FAMILIAR",
  "MEDICO",
] as const;

export type LogEntryCategory = (typeof LOG_ENTRY_CATEGORIES)[number];

export const LOG_ENTRY_CATEGORY_LABELS: Record<LogEntryCategory, string> = {
  GENERAL: "General",
  CONDUCTA: "Conducta",
  SUENO: "Sueño",
  ALIMENTACION: "Alimentación",
  HIDRATACION: "Hidratación",
  MEDICACION: "Medicación",
  SIGNOS_VITALES: "Signos vitales",
  INCIDENTE: "Incidente",
  COMUNICACION_FAMILIAR: "Comunicación familiar",
  MEDICO: "Médico",
};

export const LOG_ENTRY_PRIORITIES = [
  "NORMAL",
  "IMPORTANTE",
  "URGENTE",
] as const;

export type LogEntryPriority = (typeof LOG_ENTRY_PRIORITIES)[number];

export const LOG_ENTRY_PRIORITY_LABELS: Record<LogEntryPriority, string> = {
  NORMAL: "Normal",
  IMPORTANTE: "Importante",
  URGENTE: "Urgente",
};

export const LOG_ENTRY_PRIORITY_BADGE_CLASSES: Record<LogEntryPriority, string> = {
  NORMAL: "border-white/20 bg-white/10 text-white/80",
  IMPORTANTE: "border-amber-400/30 bg-amber-400/15 text-amber-200",
  URGENTE: "border-red-400/30 bg-red-400/10 text-red-200",
};

export function isLogEntryCategory(value: string): value is LogEntryCategory {
  return LOG_ENTRY_CATEGORIES.includes(value as LogEntryCategory);
}

export function normalizeLogEntryCategory(value: string): LogEntryCategory {
  return isLogEntryCategory(value) ? value : "GENERAL";
}

export function isLogEntryPriority(value: string): value is LogEntryPriority {
  return LOG_ENTRY_PRIORITIES.includes(value as LogEntryPriority);
}

export function normalizeLogEntryPriority(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  return isLogEntryPriority(value) ? value : null;
}
