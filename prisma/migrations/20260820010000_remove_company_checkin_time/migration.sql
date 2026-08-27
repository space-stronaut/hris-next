-- AlterTable: drop unused company-level check-in time setting
ALTER TABLE "tb_hris_company" DROP COLUMN "checkInTime";