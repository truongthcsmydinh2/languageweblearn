/*
  Warnings:

  - You are about to drop the column `questions_content` on the `ielts_reading_passages` table. All the data in the column will be lost.
  - You are about to drop the column `passage_id` on the `ielts_reading_questions` table. All the data in the column will be lost.
  - Added the required column `group_id` to the `ielts_reading_questions` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `ielts_reading_questions` DROP FOREIGN KEY `ielts_reading_questions_passage_id_fkey`;

-- DropIndex
DROP INDEX `ielts_reading_questions_passage_id_fkey` ON `ielts_reading_questions`;

-- Thêm cột group_id trước
ALTER TABLE `ielts_reading_questions` ADD COLUMN `group_id` VARCHAR(191);

-- CreateTable
CREATE TABLE `ielts_reading_question_groups` (
    `id` VARCHAR(191) NOT NULL,
    `instructions` TEXT NOT NULL,
    `question_type` VARCHAR(191) NOT NULL,
    `display_order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `passage_id` INTEGER NOT NULL,

    INDEX `ielts_reading_question_groups_passage_id_fkey`(`passage_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Tạo các group mặc định cho các passage hiện có
INSERT INTO `ielts_reading_question_groups` (`id`, `instructions`, `question_type`, `display_order`, `passage_id`)
SELECT 
    CONCAT('legacy-group-', p.id) as id,
    'Legacy questions from previous system' as instructions,
    'multiple_choice' as question_type,
    1 as display_order,
    p.id as passage_id
FROM `ielts_reading_passages` p
WHERE EXISTS (
    SELECT 1 FROM `ielts_reading_questions` q 
    WHERE q.passage_id = p.id
);

-- Cập nhật các câu hỏi hiện có để thuộc về group mới
UPDATE `ielts_reading_questions` q
JOIN `ielts_reading_question_groups` g ON g.passage_id = q.passage_id
SET q.group_id = g.id
WHERE g.id LIKE 'legacy-group-%';

-- Đảm bảo group_id không null
UPDATE `ielts_reading_questions` 
SET `group_id` = CONCAT('legacy-group-', passage_id)
WHERE `group_id` IS NULL;

-- AlterTable
ALTER TABLE `ielts_reading_passages` DROP COLUMN `questions_content`;

-- AlterTable
ALTER TABLE `ielts_reading_questions` DROP COLUMN `passage_id`,
    MODIFY COLUMN `group_id` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE INDEX `ielts_reading_questions_group_id_fkey` ON `ielts_reading_questions`(`group_id`);

-- AddForeignKey
ALTER TABLE `ielts_reading_question_groups` ADD CONSTRAINT `ielts_reading_question_groups_passage_id_fkey` FOREIGN KEY (`passage_id`) REFERENCES `ielts_reading_passages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ielts_reading_questions` ADD CONSTRAINT `ielts_reading_questions_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `ielts_reading_question_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
