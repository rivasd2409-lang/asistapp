ALTER TABLE "Task"
ADD COLUMN "recurrenceType" TEXT NOT NULL DEFAULT 'NONE',
ADD COLUMN "recurrenceInterval" INTEGER,
ADD COLUMN "recurrenceUnit" TEXT;
