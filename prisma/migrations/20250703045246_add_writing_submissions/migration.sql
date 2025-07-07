-- CreateTable
CREATE TABLE `writing_submissions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lesson_id` INTEGER NOT NULL,
    `sentence_id` INTEGER NOT NULL,
    `user_answer` TEXT NOT NULL,
    `original_sentence` TEXT NOT NULL,
    `score` INTEGER NOT NULL,
    `feedback` TEXT NOT NULL,
    `errors` TEXT NOT NULL,
    `suggestions` TEXT NOT NULL,
    `corrected_version` TEXT NULL,
    `advice` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `writing_submissions` ADD CONSTRAINT `writing_submissions_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `WritingLesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `writing_submissions` ADD CONSTRAINT `writing_submissions_sentence_id_fkey` FOREIGN KEY (`sentence_id`) REFERENCES `WritingSentence`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
