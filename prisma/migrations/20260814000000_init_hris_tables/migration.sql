-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'HRD', 'KARYAWAN');

-- CreateEnum
CREATE TYPE "RecordType" AS ENUM ('OFFICE', 'WFH', 'DINAS');

-- CreateTable
CREATE TABLE "tb_hris_company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "checkInTime" TEXT NOT NULL DEFAULT '08:00',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_location" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "radiusMeters" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_shift" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "checkIn" TEXT NOT NULL DEFAULT '08:00',
    "checkOut" TEXT NOT NULL DEFAULT '17:00',
    "tolerance" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_shift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_roster" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "shiftId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_hris_roster_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_user" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'KARYAWAN',
    "companyId" TEXT,
    "shiftId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "baseSalary" INTEGER NOT NULL DEFAULT 0,
    "overtimeRate" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_attendance" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "breakIn" TIMESTAMP(3),
    "breakOut" TIMESTAMP(3),
    "checkInPhoto" TEXT,
    "checkOutPhoto" TEXT,
    "checkInLat" DOUBLE PRECISION,
    "checkInLng" DOUBLE PRECISION,
    "checkOutLat" DOUBLE PRECISION,
    "checkOutLng" DOUBLE PRECISION,
    "checkInLocationId" TEXT,
    "checkOutLocationId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'HADIR',
    "recordType" "RecordType" NOT NULL DEFAULT 'OFFICE',
    "shiftId" TEXT,
    "shiftCheckIn" TEXT,
    "shiftCheckOut" TEXT,
    "lateMinutes" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_attendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_overtime" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "dateKey" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "payAmount" INTEGER NOT NULL DEFAULT 0,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_overtime_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_attendance_correction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendanceId" TEXT NOT NULL,
    "requestedCheckIn" TIMESTAMP(3),
    "requestedCheckOut" TIMESTAMP(3),
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_attendance_correction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_leave" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_leave_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_payroll" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "baseSalary" INTEGER NOT NULL,
    "allowance" INTEGER NOT NULL DEFAULT 0,
    "bonus" INTEGER NOT NULL DEFAULT 0,
    "deduction" INTEGER NOT NULL DEFAULT 0,
    "netSalary" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_payroll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_claim" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approvedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_claim_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_meeting" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "time" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "agenda" TEXT,
    "companyId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tb_hris_meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_meeting_participant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_hris_meeting_participant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_hris_notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "meetingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_hris_notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_hris_company_code_key" ON "tb_hris_company"("code");

-- CreateIndex
CREATE UNIQUE INDEX "tb_hris_roster_userId_dateKey_key" ON "tb_hris_roster"("userId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "tb_hris_user_username_key" ON "tb_hris_user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "tb_hris_attendance_userId_dateKey_key" ON "tb_hris_attendance"("userId", "dateKey");

-- CreateIndex
CREATE UNIQUE INDEX "tb_hris_payroll_userId_period_key" ON "tb_hris_payroll"("userId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "tb_hris_meeting_participant_meetingId_userId_key" ON "tb_hris_meeting_participant"("meetingId", "userId");

-- AddForeignKey
ALTER TABLE "tb_hris_location" ADD CONSTRAINT "tb_hris_location_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "tb_hris_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_shift" ADD CONSTRAINT "tb_hris_shift_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "tb_hris_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_roster" ADD CONSTRAINT "tb_hris_roster_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "tb_hris_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_roster" ADD CONSTRAINT "tb_hris_roster_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_hris_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_roster" ADD CONSTRAINT "tb_hris_roster_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "tb_hris_shift"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_user" ADD CONSTRAINT "tb_hris_user_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "tb_hris_company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_user" ADD CONSTRAINT "tb_hris_user_shiftId_fkey" FOREIGN KEY ("shiftId") REFERENCES "tb_hris_shift"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_attendance" ADD CONSTRAINT "tb_hris_attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_hris_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_attendance" ADD CONSTRAINT "tb_hris_attendance_checkInLocationId_fkey" FOREIGN KEY ("checkInLocationId") REFERENCES "tb_hris_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_attendance" ADD CONSTRAINT "tb_hris_attendance_checkOutLocationId_fkey" FOREIGN KEY ("checkOutLocationId") REFERENCES "tb_hris_location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_overtime" ADD CONSTRAINT "tb_hris_overtime_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_hris_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_overtime" ADD CONSTRAINT "tb_hris_overtime_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "tb_hris_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_attendance_correction" ADD CONSTRAINT "tb_hris_attendance_correction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_hris_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_attendance_correction" ADD CONSTRAINT "tb_hris_attendance_correction_attendanceId_fkey" FOREIGN KEY ("attendanceId") REFERENCES "tb_hris_attendance"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_attendance_correction" ADD CONSTRAINT "tb_hris_attendance_correction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "tb_hris_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_leave" ADD CONSTRAINT "tb_hris_leave_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_hris_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_leave" ADD CONSTRAINT "tb_hris_leave_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "tb_hris_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_payroll" ADD CONSTRAINT "tb_hris_payroll_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_hris_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_claim" ADD CONSTRAINT "tb_hris_claim_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_hris_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_claim" ADD CONSTRAINT "tb_hris_claim_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "tb_hris_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_meeting" ADD CONSTRAINT "tb_hris_meeting_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "tb_hris_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_meeting" ADD CONSTRAINT "tb_hris_meeting_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "tb_hris_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_meeting_participant" ADD CONSTRAINT "tb_hris_meeting_participant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tb_hris_meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_meeting_participant" ADD CONSTRAINT "tb_hris_meeting_participant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_hris_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_notification" ADD CONSTRAINT "tb_hris_notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tb_hris_user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_hris_notification" ADD CONSTRAINT "tb_hris_notification_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "tb_hris_meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;
