/*
  Warnings:

  - You are about to drop the column `otpRequestedAt` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `otpRequestedAt`,
    ADD COLUMN `codeRequestedAt` DATETIME(3) NULL;
