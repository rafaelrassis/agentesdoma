-- CreateTable
CREATE TABLE "Routine" (
    "id" TEXT NOT NULL,
    "agent" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "target" "ExecutionTarget" NOT NULL DEFAULT 'local',
    "frequencyDays" INTEGER NOT NULL DEFAULT 1,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Routine_pkey" PRIMARY KEY ("id")
);
