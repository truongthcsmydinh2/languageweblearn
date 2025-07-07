/*
  Warnings:

  - You are about to drop the column `term` on the `terms` table. All the data in the column will be lost.
  - Added the required column `vocab` to the `terms` table without a default value. This is not possible if the table is not empty.
  - Added the required column `email` to the `users` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `WritingLesson` MODIFY `content` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `WritingSentence` MODIFY `answer_key` TEXT NULL;

-- AlterTable
ALTER TABLE `terms` DROP COLUMN `term`,
    ADD COLUMN `level_en` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `level_vi` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `notes` VARCHAR(191) NULL,
    ADD COLUMN `part_of_speech` VARCHAR(191) NULL,
    ADD COLUMN `review_time_en` BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN `review_time_vi` BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN `vocab` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `email` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `writing_submissions` MODIFY `user_answer` TEXT NOT NULL,
    MODIFY `original_sentence` TEXT NOT NULL,
    MODIFY `feedback` TEXT NOT NULL,
    MODIFY `errors` TEXT NOT NULL,
    MODIFY `suggestions` TEXT NOT NULL,
    MODIFY `corrected_version` TEXT NULL,
    MODIFY `advice` TEXT NULL;
