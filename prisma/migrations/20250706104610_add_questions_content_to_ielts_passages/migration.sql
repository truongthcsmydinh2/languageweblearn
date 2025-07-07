/*
  Warnings:

  - You are about to alter the column `title` on the `ielts_reading_passages` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - Made the column `time_limit` on table `ielts_reading_passages` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `ielts_reading_passages` ADD COLUMN `questions_content` TEXT NULL,
    MODIFY `title` VARCHAR(191) NOT NULL,
    MODIFY `category` VARCHAR(191) NULL,
    MODIFY `time_limit` INTEGER NOT NULL DEFAULT 20,
    MODIFY `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `ielts_reading_attempts_firebase_uid_idx` ON `ielts_reading_attempts`(`firebase_uid`);
