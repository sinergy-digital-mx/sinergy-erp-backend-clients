-- Fix payment dates for all contracts
-- Step 1: Create temp table to store paid counts
DROP TEMPORARY TABLE IF EXISTS paid_counts;
CREATE TEMPORARY TABLE paid_counts AS
SELECT 
  contract_id,
  COUNT(*) as paid_count
FROM payments
WHERE status = 'pagado'
GROUP BY contract_id;

-- Step 2: Delete all payments
DELETE FROM payments;

-- Step 3: Regenerate payments with correct dates
INSERT INTO payments (
  id,
  tenant_id,
  contract_id,
  payment_number,
  payment_date,
  due_date,
  amount,
  amount_paid,
  amount_pending,
  status,
  paid_date,
  created_at,
  updated_at
)
SELECT
  UUID() as id,
  c.tenant_id,
  c.id as contract_id,
  seq.num as payment_number,
  DATE(CONCAT(
    YEAR(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (seq.num - 1) MONTH)),
    '-',
    MONTH(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (seq.num - 1) MONTH)),
    '-05'
  )) as payment_date,
  DATE(CONCAT(
    YEAR(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (seq.num - 1) MONTH)),
    '-',
    MONTH(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (seq.num - 1) MONTH)),
    '-05'
  )) as due_date,
  c.monthly_payment as amount,
  CASE 
    WHEN seq.num <= COALESCE(pc.paid_count, 0) THEN c.monthly_payment
    ELSE 0
  END as amount_paid,
  CASE 
    WHEN seq.num <= COALESCE(pc.paid_count, 0) THEN 0
    ELSE c.monthly_payment
  END as amount_pending,
  CASE 
    WHEN seq.num <= COALESCE(pc.paid_count, 0) THEN 'pagado'
    ELSE 'pendiente'
  END as status,
  CASE 
    WHEN seq.num <= COALESCE(pc.paid_count, 0) THEN DATE(CONCAT(
      YEAR(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (seq.num - 1) MONTH)),
      '-',
      MONTH(DATE_ADD(DATE(CONCAT(YEAR(c.contract_date), '-', MONTH(c.contract_date), '-01')), INTERVAL (seq.num - 1) MONTH)),
      '-05'
    ))
    ELSE NULL
  END as paid_date,
  NOW() as created_at,
  NOW() as updated_at
FROM contracts c
CROSS JOIN (
  SELECT 1 as num UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5
  UNION SELECT 6 UNION SELECT 7 UNION SELECT 8 UNION SELECT 9 UNION SELECT 10
  UNION SELECT 11 UNION SELECT 12 UNION SELECT 13 UNION SELECT 14 UNION SELECT 15
  UNION SELECT 16 UNION SELECT 17 UNION SELECT 18 UNION SELECT 19 UNION SELECT 20
  UNION SELECT 21 UNION SELECT 22 UNION SELECT 23 UNION SELECT 24 UNION SELECT 25
  UNION SELECT 26 UNION SELECT 27 UNION SELECT 28 UNION SELECT 29 UNION SELECT 30
  UNION SELECT 31 UNION SELECT 32 UNION SELECT 33 UNION SELECT 34 UNION SELECT 35
  UNION SELECT 36 UNION SELECT 37 UNION SELECT 38 UNION SELECT 39 UNION SELECT 40
  UNION SELECT 41 UNION SELECT 42 UNION SELECT 43 UNION SELECT 44 UNION SELECT 45
  UNION SELECT 46 UNION SELECT 47 UNION SELECT 48 UNION SELECT 49 UNION SELECT 50
  UNION SELECT 51 UNION SELECT 52 UNION SELECT 53 UNION SELECT 54 UNION SELECT 55
  UNION SELECT 56 UNION SELECT 57 UNION SELECT 58 UNION SELECT 59 UNION SELECT 60
  UNION SELECT 61 UNION SELECT 62 UNION SELECT 63 UNION SELECT 64 UNION SELECT 65
  UNION SELECT 66 UNION SELECT 67 UNION SELECT 68 UNION SELECT 69 UNION SELECT 70
  UNION SELECT 71 UNION SELECT 72 UNION SELECT 73 UNION SELECT 74 UNION SELECT 75
  UNION SELECT 76 UNION SELECT 77 UNION SELECT 78 UNION SELECT 79 UNION SELECT 80
  UNION SELECT 81 UNION SELECT 82 UNION SELECT 83 UNION SELECT 84 UNION SELECT 85
  UNION SELECT 86 UNION SELECT 87 UNION SELECT 88 UNION SELECT 89 UNION SELECT 90
  UNION SELECT 91 UNION SELECT 92 UNION SELECT 93 UNION SELECT 94 UNION SELECT 95
  UNION SELECT 96 UNION SELECT 97 UNION SELECT 98 UNION SELECT 99 UNION SELECT 100
  UNION SELECT 101 UNION SELECT 102 UNION SELECT 103 UNION SELECT 104 UNION SELECT 105
  UNION SELECT 106 UNION SELECT 107 UNION SELECT 108 UNION SELECT 109 UNION SELECT 110
  UNION SELECT 111 UNION SELECT 112 UNION SELECT 113 UNION SELECT 114 UNION SELECT 115
  UNION SELECT 116 UNION SELECT 117 UNION SELECT 118 UNION SELECT 119 UNION SELECT 120
) seq
LEFT JOIN paid_counts pc ON c.id = pc.contract_id
WHERE seq.num <= c.payment_months
  AND c.status IN ('activo', 'completado');

-- Step 4: Update contract balances
UPDATE contracts c
SET remaining_balance = GREATEST(
  0,
  (c.total_price - c.down_payment) - (
    COALESCE((SELECT paid_count FROM paid_counts WHERE contract_id = c.id), 0) * c.monthly_payment
  )
)
WHERE c.status = 'activo';

-- Step 5: Verification report
SELECT 
  'REGENERATION COMPLETE' as status,
  COUNT(DISTINCT c.id) as total_contracts,
  SUM(c.payment_months) as total_payments_created,
  SUM(COALESCE(pc.paid_count, 0)) as total_paid_payments,
  SUM(c.payment_months - COALESCE(pc.paid_count, 0)) as total_pending_payments
FROM contracts c
LEFT JOIN paid_counts pc ON c.id = pc.contract_id
WHERE c.status = 'activo';
