-- CreateTable
CREATE TABLE "CloudSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "coletorCloudEnabled" BOOLEAN NOT NULL DEFAULT false,
    "shopeeStorageState" JSONB,
    "shopeeSessionSavedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CloudSettings_pkey" PRIMARY KEY ("id")
);

