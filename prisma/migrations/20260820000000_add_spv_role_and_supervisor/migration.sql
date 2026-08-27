-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'SPV';

-- AlterTable
ALTER TABLE "tb_hris_user" ADD COLUMN "supervisorId" TEXT;

-- CreateIndex
CREATE INDEX "tb_hris_user_supervisorId_idx" ON "tb_hris_user"("supervisorId");

-- AddForeignKey
ALTER TABLE "tb_hris_user" ADD CONSTRAINT "tb_hris_user_supervisorId_fkey" FOREIGN KEY ("supervisorId") REFERENCES "tb_hris_user"("id") ON DELETE SET NULL ON UPDATE CASCADE;