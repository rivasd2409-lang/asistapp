'use server';

import { refresh } from "next/cache";

import { prisma } from "@/lib/db";
import { requirePermission } from "@/lib/auth";
import { normalizeAppRole } from "@/lib/roles";

import { type MedicationInventoryFormState } from "./medication-inventory-form-state";
import { type VitalSignFormState } from "./vital-sign-form-state";
import {
  formatMedicationDose,
  normalizeMedicationUnit,
} from "./medication-units";
import { normalizeTaskCategory } from "./task-category";
import {
  isTaskCustomRecurrenceUnit,
  normalizeTaskRecurrenceType,
} from "./task-recurrence";
import { isVitalSignType } from "./vital-signs";

export async function createUser() {
  await requirePermission("manage_family_workspace");

  await prisma.user.upsert({
    where: { email: "daniel@example.com" },
    update: {},
    create: {
      name: "Daniel",
      email: "daniel@example.com",
      role: "ADMIN_FAMILIA",
    },
  });
}

export async function createGroup(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const name = ((formData.get("name") as string) || "").trim();

  if (!name) {
    return;
  }

  const existingGroup = await prisma.group.findFirst({
    where: { name },
  });

  if (existingGroup) {
    return;
  }

  await prisma.group.create({
    data: {
      name,
    },
  });

  refresh();
}

export async function updateGroup(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const groupId = ((formData.get("groupId") as string) || "").trim();
  const name = ((formData.get("name") as string) || "").trim();

  if (!groupId || !name) {
    return;
  }

  await prisma.group.update({
    where: {
      id: groupId,
    },
    data: {
      name,
    },
  });

  refresh();
}

export async function createPatient(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const name = ((formData.get("name") as string) || "").trim();
  const ageValue = ((formData.get("age") as string) || "").trim();
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const dni = ((formData.get("dni") as string) || "").trim();
  const age = Number.parseInt(ageValue, 10);

  if (!name || !groupId || Number.isNaN(age) || age < 0) {
    return;
  }

  await prisma.patient.create({
    data: {
      name,
      age,
      groupId,
      dni: dni || null,
      clinicalSummary: null,
      criticalMedications: null,
      emergencyAlerts: null,
      triageMessage: null,
      emergencyContacts: null,
    },
  });

  refresh();
  return;

  const group = { id: groupId };
  const existingPatient = true;

  if (!existingPatient) {
    await prisma.patient.create({
      data: {
        name: "Wilfredo Rivas Flores",
        age: 67,
        dni: "0801-1958-03714",
        clinicalSummary:
          "Insuficiencia cardiaca por miocardiopatía dilatada isquémica (FE ~30% en estudios previos) con riesgo cardiovascular alto (antecedentes de infarto/arritmias). Deterioro cognitivo / demencia vascular con crisis vespertino-nocturna (agitación, paranoia, llanto, confusión, insomnio). Comorbilidades: hipotiroidismo y prediabetes.",
        criticalMedications:
          "1. Anticoagulante: Apixabán/Eliquis 5 mg (riesgo de sangrado).\n2. Conducta/sueño: aripiprazol (Ilimit), olanzapina (Olexa), eszopiclona (Neogaibal).",
        emergencyAlerts:
          "1. Dolor en el pecho, falta de aire, desmayo o presión muy baja.\n2. Debilidad de un lado, habla rara, convulsión/rigidez, confusión súbita.\n3. Somnolencia excesiva (no despierta bien).\n4. Caída o golpe (especialmente en cabeza) por uso de anticoagulante.\n5. No orina 8–10 horas o quiere orinar y no puede.",
        triageMessage:
          "Paciente 67 años con insuficiencia cardiaca (FE ~30%), demencia vascular y en anticoagulante (apixabán). Síntoma: ____ desde hora: ____.",
        emergencyContacts:
          "1. Daniel Rivas - 3152-8281\n2. Olga Zelaya - 8829-7623\n3. Jimmy Rivas - 3270-4422",
        groupId: group.id,
      },
    });

    refresh();
  }
}

export async function updatePatient(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const patientId = ((formData.get("patientId") as string) || "").trim();
  const name = ((formData.get("name") as string) || "").trim();
  const ageValue = ((formData.get("age") as string) || "").trim();
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const dni = ((formData.get("dni") as string) || "").trim();
  const clinicalSummary = ((formData.get("clinicalSummary") as string) || "").trim();
  const criticalMedications = ((formData.get("criticalMedications") as string) || "").trim();
  const emergencyAlerts = ((formData.get("emergencyAlerts") as string) || "").trim();
  const triageMessage = ((formData.get("triageMessage") as string) || "").trim();
  const emergencyContacts = ((formData.get("emergencyContacts") as string) || "").trim();

  const age = Number.parseInt(ageValue, 10);

  if (!patientId || !name || !groupId || Number.isNaN(age) || age < 0) {
    return;
  }

  await prisma.patient.update({
    where: {
      id: patientId,
    },
    data: {
      name,
      age,
      groupId,
      dni: dni || null,
      clinicalSummary: clinicalSummary || null,
      criticalMedications: criticalMedications || null,
      emergencyAlerts: emergencyAlerts || null,
      triageMessage: triageMessage || null,
      emergencyContacts: emergencyContacts || null,
    },
  });

  refresh();
}

export async function addUserToGroup(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const userId = ((formData.get("userId") as string) || "").trim();
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const role = normalizeAppRole(
    (formData.get("role") as string) || "FAMILIAR_LECTURA"
  );

  if (!userId || !groupId) return;

  const existing = await prisma.groupMember.findFirst({
    where: {
      userId,
    },
  });

  if (existing) {
    await prisma.groupMember.update({
      where: {
        id: existing.id,
      },
      data: {
        groupId,
        role,
      },
    });

    refresh();
    return;
  }

  await prisma.groupMember.create({
    data: {
      userId,
      groupId,
      role,
    },
  });

  refresh();
}

export async function updateGroupMember(formData: FormData) {
  await requirePermission("manage_family_workspace");

  const memberId = ((formData.get("memberId") as string) || "").trim();
  const groupId = ((formData.get("groupId") as string) || "").trim();
  const role = normalizeAppRole(
    (formData.get("role") as string) || "FAMILIAR_LECTURA"
  );

  if (!memberId || !groupId) {
    return;
  }

  await prisma.groupMember.update({
    where: {
      id: memberId,
    },
    data: {
      groupId,
      role,
    },
  });

  refresh();
}

export async function createTask(formData: FormData) {
  await requirePermission("create_tasks");

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const category = normalizeTaskCategory(
    (formData.get("category") as string) || "GENERAL"
  );
  const medicationName = formData.get("medicationName") as string;
  const doseAmountValue = formData.get("doseAmount") as string;
  const doseUnitValue = (formData.get("doseUnit") as string) || "";
  const instructions = formData.get("instructions") as string;
  const dueDate = formData.get("dueDate") as string;
  const recurrenceType = normalizeTaskRecurrenceType(
    (formData.get("recurrenceType") as string) || "NONE"
  );
  const recurrenceIntervalValue = formData.get("recurrenceInterval") as string;
  const recurrenceUnitValue = (formData.get("recurrenceUnit") as string) || "";
  const patientId = formData.get("patientId") as string;
  const assignedMemberId = formData.get("assignedMemberId") as string;

  if (!title || !patientId) return;

  const parsedRecurrenceInterval = recurrenceIntervalValue
    ? Number.parseInt(recurrenceIntervalValue, 10)
    : null;
  const recurrenceInterval =
    recurrenceType === "CUSTOM" &&
    parsedRecurrenceInterval &&
    parsedRecurrenceInterval > 0
      ? parsedRecurrenceInterval
      : null;
  const recurrenceUnit =
    recurrenceType === "CUSTOM" &&
    isTaskCustomRecurrenceUnit(recurrenceUnitValue)
      ? recurrenceUnitValue
      : null;

  const parsedDoseAmount = doseAmountValue
    ? Number.parseFloat(doseAmountValue)
    : null;
  const doseAmount =
    category === "MEDICATION" &&
    parsedDoseAmount !== null &&
    Number.isFinite(parsedDoseAmount) &&
    parsedDoseAmount > 0
      ? parsedDoseAmount
      : null;
  const doseUnit =
    category === "MEDICATION" ? normalizeMedicationUnit(doseUnitValue) : null;
  const dosage =
    category === "MEDICATION"
      ? formatMedicationDose(doseAmount, doseUnit, null)
      : null;

  await prisma.task.create({
    data: {
      title,
      description: description || null,
      category,
      medicationName: category === "MEDICATION" ? medicationName || null : null,
      dosage,
      doseAmount,
      doseUnit,
      instructions: category === "MEDICATION" ? instructions || null : null,
      dueDate: dueDate ? new Date(dueDate) : null,
      recurrenceType,
      recurrenceInterval,
      recurrenceUnit,
      patientId,
      assignedMemberId: assignedMemberId || null,
      status: "PENDING",
    },
  });
}

export async function createMedicationInventoryItem(
  _state: MedicationInventoryFormState,
  formData: FormData
): Promise<MedicationInventoryFormState> {
  await requirePermission("update_medication_inventory");

  const medicationName = ((formData.get("medicationName") as string) || "").trim();
  const unitValue = (formData.get("unit") as string) || "";
  const currentStockValue = formData.get("currentStock") as string;
  const minimumStockValue = formData.get("minimumStock") as string;
  const notes = ((formData.get("notes") as string) || "").trim();
  const patientId = ((formData.get("patientId") as string) || "").trim();
  const unit = normalizeMedicationUnit(unitValue);

  const errors: MedicationInventoryFormState["errors"] = {};

  if (!medicationName) {
    errors.medicationName = "Ingresa el nombre del medicamento.";
  }

  if (!unit) {
    errors.unit = "Selecciona una unidad válida.";
  }

  if (!patientId) {
    errors.patientId = "Selecciona un paciente.";
  }

  const currentStock = Number.parseFloat(currentStockValue);
  const minimumStock = Number.parseFloat(minimumStockValue);

  if (Number.isNaN(currentStock) || currentStock < 0) {
    errors.currentStock = "El stock actual debe ser un número igual o mayor a 0.";
  }

  if (Number.isNaN(minimumStock) || minimumStock < 0) {
    errors.minimumStock = "El stock mínimo debe ser un número igual o mayor a 0.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisa los campos marcados e inténtalo de nuevo.",
      errors,
    };
  }

  const validatedUnit = unit ?? "TABLET";

  const existingItem = await prisma.medicationInventory.findFirst({
    where: {
      patientId,
      medicationName,
    },
  });

  if (existingItem) {
    await prisma.medicationInventory.update({
      where: { id: existingItem.id },
      data: {
        unit: validatedUnit,
        currentStock,
        minimumStock,
        notes: notes || null,
      },
    });
    refresh();

    return {
      status: "success",
      message: "Se actualizó el inventario de este medicamento.",
      errors: {},
    };
  }

  await prisma.medicationInventory.create({
    data: {
      medicationName,
      unit: validatedUnit,
      currentStock,
      minimumStock,
      notes: notes || null,
      patientId,
    },
  });
  refresh();

  return {
    status: "success",
    message: "Inventario creado correctamente.",
    errors: {},
  };
}

export async function updateMedicationInventoryItem(formData: FormData) {
  await requirePermission("update_medication_inventory");

  const inventoryItemId = ((formData.get("inventoryItemId") as string) || "").trim();
  const medicationName = ((formData.get("medicationName") as string) || "").trim();
  const unitValue = (formData.get("unit") as string) || "";
  const currentStockValue = ((formData.get("currentStock") as string) || "").trim();
  const minimumStockValue = ((formData.get("minimumStock") as string) || "").trim();
  const notes = ((formData.get("notes") as string) || "").trim();
  const patientId = ((formData.get("patientId") as string) || "").trim();
  const unit = normalizeMedicationUnit(unitValue);

  if (!inventoryItemId || !medicationName || !patientId || !unit) {
    return;
  }

  const currentStock = Number.parseFloat(currentStockValue);
  const minimumStock = Number.parseFloat(minimumStockValue);

  if (
    Number.isNaN(currentStock) ||
    currentStock < 0 ||
    Number.isNaN(minimumStock) ||
    minimumStock < 0
  ) {
    return;
  }

  const duplicate = await prisma.medicationInventory.findFirst({
    where: {
      patientId,
      medicationName,
      NOT: {
        id: inventoryItemId,
      },
    },
  });

  if (duplicate) {
    return;
  }

  await prisma.medicationInventory.update({
    where: {
      id: inventoryItemId,
    },
    data: {
      medicationName,
      patientId,
      unit,
      currentStock,
      minimumStock,
      notes: notes || null,
    },
  });

  refresh();
}

export async function createVitalSignRecord(
  _state: VitalSignFormState,
  formData: FormData
): Promise<VitalSignFormState> {
  await requirePermission("register_vital_signs");

  const patientId = ((formData.get("patientId") as string) || "").trim();
  const typeValue = ((formData.get("type") as string) || "").trim();
  const value = ((formData.get("value") as string) || "").trim();
  const unit = ((formData.get("unit") as string) || "").trim();
  const notes = ((formData.get("notes") as string) || "").trim();
  const recordedAtValue = ((formData.get("recordedAt") as string) || "").trim();

  const errors: VitalSignFormState["errors"] = {};

  if (!patientId) {
    errors.patientId = "Selecciona un paciente.";
  }

  if (!isVitalSignType(typeValue)) {
    errors.type = "Selecciona un tipo válido.";
  }

  if (!value) {
    errors.value = "Ingresa un valor.";
  }

  if (!unit) {
    errors.unit = "Ingresa una unidad.";
  }

  const parsedRecordedAt = recordedAtValue ? new Date(recordedAtValue) : null;

  if (!parsedRecordedAt || Number.isNaN(parsedRecordedAt.getTime())) {
    errors.recordedAt = "Ingresa una fecha y hora válidas.";
  }

  if (Object.keys(errors).length > 0) {
    return {
      status: "error",
      message: "Revisa los campos marcados e inténtalo de nuevo.",
      errors,
    };
  }

  await prisma.vitalSign.create({
    data: {
      patientId,
      type: typeValue,
      value,
      unit,
      notes: notes || null,
      recordedAt: parsedRecordedAt as Date,
    },
  });

  return {
    status: "success",
    message: "Signo vital registrado correctamente.",
    errors: {},
  };
}
