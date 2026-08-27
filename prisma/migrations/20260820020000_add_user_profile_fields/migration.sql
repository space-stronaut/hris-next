-- AlterTable
ALTER TABLE "tb_hris_user" ADD COLUMN "email" TEXT;
ALTER TABLE "tb_hris_user" ADD COLUMN "nik" TEXT;
ALTER TABLE "tb_hris_user" ADD COLUMN "ktp" TEXT;
ALTER TABLE "tb_hris_user" ADD COLUMN "phone" TEXT;
ALTER TABLE "tb_hris_user" ADD COLUMN "birthDate" TIMESTAMP(3);
ALTER TABLE "tb_hris_user" ADD COLUMN "address" TEXT;
ALTER TABLE "tb_hris_user" ADD COLUMN "joinDate" TIMESTAMP(3);