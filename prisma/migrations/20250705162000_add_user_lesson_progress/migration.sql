-- CreateTable
CREATE TABLE `user_lesson_progress` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firebase_uid` VARCHAR(191) NOT NULL,
    `lesson_id` INTEGER NOT NULL,
    `current_sentence` INTEGER NOT NULL DEFAULT 0,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `user_lesson_progress_firebase_uid_lesson_id_key`(`firebase_uid`, `lesson_id`),
    INDEX `user_lesson_progress_firebase_uid_idx`(`firebase_uid`),
    INDEX `user_lesson_progress_lesson_id_fkey`(`lesson_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `user_lesson_progress` ADD CONSTRAINT `user_lesson_progress_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `WritingLesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE; 