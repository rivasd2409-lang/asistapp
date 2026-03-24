CREATE TABLE "MedicationAdministration" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "patientId" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "dosage" TEXT,
    "instructions" TEXT,
    "administeredAt" TIMESTAMP(3) NOT NULL,
    "administeredByMemberId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationAdministration_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MedicationAdministration"
ADD CONSTRAINT "MedicationAdministration_taskId_fkey"
FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MedicationAdministration"
ADD CONSTRAINT "MedicationAdministration_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "MedicationAdministration"
ADD CONSTRAINT "MedicationAdministration_administeredByMemberId_fkey"
FOREIGN KEY ("administeredByMemberId") REFERENCES "GroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
