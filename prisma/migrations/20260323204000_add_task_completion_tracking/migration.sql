ALTER TABLE "Task"
ADD COLUMN "completedAt" TIMESTAMP(3),
ADD COLUMN "nextOccurrenceTaskId" TEXT;
