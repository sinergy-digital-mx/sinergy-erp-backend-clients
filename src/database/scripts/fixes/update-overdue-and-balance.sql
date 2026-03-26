-- Update overdue payments and recalculate contract balances

-- Step 1: Mark payments as overdue if payment_date < today and status != 'pagado'
UPDATE payments p
SET is_overdue = 1
WHERE p.payment_date < CURDATE()
  AND p.status != 'pagado'
  AND p.is_overdue = 0;

-- Step 2: Recalculate remaining_balance for all contracts
-- Formula: (total_price - down_payment) - SUM(amount_paid from all payments)
UPDATE contracts c
SET remaining_balance = GREATEST(
  0,
  (c.total_price - c.down_payment) - COALESCE((
    SELECT SUM(p.amount_paid)
    FROM payments p
    WHERE p.contract_id = c.id
  ), 0)
)
WHERE c.status = 'activo';

-- Step 3: Verification report
SELECT 
  'UPDATE COMPLETE' as status,
  (SELECT COUNT(*) FROM payments WHERE is_overdue = 1) as total_overdue_payments,
  (SELECT COUNT(*) FROM contracts WHERE status = 'activo') as total_active_contracts,
  (SELECT SUM(remaining_balance) FROM contracts WHERE status = 'activo') as total_remaining_balance;
