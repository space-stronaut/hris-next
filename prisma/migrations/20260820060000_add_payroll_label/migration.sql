ALTER TABLE "tb_hris_payroll" ADD COLUMN "label" TEXT NOT NULL DEFAULT '';
DROP INDEX IF EXISTS "tb_hris_payroll_userId_period_key";
CREATE UNIQUE INDEX "tb_hris_payroll_userId_period_label_key" ON "tb_hris_payroll"("userId", "period", "label");