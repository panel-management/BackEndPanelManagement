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
    `history` TEXT NULL,
    `certificates` VARCHAR(191) NULL,
    `prise` INTEGER NULL,
    `masterId` INTEGER NULL,
    `currentBeltId` INTEGER NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'PENDING') NULL DEFAULT 'PENDING',
    `active` ENUM('ENABLE', 'DISABLE') NOT NULL DEFAULT 'ENABLE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_user_id_key`(`user_id`),
    UNIQUE INDEX `users_phoneNumber_key`(`phoneNumber`),
    UNIQUE INDEX `users_nationalCode_key`(`nationalCode`),
    PRIMARY KEY (`user_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Belt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `color` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `Belt_id_key`(`id`),
    UNIQUE INDEX `Belt_color_key`(`color`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Sport` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `hasBeltSystem` BOOLEAN NOT NULL DEFAULT false,

    UNIQUE INDEX `Sport_id_key`(`id`),
    UNIQUE INDEX `Sport_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Attendance` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') NOT NULL,
    `studentId` INTEGER NOT NULL,
    `markedById` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Attendance_id_key`(`id`),
    UNIQUE INDEX `Attendance_date_studentId_key`(`date`, `studentId`),
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
ALTER TABLE `users` ADD CONSTRAINT `users_sportId_fkey` FOREIGN KEY (`sportId`) REFERENCES `Sport`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_masterId_fkey` FOREIGN KEY (`masterId`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_currentBeltId_fkey` FOREIGN KEY (`currentBeltId`) REFERENCES `Belt`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Attendance` ADD CONSTRAINT `Attendance_markedById_fkey` FOREIGN KEY (`markedById`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserAchievedBelts` ADD CONSTRAINT `_UserAchievedBelts_A_fkey` FOREIGN KEY (`A`) REFERENCES `Belt`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_UserAchievedBelts` ADD CONSTRAINT `_UserAchievedBelts_B_fkey` FOREIGN KEY (`B`) REFERENCES `users`(`user_id`) ON DELETE CASCADE ON UPDATE CASCADE;
