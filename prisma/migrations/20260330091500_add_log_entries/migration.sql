CREATE TABLE "LogEntry" (
  "id" TEXT NOT NULL,
  "patientId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "shiftAttendanceId" TEXT,
  "category" TEXT NOT NULL,
  "note" TEXT NOT NULL,
  "priority" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "LogEntry_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "LogEntry"
ADD CONSTRAINT "LogEntry_patientId_fkey"
FOREIGN KEY ("patientId") REFERENCES "Patient"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LogEntry"
ADD CONSTRAINT "LogEntry_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "LogEntry"
ADD CONSTRAINT "LogEntry_shiftAttendanceId_fkey"
FOREIGN KEY ("shiftAttendanceId") REFERENCES "ShiftAttendance"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "LogEntry_patientId_createdAt_idx" ON "LogEntry"("patientId", "createdAt");
CREATE INDEX "LogEntry_userId_createdAt_idx" ON "LogEntry"("userId", "createdAt");
