CREATE TABLE "MedicationInventory" (
    "id" TEXT NOT NULL,
    "medicationName" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "currentStock" INTEGER NOT NULL,
    "minimumStock" INTEGER NOT NULL,
    "notes" TEXT,
    "patientId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MedicationInventory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "MedicationInventory"
ADD CONSTRAINT "MedicationInventory_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
