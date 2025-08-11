/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `Sport` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `sport` ADD COLUMN `hasBeltSystem` BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX `Sport_id_key` ON `Sport`(`id`);
