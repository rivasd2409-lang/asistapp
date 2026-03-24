export const TASK_CATEGORIES = [
  "GENERAL",
  "MEDICATION",
  "VITAL_SIGNS",
  "HYGIENE",
  "MEAL",
  "CLEANING",
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export function isTaskCategory(value: string): value is TaskCategory {
  return TASK_CATEGORIES.includes(value as TaskCategory);
}

export function normalizeTaskCategory(value: string): TaskCategory {
  return isTaskCategory(value) ? value : "GENERAL";
}

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  GENERAL: "General",
  MEDICATION: "Medicación",
  VITAL_SIGNS: "Signos vitales",
  HYGIENE: "Higiene",
  MEAL: "Comida",
  CLEANING: "Limpieza",
};

export const TASK_CATEGORY_BADGE_CLASSES: Record<TaskCategory, string> = {
  GENERAL: "border-white/20 bg-white/10 text-white/80",
  MEDICATION: "border-fuchsia-400/30 bg-fuchsia-400/15 text-fuchsia-200",
  VITAL_SIGNS: "border-cyan-400/30 bg-cyan-400/15 text-cyan-200",
  HYGIENE: "border-blue-400/30 bg-blue-400/15 text-blue-200",
  MEAL: "border-orange-400/30 bg-orange-400/15 text-orange-200",
  CLEANING: "border-lime-400/30 bg-lime-400/15 text-lime-200",
};
