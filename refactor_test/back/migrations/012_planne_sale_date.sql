-- 011_planne_sale_date.sql
-- Store the original Planne sale creation date

ALTER TABLE tour ADD COLUMN IF NOT EXISTS "planneSaleDate" TIMESTAMPTZ DEFAULT NULL;
