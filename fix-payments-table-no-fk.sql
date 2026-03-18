-- Fix payments table schema conflict (without foreign keys initially)

-- Step 1: Rename existing payments table to purchase_order_payments
RENAME TABLE payments TO purchase_order_payments;

-- Step 2: Create the correct payments table for contracts (without foreign keys)
CREATE TABLE `payments` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tenant_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contract_id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payment_number` varchar(50) NOT NULL,
  `payment_date` date NOT NULL,
  `amount` decimal(15,2) NOT NULL COMMENT 'Monto total esperado del pago',
  `amount_paid` decimal(15,2) DEFAULT 0 COMMENT 'Monto realmente pagado (puede ser parcial)',
  `amount_pending` decimal(15,2) DEFAULT 0 COMMENT 'Diferencia pendiente (amount - amount_paid)',
  `paid_date` date DEFAULT NULL COMMENT 'Fecha del último pago',
  `first_partial_payment_date` date DEFAULT NULL COMMENT 'Fecha del primer pago parcial',
  `payment_method` varchar(50) DEFAULT 'transferencia',
  `status` enum('pendiente','pagado','parcial','vencido','cancelado') DEFAULT 'pendiente',
  `notes` text,
  `metadata` json,
  `created_at` timestamp DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `IDX_payments_tenant_id` (`tenant_id`),
  KEY `IDX_payments_contract_id` (`contract_id`),
  KEY `IDX_payments_payment_date` (`payment_date`),
  KEY `IDX_payments_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Step 3: Add foreign keys (run these one at a time if needed)
-- First check the exact column definition in contracts table with: SHOW CREATE TABLE contracts;
-- Then uncomment and adjust these if needed:

-- ALTER TABLE `payments` 
--   ADD CONSTRAINT `FK_payments_tenant` 
--   FOREIGN KEY (`tenant_id`) REFERENCES `rbac_tenants` (`id`) ON DELETE CASCADE;

-- ALTER TABLE `payments` 
--   ADD CONSTRAINT `FK_payments_contract` 
--   FOREIGN KEY (`contract_id`) REFERENCES `contracts` (`id`) ON DELETE RESTRICT;
