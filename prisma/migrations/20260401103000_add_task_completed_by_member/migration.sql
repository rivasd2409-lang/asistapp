ALTER TABLE "Task"
ADD COLUMN "completedByMemberId" TEXT;

ALTER TABLE "Task"
ADD CONSTRAINT "Task_completedByMemberId_fkey"
FOREIGN KEY ("completedByMemberId") REFERENCES "GroupMember"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
