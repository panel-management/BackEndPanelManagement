-- AlterTable
ALTER TABLE `users` MODIFY `fullName` VARCHAR(191) NULL,
    MODIFY `phoneNumber` VARCHAR(191) NULL,
    MODIFY `nationalCode` VARCHAR(191) NULL,
    MODIFY `selectSport` JSON NULL,
    MODIFY `code` VARCHAR(191) NULL;
