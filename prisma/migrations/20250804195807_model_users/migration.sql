-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(191) NOT NULL,
    `type` INTEGER NOT NULL DEFAULT 2,
    `address` TEXT NULL,
    `phoneNumber` VARCHAR(191) NOT NULL,
    `nationalCode` VARCHAR(191) NOT NULL,
    `age` INTEGER NULL,
    `image` VARCHAR(191) NULL,
    `phoneNumberEmergency` VARCHAR(191) NULL,
    `underSupervisionDoctor` BOOLEAN NULL DEFAULT false,
    `diseaseRecords` BOOLEAN NULL DEFAULT false,
    `selectSport` JSON NOT NULL,
    `selectBelt` JSON NULL,
    `history` TEXT NULL,
    `certificates` VARCHAR(191) NULL,
    `prise` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING') NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_phoneNumber_key`(`phoneNumber`),
    UNIQUE INDEX `users_nationalCode_key`(`nationalCode`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
