-- Add BPJS deduction fields to payroll
ALTER TABLE "tb_hris_payroll" ADD COLUMN "bpjsKesehatan" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tb_hris_payroll" ADD COLUMN "bpjsJht" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "tb_hris_payroll" ADD COLUMN "bpjsJp" INTEGER NOT NULL DEFAULT 0;