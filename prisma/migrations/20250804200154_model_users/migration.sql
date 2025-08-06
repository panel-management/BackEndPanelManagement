-- AlterTable
ALTER TABLE `users` MODIFY `underSupervisionDoctor` BOOLEAN NULL DEFAULT false,
    MODIFY `diseaseRecords` BOOLEAN NULL DEFAULT false;
