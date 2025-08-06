/*
  Warnings:

  - Added the required column `code` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `users` ADD COLUMN `code` VARCHAR(191) NOT NULL,
    MODIFY `type` INTEGER NOT NULL DEFAULT 1;
