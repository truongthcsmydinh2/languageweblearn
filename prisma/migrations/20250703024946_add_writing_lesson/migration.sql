/*
  Warnings:

  - You are about to drop the column `createdAt` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `example` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `firebaseUid` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `meaning` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `time_added` on the `terms` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `terms` table. All the data in the column will be lost.
  - The primary key for the `users` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `displayName` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `firebaseUid` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `photoURL` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `users` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - The primary key for the `vocab_sets` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `is_public` on the `vocab_sets` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `vocab_sets` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `vocab_sets` table. All the data in the column will be lost.
  - You are about to alter the column `id` on the `vocab_sets` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Int`.
  - You are about to drop the `learning_sessions` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lessons` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_progress` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `user_settings` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `vocab_set_terms` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[firebase_uid]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `firebase_uid` to the `terms` table without a default value. This is not possible if the table is not empty.
  - Made the column `meanings` on table `terms` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `firebase_uid` to the `users` table without a default value. This is not possible if the table is not empty.
  - Added the required column `firebase_uid` to the `vocab_sets` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `terms` DROP FOREIGN KEY `terms_firebaseUid_fkey`;

-- DropForeignKey
ALTER TABLE `vocab_set_terms` DROP FOREIGN KEY `vocab_set_terms_term_id_fkey`;

-- DropForeignKey
ALTER TABLE `vocab_set_terms` DROP FOREIGN KEY `vocab_set_terms_vocab_set_id_fkey`;

-- DropIndex
DROP INDEX `terms_firebaseUid_vocab_key` ON `terms`;

-- DropIndex
DROP INDEX `users_firebaseUid_key` ON `users`;

-- AlterTable
ALTER TABLE `terms` DROP COLUMN `createdAt`,
    DROP COLUMN `example`,
    DROP COLUMN `firebaseUid`,
    DROP COLUMN `meaning`,
    DROP COLUMN `time_added`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `example_sentence` VARCHAR(191) NULL,
    ADD COLUMN `firebase_uid` VARCHAR(191) NOT NULL,
    ADD COLUMN `last_review_en` BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN `last_review_vi` BIGINT NOT NULL DEFAULT 0,
    ADD COLUMN `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `meanings` JSON NOT NULL;

-- AlterTable
ALTER TABLE `users` DROP PRIMARY KEY,
    DROP COLUMN `createdAt`,
    DROP COLUMN `displayName`,
    DROP COLUMN `firebaseUid`,
    DROP COLUMN `photoURL`,
    DROP COLUMN `updatedAt`,
    ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `display_name` VARCHAR(191) NULL,
    ADD COLUMN `firebase_uid` VARCHAR(191) NOT NULL,
    ADD COLUMN `is_admin` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `last_login` DATETIME(3) NULL,
    ADD COLUMN `photo_url` VARCHAR(191) NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- AlterTable
ALTER TABLE `vocab_sets` DROP PRIMARY KEY,
    DROP COLUMN `is_public`,
    DROP COLUMN `updated_at`,
    DROP COLUMN `user_id`,
    ADD COLUMN `firebase_uid` VARCHAR(191) NOT NULL,
    MODIFY `id` INTEGER NOT NULL AUTO_INCREMENT,
    ADD PRIMARY KEY (`id`);

-- DropTable
DROP TABLE `learning_sessions`;

-- DropTable
DROP TABLE `lessons`;

-- DropTable
DROP TABLE `user_progress`;

-- DropTable
DROP TABLE `user_settings`;

-- DropTable
DROP TABLE `vocab_set_terms`;

-- CreateTable
CREATE TABLE `set_terms` (
    `vocab_set_id` INTEGER NOT NULL,
    `term_id` INTEGER NOT NULL,

    PRIMARY KEY (`vocab_set_id`, `term_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `api_keys` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `service` VARCHAR(191) NOT NULL,
    `api_key` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `token_usage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `api_key_id` INTEGER NOT NULL,
    `service` VARCHAR(191) NOT NULL,
    `tokens_used` INTEGER NOT NULL DEFAULT 0,
    `cost` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `dictation_lessons` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `audio_url` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WritingLesson` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WritingSentence` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `lesson_id` INTEGER NOT NULL,
    `sentence_order` INTEGER NOT NULL,
    `vietnamese` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `WritingSentence_lesson_id_sentence_order_key`(`lesson_id`, `sentence_order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `users_firebase_uid_key` ON `users`(`firebase_uid`);

-- AddForeignKey
ALTER TABLE `terms` ADD CONSTRAINT `terms_firebase_uid_fkey` FOREIGN KEY (`firebase_uid`) REFERENCES `users`(`firebase_uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `vocab_sets` ADD CONSTRAINT `vocab_sets_firebase_uid_fkey` FOREIGN KEY (`firebase_uid`) REFERENCES `users`(`firebase_uid`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `set_terms` ADD CONSTRAINT `set_terms_vocab_set_id_fkey` FOREIGN KEY (`vocab_set_id`) REFERENCES `vocab_sets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `set_terms` ADD CONSTRAINT `set_terms_term_id_fkey` FOREIGN KEY (`term_id`) REFERENCES `terms`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `token_usage` ADD CONSTRAINT `token_usage_api_key_id_fkey` FOREIGN KEY (`api_key_id`) REFERENCES `api_keys`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WritingSentence` ADD CONSTRAINT `WritingSentence_lesson_id_fkey` FOREIGN KEY (`lesson_id`) REFERENCES `WritingLesson`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
