/*
  Warnings:

  - Added the required column `type` to the `KeyValue` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RefundType" AS ENUM ('WITHDRAWAL', 'REFUND');

-- CreateEnum
CREATE TYPE "RefundServerAction" AS ENUM ('SUSPEND', 'SHORTEN', 'NONE');

-- CreateEnum
CREATE TYPE "KeyValueType" AS ENUM ('STRING', 'JSON', 'NUMBER', 'BOOLEAN', 'TEXT');

-- AlterEnum
ALTER TYPE "EmailType" ADD VALUE 'WITHDRAWAL';

-- AlterTable
ALTER TABLE "KeyValue" ADD COLUMN     "type" "KeyValueType" NOT NULL;

-- AlterTable
ALTER TABLE "Refund" ADD COLUMN     "serverAction" "RefundServerAction" NOT NULL DEFAULT 'SUSPEND',
ADD COLUMN     "type" "RefundType" NOT NULL DEFAULT 'WITHDRAWAL';
