-- AlterTable
ALTER TABLE `overtime` ADD COLUMN `payAmount` INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `overtimeRate` INTEGER NOT NULL DEFAULT 0;
