/*
  Warnings:

  - You are about to drop the column `archived` on the `Client` table. All the data in the column will be lost.
  - You are about to drop the column `archived` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Client" DROP COLUMN "archived";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "archived";
