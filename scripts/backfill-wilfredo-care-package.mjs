import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const isExecuteMode = process.argv.includes("--execute");

const MEDICATION_INVENTORY_ITEMS = [
  { medicationName: "Levotiroxina", unit: "TABLET", notes: "100 mcg. Mañana (1.º medicamento)." },
  { medicationName: "Furosemida", unit: "TABLET", notes: "40 mg. Condicional: solo si está alimentándose e hidratándose bien." },
  { medicationName: "Vymada (sacubitrilo/valsartán)", unit: "TABLET", notes: "50 mg. Mañana." },
  { medicationName: "Procoralan (ivabradina)", unit: "TABLET", notes: "5 mg. Dos dosis al día." },
  { medicationName: "Apixabán (Eliquis)", unit: "TABLET", notes: "5 mg. Dos dosis al día." },
  { medicationName: "Bisoprolol", unit: "TABLET", notes: "5 mg. Mañana." },
  { medicationName: "Forxiga (dapagliflozina)", unit: "TABLET", notes: "10 mg. Mañana." },
  { medicationName: "Espironolactona", unit: "TABLET", notes: "25 mg. Condicional: solo si está alimentándose e hidratándose bien." },
  { medicationName: "Eranz (donepezilo)", unit: "TABLET", notes: "5 mg. Usar si hay disponibilidad." },
  { medicationName: "Memcer (memantina)", unit: "TABLET", notes: "10 mg. Alternativa cuando no hay Eranz." },
  { medicationName: "Ilimit (aripiprazol)", unit: "ML", notes: "1 mg. Solución: 5 cc." },
  { medicationName: "Olexa (olanzapina)", unit: "TABLET", notes: "5 mg. Tarde/noche." },
  { medicationName: "Neogaival / Neogaival 2 (eszopiclona)", unit: "TABLET", notes: "2 mg. Antes de dormir." },
  { medicationName: "Rebasin gotas", unit: "DROP", notes: "5–10 gotas. Solo PRN en crisis." },
];

const MEDICATION_TASKS = [
  {
    title: "Levotiroxina",
    medicationName: "Levotiroxina",
    dosage: "100 mcg",
    dueTime: "06:30",
    scheduleLabel: "Mañana (1.º medicamento)",
    instructions:
      "En ayunas y en cuanto se levante. Comer ~50 min después. Luego protector gástrico (manzanilla o Sucradel + miel).",
  },
  {
    title: "Furosemida",
    medicationName: "Furosemida",
    dosage: "40 mg",
    dueTime: "07:15",
    scheduleLabel: "Mañana (condicional)",
    instructions:
      "Solo si está alimentándose e hidratándose bien. Vigilar presión arterial y orina.",
  },
  {
    title: "Vymada",
    medicationName: "Vymada (sacubitrilo/valsartán)",
    dosage: "50 mg",
    dueTime: "07:30",
    scheduleLabel: "Mañana",
    instructions:
      "Puede bajar la presión. Vigilar mareos.",
  },
  {
    title: "Procoralan",
    medicationName: "Procoralan (ivabradina)",
    dosage: "5 mg",
    dueTime: "07:45",
    scheduleLabel: "Mañana",
    instructions:
      "Puede bajar el pulso. Vigilar bradicardia y mareos.",
  },
  {
    title: "Apixabán",
    medicationName: "Apixabán (Eliquis)",
    dosage: "5 mg",
    dueTime: "08:00",
    scheduleLabel: "Mañana",
    instructions:
      "Anticoagulante. Vigilar caídas y golpes.",
  },
  {
    title: "Bisoprolol",
    medicationName: "Bisoprolol",
    dosage: "5 mg",
    dueTime: "08:10",
    scheduleLabel: "Mañana",
    instructions:
      "Vigilar pulso y presión.",
  },
  {
    title: "Forxiga",
    medicationName: "Forxiga (dapagliflozina)",
    dosage: "10 mg",
    dueTime: "08:20",
    scheduleLabel: "Mañana",
    instructions:
      "Puede aumentar orina. Vigilar hidratación.",
  },
  {
    title: "Espironolactona",
    medicationName: "Espironolactona",
    dosage: "25 mg",
    dueTime: "08:30",
    scheduleLabel: "Mañana (condicional)",
    instructions:
      "Solo si está alimentándose e hidratándose bien. Vigilar potasio y riñón.",
  },
  {
    title: "Eranz / alternativa Memcer",
    medicationName: "Eranz (donepezilo)",
    dosage: "5 mg",
    dueTime: "08:45",
    scheduleLabel: "Mañana",
    instructions:
      "Si hay Eranz, administrar 5 mg. Si NO hay Eranz, usar Memcer (memantina) 10 mg en su lugar.",
  },
  {
    title: "Ilimit",
    medicationName: "Ilimit (aripiprazol)",
    dosage: "1 mg (solución: 5 cc)",
    dueTime: "17:30",
    scheduleLabel: "Tarde 5:00–6:00 pm",
    instructions:
      "Mantener horario fijo. Según concentración indicada en frasco.",
  },
  {
    title: "Procoralan",
    medicationName: "Procoralan (ivabradina)",
    dosage: "5 mg",
    dueTime: "18:15",
    scheduleLabel: "Tarde 6:00–7:00 pm",
    instructions:
      "2.ª dosis del día.",
  },
  {
    title: "Apixabán",
    medicationName: "Apixabán (Eliquis)",
    dosage: "5 mg",
    dueTime: "18:20",
    scheduleLabel: "Tarde 6:00–7:00 pm",
    instructions:
      "2.ª dosis del día.",
  },
  {
    title: "Olexa",
    medicationName: "Olexa (olanzapina)",
    dosage: "5 mg",
    dueTime: "18:30",
    scheduleLabel: "Tarde/noche 6:00–7:00 pm",
    instructions:
      "1 tableta cada noche. Puede dar somnolencia; vigilar caídas.",
  },
  {
    title: "Neogaival",
    medicationName: "Neogaival / Neogaival 2 (eszopiclona)",
    dosage: "2 mg",
    dueTime: "20:30",
    scheduleLabel: "Antes de dormir 8:00–9:00 pm",
    instructions:
      "Última pastilla. Dar al menos 30 min antes de dormir. Vigilar somnolencia al día siguiente.",
  },
];

const OPERATIONAL_TASKS = [
  {
    title: "Revisión inicial / estado general",
    category: "GENERAL",
    dueTime: "07:00",
    description:
      "Checklist de Turnos y firmas. Verificar estado general al inicio del día y dejar observación breve.",
  },
  {
    title: "Presión y pulso",
    category: "VITAL_SIGNS",
    dueTime: "08:05",
    description:
      "Registrar presión y pulso en ambos turnos según el checklist de Turnos y firmas.",
  },
  {
    title: "Hidratación",
    category: "GENERAL",
    dueTime: "10:00",
    description:
      "Verificar agua o té ofrecido y registrar tolerancia de hidratación.",
  },
  {
    title: "Comidas",
    category: "MEAL",
    dueTime: "12:00",
    description:
      "Supervisar desayuno, almuerzo y cena. Registrar aceptación y observaciones importantes.",
  },
  {
    title: "Registro de pipí",
    category: "GENERAL",
    dueTime: "13:00",
    description:
      "Registrar frecuencia y observaciones del pipí durante el día.",
  },
  {
    title: "Registro de evacuación",
    category: "GENERAL",
    dueTime: "14:00",
    description:
      "Registrar si hubo evacuación y cualquier observación relevante.",
  },
  {
    title: "Medicación administrada",
    category: "GENERAL",
    dueTime: "19:00",
    description:
      "Verificar que la medicación del día fue administrada y dejar nota operativa si hace falta.",
  },
  {
    title: "Aseo / pañal / ropa",
    category: "HYGIENE",
    dueTime: "09:30",
    description:
      "Revisar aseo, pañal, ropa limpia y confort general.",
  },
  {
    title: "Conducta + manejo",
    category: "GENERAL",
    dueTime: "16:00",
    description:
      "Observar ansiedad, agresividad o confusión y registrar el manejo realizado.",
  },
  {
    title: "Apoyo a Mamá",
    category: "GENERAL",
    dueTime: "17:00",
    description:
      "Verificar agua, medicinas, suplementos o apoyo práctico requerido para Mamá.",
  },
  {
    title: "Observación del sueño",
    category: "GENERAL",
    dueTime: "21:15",
    description:
      "Registrar cómo inicia la noche y cualquier observación del sueño.",
  },
  {
    title: "Entrega de turno",
    category: "GENERAL",
    dueTime: "19:30",
    description:
      "Dejar entrega de turno clara para el siguiente cuidador.",
  },
];

function printHeader(title) {
  console.log(`\n${title}`);
  console.log("=".repeat(title.length));
}

function getTimeKeyFromDate(date) {
  const hours = `${date.getHours()}`.padStart(2, "0");
  const minutes = `${date.getMinutes()}`.padStart(2, "0");
  return `${hours}:${minutes}`;
}

function getNextDueDate(timeValue) {
  const [hoursValue, minutesValue] = timeValue.split(":");
  const hours = Number.parseInt(hoursValue, 10);
  const minutes = Number.parseInt(minutesValue, 10);

  const now = new Date();
  const dueDate = new Date(now);
  dueDate.setSeconds(0, 0);
  dueDate.setHours(hours, minutes, 0, 0);

  if (dueDate.getTime() <= now.getTime()) {
    dueDate.setDate(dueDate.getDate() + 1);
  }

  return dueDate;
}

function buildMedicationTaskDescription(task) {
  return `Paquete de cuidado (Sección 1). Horario sugerido: ${task.scheduleLabel}.`;
}

function buildMedicationTaskFingerprint(patientId, task) {
  return [
    patientId,
    "MEDICATION",
    task.title,
    task.medicationName,
    task.dueTime,
    "DAILY",
  ].join("::");
}

function buildOperationalTaskFingerprint(patientId, task) {
  return [
    patientId,
    task.category,
    task.title,
    task.dueTime,
    "DAILY",
  ].join("::");
}

function buildExistingTaskFingerprint(task) {
  return [
    task.patientId,
    task.category,
    task.title,
    task.medicationName || "",
    task.dueDate ? getTimeKeyFromDate(task.dueDate) : "",
    task.recurrenceType,
  ].join("::");
}

async function run() {
  printHeader("Backfill inicial para Wilfredo Rivas Flores");
  console.log(
    isExecuteMode
      ? "Modo ejecución: se crearán inventario y tareas recurrentes si no existen."
      : "Modo simulación: no se escribirá nada. Usa --execute para aplicar el backfill."
  );

  const patient = await prisma.patient.findFirst({
    where: {
      name: "Wilfredo Rivas Flores",
    },
  });

  if (!patient) {
    throw new Error(
      "No se encontró el paciente Wilfredo Rivas Flores. El backfill requiere que ya exista en la base."
    );
  }

  const [existingInventory, existingTasks] = await Promise.all([
    prisma.medicationInventory.findMany({
      where: {
        patientId: patient.id,
      },
    }),
    prisma.task.findMany({
      where: {
        patientId: patient.id,
        recurrenceType: "DAILY",
      },
    }),
  ]);

  const existingInventoryByName = new Map(
    existingInventory.map((item) => [item.medicationName, item])
  );
  const existingTaskFingerprints = new Set(
    existingTasks.map(buildExistingTaskFingerprint)
  );

  const inventoryToCreate = MEDICATION_INVENTORY_ITEMS.filter(
    (item) => !existingInventoryByName.has(item.medicationName)
  );

  const medicationTasksToCreate = MEDICATION_TASKS.filter((task) => {
    return !existingTaskFingerprints.has(
      buildMedicationTaskFingerprint(patient.id, task)
    );
  });

  const operationalTasksToCreate = OPERATIONAL_TASKS.filter((task) => {
    return !existingTaskFingerprints.has(
      buildOperationalTaskFingerprint(patient.id, task)
    );
  });

  printHeader("Modelos que se poblarán");
  console.log("- MedicationInventory");
  console.log("- Task");

  printHeader("Inventario a crear");
  if (inventoryToCreate.length === 0) {
    console.log("- No hay medicamentos nuevos por crear.");
  } else {
    for (const item of inventoryToCreate) {
      console.log(`- ${item.medicationName} [unidad: ${item.unit}]`);
    }
  }

  printHeader("Tareas recurrentes de medicación a crear");
  if (medicationTasksToCreate.length === 0) {
    console.log("- No hay tareas nuevas de medicación por crear.");
  } else {
    for (const task of medicationTasksToCreate) {
      console.log(`- ${task.title} (${task.scheduleLabel})`);
    }
  }

  printHeader("Tareas operativas diarias a crear");
  if (operationalTasksToCreate.length === 0) {
    console.log("- No hay tareas operativas nuevas por crear.");
  } else {
    for (const task of operationalTasksToCreate) {
      console.log(`- ${task.title} (${task.dueTime})`);
    }
  }

  printHeader("Protección contra duplicados");
  console.log("- Inventario: se omite cualquier medicamento que ya exista para Wilfredo con el mismo nombre.");
  console.log("- Tareas: se omite cualquier tarea diaria existente que ya coincida por paciente, categoría, título, medicamento y hora.");
  console.log("- El script es idempotente: si lo vuelves a ejecutar, solo intentará crear lo que aún falte.");

  if (!isExecuteMode) {
    printHeader("Cómo ejecutar");
    console.log("1. Revisa el resumen anterior.");
    console.log("2. Si estás conforme, ejecuta:");
    console.log("   npm run backfill:wilfredo-care-package -- --execute");
    return;
  }

  const results = {
    inventoryCreated: 0,
    medicationTasksCreated: 0,
    operationalTasksCreated: 0,
  };

  
    for (const item of inventoryToCreate) {
      await prisma.medicationInventory.create({
        data: {
          patientId: patient.id,
          medicationName: item.medicationName,
          unit: item.unit,
          currentStock: 10,
          minimumStock: 4,
          notes: item.notes,
        },
      });

      results.inventoryCreated += 1;
    }

    for (const task of medicationTasksToCreate) {
      await prisma.task.create({
        data: {
          patientId: patient.id,
          title: task.title,
          description: buildMedicationTaskDescription(task),
          category: "MEDICATION",
          medicationName: task.medicationName,
          dosage: task.dosage,
          instructions: task.instructions,
          status: "PENDING",
          recurrenceType: "DAILY",
          dueDate: getNextDueDate(task.dueTime),
        },
      });

      results.medicationTasksCreated += 1;
    }

    for (const task of operationalTasksToCreate) {
      await prisma.task.create({
        data: {
          patientId: patient.id,
          title: task.title,
          description: `Paquete de cuidado (Sección 3). ${task.description}`,
          category: task.category,
          status: "PENDING",
          recurrenceType: "DAILY",
          dueDate: getNextDueDate(task.dueTime),
        },
      });

      results.operationalTasksCreated += 1;
    }
  printHeader("Resultado");
  console.log(`- Inventario creado: ${results.inventoryCreated}`);
  console.log(`- Tareas recurrentes de medicación creadas: ${results.medicationTasksCreated}`);
  console.log(`- Tareas operativas diarias creadas: ${results.operationalTasksCreated}`);
  console.log("- Rebasin no se creó como tarea fija diaria porque el documento la marca solo PRN en crisis.");
}

run()
  .catch((error) => {
    console.error("\nOcurrió un error durante el backfill:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
