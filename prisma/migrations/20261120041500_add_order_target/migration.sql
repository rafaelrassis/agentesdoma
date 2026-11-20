-- CreateEnum
CREATE TYPE "ExecutionTarget" AS ENUM ('local', 'cloud');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "target" "ExecutionTarget" NOT NULL DEFAULT 'local';

