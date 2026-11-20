-- CreateTable
CREATE TABLE "WorkerHeartbeat" (
    "target" TEXT NOT NULL,
    "lastSeenAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkerHeartbeat_pkey" PRIMARY KEY ("target")
);
