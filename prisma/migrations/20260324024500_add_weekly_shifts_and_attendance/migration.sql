CREATE TABLE "PlannedShift" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlannedShift_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ShiftAttendance" (
    "id" TEXT NOT NULL,
    "plannedShiftId" TEXT,
    "userId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "endedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShiftAttendance_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "PlannedShift"
ADD CONSTRAINT "PlannedShift_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ShiftAttendance"
ADD CONSTRAINT "ShiftAttendance_plannedShiftId_fkey"
FOREIGN KEY ("plannedShiftId") REFERENCES "PlannedShift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ShiftAttendance"
ADD CONSTRAINT "ShiftAttendance_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
