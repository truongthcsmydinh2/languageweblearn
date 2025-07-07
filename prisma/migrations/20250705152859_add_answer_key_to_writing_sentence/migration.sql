/*
  Warnings:

  - You are about to drop the column `answerKey` on the `WritingSentence` table. All the data in the column will be lost.
  - You are about to drop the column `level_en` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `level_vi` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `part_of_speech` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `review_time_en` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `review_time_vi` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `vocab` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `users` table. All the data in the column will be lost.
  - Added the required column `term` to the `terms` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `users_email_key` ON `users`;

-- AlterTable
ALTER TABLE `WritingLesson` MODIFY `content` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `WritingSentence` DROP COLUMN `answerKey`,
    ADD COLUMN `answer_key` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `terms` DROP COLUMN `level_en`,
    DROP COLUMN `level_vi`,
    DROP COLUMN `notes`,
    DROP COLUMN `part_of_speech`,
    DROP COLUMN `review_time_en`,
    DROP COLUMN `review_time_vi`,
    DROP COLUMN `vocab`,
    ADD COLUMN `term` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP COLUMN `email`;

-- AlterTable
ALTER TABLE `writing_submissions` MODIFY `user_answer` VARCHAR(191) NOT NULL,
    MODIFY `original_sentence` VARCHAR(191) NOT NULL,
    MODIFY `feedback` VARCHAR(191) NOT NULL,
    MODIFY `errors` VARCHAR(191) NOT NULL,
    MODIFY `suggestions` VARCHAR(191) NOT NULL,
    MODIFY `corrected_version` VARCHAR(191) NULL,
    MODIFY `advice` VARCHAR(191) NULL;
