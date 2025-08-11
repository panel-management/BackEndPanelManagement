/*
  Warnings:

  - You are about to drop the column `selectBelt` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `selectBelt`,
    ADD COLUMN `currentBeltId` INTEGER NULL;

-- CreateTable
CREATE TABLE `Belt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `color` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Belt_id_key`(`id`),
    UNIQUE INDEX `Belt_color_key`(`color`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_UserAchievedBelts` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_UserAchievedBelts_AB_unique`(`A`, `B`),
    INDEX `_UserAchievedBelts_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_currentBeltId_fkey` FOREIGN KEY (`currentBeltId`) REFERENCES `Belt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserAchievedBelts` ADD CONSTRAINT `_UserAchievedBelts_A_fkey` FOREIGN KEY (`A`) REFERENCES `Belt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserAchievedBelts` ADD CONSTRAINT `_UserAchievedBelts_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
