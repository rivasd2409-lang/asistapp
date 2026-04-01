import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const isExecuteMode = process.argv.includes("--execute");

const cleanupPlan = [
  {
    key: "logEntries",
    label: "Entradas de bitácora",
    count: () => prisma.logEntry.count(),
    deleteMany: () => prisma.logEntry.deleteMany(),
  },
  {
    key: "medicationAdministrations",
    label: "Historial de administración de medicación",
    count: () => prisma.medicationAdministration.count(),
    deleteMany: () => prisma.medicationAdministration.deleteMany(),
  },
  {
    key: "tasks",
    label: "Tareas",
    count: () => prisma.task.count(),
    deleteMany: () => prisma.task.deleteMany(),
  },
  {
    key: "vitalSigns",
    label: "Signos vitales",
    count: () => prisma.vitalSign.count(),
    deleteMany: () => prisma.vitalSign.deleteMany(),
  },
  {
    key: "medicationInventory",
    label: "Inventario de medicación",
    count: () => prisma.medicationInventory.count(),
    deleteMany: () => prisma.medicationInventory.deleteMany(),
  },
  {
    key: "shiftAttendance",
    label: "Asistencias de turno",
    count: () => prisma.shiftAttendance.count(),
    deleteMany: () => prisma.shiftAttendance.deleteMany(),
  },
  {
    key: "plannedShifts",
    label: "Turnos planificados",
    count: () => prisma.plannedShift.count(),
    deleteMany: () => prisma.plannedShift.deleteMany(),
  },
];

function printHeader(title) {
  console.log(`\n${title}`);
  console.log("=".repeat(title.length));
}

async function loadCounts() {
  const counts = {};

  for (const item of cleanupPlan) {
    counts[item.key] = await item.count();
  }

  return counts;
}

function printCounts(counts) {
  for (const item of cleanupPlan) {
    console.log(`- ${item.label}: ${counts[item.key]}`);
  }

  console.log("- Usuarios: se conservan");
  console.log("- Grupos: se conservan");
  console.log("- Pacientes: se conservan");
  console.log("- Ficha clínica / emergencias: se conserva");
  console.log("- Sesiones de autenticación: se conservan");
  console.log("- Notificaciones: no existe una tabla persistente de notificaciones en este esquema");
}

async function run() {
  printHeader("Limpieza parcial de datos operativos");
  console.log(
    isExecuteMode
      ? "Modo ejecución: se borrarán los datos operativos listados abajo."
      : "Modo simulación: no se borrará nada. Usa --execute para aplicar la limpieza."
  );

  const countsBefore = await loadCounts();

  printHeader("Resumen a limpiar");
  printCounts(countsBefore);

  if (!isExecuteMode) {
    printHeader("Cómo ejecutar");
    console.log("1. Revisa el resumen anterior.");
    console.log("2. Si estás conforme, ejecuta:");
    console.log("   npm run cleanup:operational -- --execute");
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.logEntry.deleteMany();
    await tx.medicationAdministration.deleteMany();
    await tx.task.deleteMany();
    await tx.vitalSign.deleteMany();
    await tx.medicationInventory.deleteMany();
    await tx.shiftAttendance.deleteMany();
    await tx.plannedShift.deleteMany();
  });

  const countsAfter = await loadCounts();

  printHeader("Resultado");
  for (const item of cleanupPlan) {
    console.log(
      `- ${item.label}: ${countsBefore[item.key]} -> ${countsAfter[item.key]}`
    );
  }

  console.log("\nLa app quedó intacta y se conservaron usuarios, grupos, pacientes y fichas clínicas.");
}

run()
  .catch((error) => {
    console.error("\nOcurrió un error durante la limpieza parcial:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
