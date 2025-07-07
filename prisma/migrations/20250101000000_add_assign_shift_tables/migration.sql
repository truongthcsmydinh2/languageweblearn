-- CreateTable
CREATE TABLE `Employee` (
    `employee_id` VARCHAR(191) NOT NULL,
    `full_name` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`employee_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ShiftSlot` (
    `slot_id` INTEGER NOT NULL AUTO_INCREMENT,
    `week_start_date` DATETIME(3) NOT NULL,
    `day_of_week` INTEGER NOT NULL,
    `shift_period` ENUM('SANG', 'CHIEU', 'TOI') NOT NULL,
    `role` ENUM('PHA_CHE', 'ORDER') NOT NULL,
    `position` INTEGER NOT NULL,
    `assigned_employee_id` VARCHAR(191) NULL,
    `is_fixed` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`slot_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `ShiftSlot` ADD CONSTRAINT `ShiftSlot_assigned_employee_id_fkey` FOREIGN KEY (`assigned_employee_id`) REFERENCES `Employee`(`employee_id`) ON DELETE SET NULL ON UPDATE CASCADE; 