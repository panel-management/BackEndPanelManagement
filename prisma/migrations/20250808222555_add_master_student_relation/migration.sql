-- AlterTable
ALTER TABLE `users` ADD COLUMN `masterId` INTEGER NULL;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_masterId_fkey` FOREIGN KEY (`masterId`) REFERENCES `users`(`user_id`) ON DELETE SET NULL ON UPDATE CASCADE;
