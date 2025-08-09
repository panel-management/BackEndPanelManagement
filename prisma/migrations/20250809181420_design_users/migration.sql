-- CreateTable
CREATE TABLE `users` (
    `user_id` INTEGER NOT NULL AUTO_INCREMENT,
    `fullName` VARCHAR(191) NULL,
    `phoneNumber` VARCHAR(191) NULL,
    `code` VARCHAR(191) NULL,
    `codeRequestedAt` DATETIME(3) NULL,
    `type` INTEGER NOT NULL DEFAULT 1,
    `address` TEXT NULL,
    `nationalCode` VARCHAR(191) NULL,
    `age` INTEGER NULL,
    `birthDate` VARCHAR(191) NULL,
    `image` VARCHAR(191) NULL,
    `phoneNumberEmergency` VARCHAR(191) NULL,
    `underSupervisionDoctor` BOOLEAN NULL DEFAULT false,
    `diseaseRecords` BOOLEAN NULL DEFAULT false,
    `sportId` INTEGER NULL,
    `selectBelt` JSON NULL,
    `history` TEXT NULL,
    `certificates` VARCHAR(191) NULL,
    `prise` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING') NULL DEFAULT 'PENDING',
    `active` ENUM('ENABLE', 'DISABLE') NOT NULL DEFAULT 'ENABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `masterId` INTEGER NULL,

    UNIQUE INDEX `users_user_id_key`(`user_id`),
    UNIQUE INDEX `users_phoneNumber_key`(`phoneNumber`),
    UNIQUE INDEX `users_nationalCode_key`(`nationalCode`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Sport_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_sportId_fkey` FOREIGN KEY (`sportId`) REFERENCES `Sport`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_masterId_fkey` FOREIGN KEY (`masterId`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
