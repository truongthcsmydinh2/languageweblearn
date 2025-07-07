-- CreateTable
CREATE TABLE `ielts_reading_passages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `level` ENUM('beginner', 'intermediate', 'advanced') NOT NULL DEFAULT 'intermediate',
    `category` VARCHAR(100),
    `time_limit` INTEGER DEFAULT 20,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ielts_reading_questions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `passage_id` INTEGER NOT NULL,
    `question_text` TEXT NOT NULL,
    `question_type` ENUM('multiple_choice', 'true_false', 'fill_blank', 'matching') NOT NULL,
    `options` JSON,
    `correct_answer` TEXT NOT NULL,
    `explanation` TEXT,
    `order_index` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ielts_reading_attempts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firebase_uid` VARCHAR(191) NOT NULL,
    `passage_id` INTEGER NOT NULL,
    `score` INTEGER NOT NULL,
    `total_questions` INTEGER NOT NULL,
    `correct_answers` INTEGER NOT NULL,
    `time_taken` INTEGER,
    `answers` JSON,
    `completed_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ielts_reading_questions` ADD CONSTRAINT `ielts_reading_questions_passage_id_fkey` FOREIGN KEY (`passage_id`) REFERENCES `ielts_reading_passages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ielts_reading_attempts` ADD CONSTRAINT `ielts_reading_attempts_passage_id_fkey` FOREIGN KEY (`passage_id`) REFERENCES `ielts_reading_passages`(`id`) ON DELETE CASCADE ON UPDATE CASCADE; 