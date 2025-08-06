-- AlterTable
ALTER TABLE `users` MODIFY `underSupervisionDoctor` BOOLEAN NULL DEFAULT true,
    MODIFY `diseaseRecords` BOOLEAN NULL DEFAULT true;
