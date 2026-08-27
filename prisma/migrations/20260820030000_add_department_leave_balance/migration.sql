-- CreateTable
CREATE TABLE "tb_hris_department" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_hris_department_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_hris_department_companyId_name_key" ON "tb_hris_department"("companyId", "name");

-- AddForeignKey
ALTER TABLE "tb_hris_department" ADD CONSTRAINT "tb_hris_department_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "tb_hris_company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "tb_hris_user" ADD COLUMN "departmentId" TEXT;
ALTER TABLE "tb_hris_user" ADD COLUMN "position" TEXT;
ALTER TABLE "tb_hris_user" ADD COLUMN "leaveQuota" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "tb_hris_user" ADD COLUMN "leaveUsed" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "tb_hris_user_departmentId_idx" ON "tb_hris_user"("departmentId");

-- AddForeignKey
ALTER TABLE "tb_hris_user" ADD CONSTRAINT "tb_hris_user_departmentId_fkey" FOREIGN KEY ("departmentId") REFERENCES "tb_hris_department"("id") ON DELETE SET NULL ON UPDATE CASCADE;