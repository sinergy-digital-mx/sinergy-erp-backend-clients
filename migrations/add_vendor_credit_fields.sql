-- Add credit_days and credit_limit columns to vendors table
-- Migration: add_vendor_credit_fields
-- Date: 2024-04-10

ALTER TABLE vendors
ADD COLUMN credit_days INTEGER,
ADD COLUMN credit_limit DECIMAL(15, 2);

-- Add comments for documentation
COMMENT ON COLUMN vendors.credit_days IS 'Number of days for credit payment terms';
COMMENT ON COLUMN vendors.credit_limit IS 'Maximum credit limit amount for the vendor';
