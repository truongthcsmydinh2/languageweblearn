-- AlterTable
ALTER TABLE `ielts_reading_question_groups` ADD COLUMN `content` VARCHAR(191) NULL,
    ADD COLUMN `options` JSON NULL;
