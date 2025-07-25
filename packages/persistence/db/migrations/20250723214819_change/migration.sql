/*
  Warnings:

  - You are about to drop the `Command` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `apiURL` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Command" DROP CONSTRAINT "Command_projectId_fkey";

-- DropForeignKey
ALTER TABLE "Command" DROP CONSTRAINT "Command_userId_fkey";

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "apiURL" SET NOT NULL;

-- DropTable
DROP TABLE "Command";
