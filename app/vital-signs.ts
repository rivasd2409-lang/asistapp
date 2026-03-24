export const VITAL_SIGN_TYPES = [
  "BLOOD_PRESSURE",
  "HEART_RATE",
  "TEMPERATURE",
  "OXYGEN_SATURATION",
  "GLUCOSE",
  "WEIGHT",
] as const;

export type VitalSignType = (typeof VITAL_SIGN_TYPES)[number];

export const VITAL_SIGN_LABELS: Record<VitalSignType, string> = {
  BLOOD_PRESSURE: "Presión arterial",
  HEART_RATE: "Frecuencia cardíaca",
  TEMPERATURE: "Temperatura",
  OXYGEN_SATURATION: "Saturación de oxígeno",
  GLUCOSE: "Glucosa",
  WEIGHT: "Peso",
};

export const VITAL_SIGN_DEFAULT_UNITS: Record<VitalSignType, string> = {
  BLOOD_PRESSURE: "mmHg",
  HEART_RATE: "bpm",
  TEMPERATURE: "°C",
  OXYGEN_SATURATION: "%",
  GLUCOSE: "mg/dL",
  WEIGHT: "kg",
};

export function isVitalSignType(value: string): value is VitalSignType {
  return VITAL_SIGN_TYPES.includes(value as VitalSignType);
}

export function normalizeVitalSignType(value: string): VitalSignType {
  return isVitalSignType(value) ? value : "HEART_RATE";
}
