-- CreateEnum
CREATE TYPE "TaskColumn" AS ENUM ('backlog', 'proximo_ciclo', 'fazendo', 'feito');

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT,
    "column" "TaskColumn" NOT NULL DEFAULT 'backlog',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdBy" TEXT NOT NULL DEFAULT 'rafael',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Task_title_createdBy_key" ON "Task"("title", "createdBy");
