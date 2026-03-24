ALTER TABLE "MedicationAdministration"
ADD COLUMN "recordedByMemberId" TEXT;

ALTER TABLE "MedicationAdministration"
ADD CONSTRAINT "MedicationAdministration_recordedByMemberId_fkey"
FOREIGN KEY ("recordedByMemberId") REFERENCES "GroupMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
