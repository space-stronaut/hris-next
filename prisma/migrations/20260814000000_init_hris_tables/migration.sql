-- CreateTable
CREATE TABLE `tb_hris_company` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `checkInTime` VARCHAR(191) NOT NULL DEFAULT '08:00',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tb_hris_company_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_location` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `radiusMeters` INTEGER NOT NULL DEFAULT 100,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_shift` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `checkIn` VARCHAR(191) NOT NULL DEFAULT '08:00',
    `checkOut` VARCHAR(191) NOT NULL DEFAULT '17:00',
    `tolerance` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_roster` (
    `id` VARCHAR(191) NOT NULL,
    `companyId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dateKey` VARCHAR(191) NOT NULL,
    `shiftId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tb_hris_roster_userId_dateKey_key`(`userId`, `dateKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_user` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('SUPER_ADMIN', 'ADMIN', 'HRD', 'KARYAWAN') NOT NULL DEFAULT 'KARYAWAN',
    `companyId` VARCHAR(191) NULL,
    `shiftId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `baseSalary` INTEGER NOT NULL DEFAULT 0,
    `overtimeRate` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tb_hris_user_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_attendance` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dateKey` VARCHAR(191) NOT NULL,
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `breakIn` DATETIME(3) NULL,
    `breakOut` DATETIME(3) NULL,
    `checkInPhoto` VARCHAR(191) NULL,
    `checkOutPhoto` VARCHAR(191) NULL,
    `checkInLat` DOUBLE NULL,
    `checkInLng` DOUBLE NULL,
    `checkOutLat` DOUBLE NULL,
    `checkOutLng` DOUBLE NULL,
    `checkInLocationId` VARCHAR(191) NULL,
    `checkOutLocationId` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'HADIR',
    `recordType` ENUM('OFFICE', 'WFH', 'DINAS') NOT NULL DEFAULT 'OFFICE',
    `shiftId` VARCHAR(191) NULL,
    `shiftCheckIn` VARCHAR(191) NULL,
    `shiftCheckOut` VARCHAR(191) NULL,
    `lateMinutes` INTEGER NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tb_hris_attendance_userId_dateKey_key`(`userId`, `dateKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_overtime` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `dateKey` VARCHAR(191) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `durationMinutes` INTEGER NOT NULL,
    `payAmount` INTEGER NOT NULL DEFAULT 0,
    `reason` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_attendance_correction` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `attendanceId` VARCHAR(191) NOT NULL,
    `requestedCheckIn` DATETIME(3) NULL,
    `requestedCheckOut` DATETIME(3) NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_leave` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `startDate` VARCHAR(191) NOT NULL,
    `endDate` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_payroll` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `period` VARCHAR(191) NOT NULL,
    `baseSalary` INTEGER NOT NULL,
    `allowance` INTEGER NOT NULL DEFAULT 0,
    `bonus` INTEGER NOT NULL DEFAULT 0,
    `deduction` INTEGER NOT NULL DEFAULT 0,
    `netSalary` INTEGER NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'DRAFT',
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tb_hris_payroll_userId_period_key`(`userId`, `period`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_claim` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `amount` INTEGER NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'PENDING',
    `approvedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_meeting` (
    `id` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `date` VARCHAR(191) NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NOT NULL,
    `agenda` VARCHAR(191) NULL,
    `companyId` VARCHAR(191) NULL,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_meeting_participant` (
    `id` VARCHAR(191) NOT NULL,
    `meetingId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `tb_hris_meeting_participant_meetingId_userId_key`(`meetingId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tb_hris_notification` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `read` BOOLEAN NOT NULL DEFAULT false,
    `meetingId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `tb_hris_location` ADD CONSTRAINT `tb_hris_location_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `tb_hris_company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_shift` ADD CONSTRAINT `tb_hris_shift_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `tb_hris_company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_roster` ADD CONSTRAINT `tb_hris_roster_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `tb_hris_company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_roster` ADD CONSTRAINT `tb_hris_roster_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tb_hris_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_roster` ADD CONSTRAINT `tb_hris_roster_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `tb_hris_shift`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_user` ADD CONSTRAINT `tb_hris_user_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `tb_hris_company`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_user` ADD CONSTRAINT `tb_hris_user_shiftId_fkey` FOREIGN KEY (`shiftId`) REFERENCES `tb_hris_shift`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_attendance` ADD CONSTRAINT `tb_hris_attendance_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tb_hris_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_attendance` ADD CONSTRAINT `tb_hris_attendance_checkInLocationId_fkey` FOREIGN KEY (`checkInLocationId`) REFERENCES `tb_hris_location`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_attendance` ADD CONSTRAINT `tb_hris_attendance_checkOutLocationId_fkey` FOREIGN KEY (`checkOutLocationId`) REFERENCES `tb_hris_location`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_overtime` ADD CONSTRAINT `tb_hris_overtime_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tb_hris_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_overtime` ADD CONSTRAINT `tb_hris_overtime_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `tb_hris_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_attendance_correction` ADD CONSTRAINT `tb_hris_attendance_correction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tb_hris_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_attendance_correction` ADD CONSTRAINT `tb_hris_attendance_correction_attendanceId_fkey` FOREIGN KEY (`attendanceId`) REFERENCES `tb_hris_attendance`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_attendance_correction` ADD CONSTRAINT `tb_hris_attendance_correction_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `tb_hris_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_leave` ADD CONSTRAINT `tb_hris_leave_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tb_hris_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_leave` ADD CONSTRAINT `tb_hris_leave_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `tb_hris_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_payroll` ADD CONSTRAINT `tb_hris_payroll_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tb_hris_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_claim` ADD CONSTRAINT `tb_hris_claim_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tb_hris_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_claim` ADD CONSTRAINT `tb_hris_claim_approvedById_fkey` FOREIGN KEY (`approvedById`) REFERENCES `tb_hris_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_meeting` ADD CONSTRAINT `tb_hris_meeting_companyId_fkey` FOREIGN KEY (`companyId`) REFERENCES `tb_hris_company`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_meeting` ADD CONSTRAINT `tb_hris_meeting_createdById_fkey` FOREIGN KEY (`createdById`) REFERENCES `tb_hris_user`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_meeting_participant` ADD CONSTRAINT `tb_hris_meeting_participant_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `tb_hris_meeting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_meeting_participant` ADD CONSTRAINT `tb_hris_meeting_participant_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tb_hris_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_notification` ADD CONSTRAINT `tb_hris_notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `tb_hris_user`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tb_hris_notification` ADD CONSTRAINT `tb_hris_notification_meetingId_fkey` FOREIGN KEY (`meetingId`) REFERENCES `tb_hris_meeting`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
