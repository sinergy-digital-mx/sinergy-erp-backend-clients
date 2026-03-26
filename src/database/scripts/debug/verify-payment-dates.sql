-- Verification script - Check current payment state before regeneration

-- 1. Count paid payments per contract
SELECT 
  c.id as contract_id,
  c.contract_number,
  c.contract_date,
  c.payment_months,
  c.monthly_payment,
  COUNT(p.id) as total_payments,
  SUM(CASE WHEN p.status = 'pagado' THEN 1 ELSE 0 END) as paid_count,
  SUM(CASE WHEN p.status = 'pendiente' THEN 1 ELSE 0 END) as pending_count,
  GROUP_CONCAT(DISTINCT DATE_FORMAT(p.payment_date, '%Y-%m-%d') ORDER BY p.payment_date SEPARATOR ', ') as payment_dates,
  GROUP_CONCAT(DISTINCT p.status SEPARATOR ', ') as statuses
FROM contracts c
LEFT JOIN payments p ON c.id = p.contract_id
WHERE c.status = 'activo'
GROUP BY c.id, c.contract_number, c.contract_date, c.payment_months, c.monthly_payment
ORDER BY c.contract_date;

-- 2. Summary statistics
SELECT 
  'CURRENT STATE' as check_type,
  COUNT(DISTINCT c.id) as total_contracts,
  COUNT(DISTINCT p.id) as total_payments,
  SUM(CASE WHEN p.status = 'pagado' THEN 1 ELSE 0 END) as total_paid,
  SUM(CASE WHEN p.status = 'pendiente' THEN 1 ELSE 0 END) as total_pending,
  SUM(CASE WHEN p.status = 'pagado' THEN p.amount_paid ELSE 0 END) as total_amount_paid
FROM contracts c
LEFT JOIN payments p ON c.id = p.contract_id
WHERE c.status = 'activo';

-- 3. Contracts with mismatched payment counts
SELECT 
  c.id as contract_id,
  c.contract_number,
  c.payment_months as expected_payments,
  COUNT(p.id) as actual_payments,
  CASE 
    WHEN COUNT(p.id) != c.payment_months THEN 'MISMATCH'
    ELSE 'OK'
  END as status
FROM contracts c
LEFT JOIN payments p ON c.id = p.contract_id
WHERE c.status = 'activo'
GROUP BY c.id, c.contract_number, c.payment_months
HAVING COUNT(p.id) != c.payment_months;

-- 4. Payments with incorrect dates (not on 5th of month)
SELECT 
  p.id as payment_id,
  p.contract_id,
  c.contract_number,
  p.payment_number,
  p.payment_date,
  DAY(p.payment_date) as day_of_month,
  p.status,
  CASE 
    WHEN DAY(p.payment_date) != 5 THEN 'INCORRECT'
    ELSE 'OK'
  END as date_status
FROM payments p
JOIN contracts c ON p.contract_id = c.id
WHERE c.status = 'activo'
  AND DAY(p.payment_date) != 5
ORDER BY c.contract_number, p.payment_number;

-- 5. Sample of first 5 contracts with their payments
SELECT 
  c.id as contract_id,
  c.contract_number,
  c.contract_date,
  c.payment_months,
  c.monthly_payment,
  c.remaining_balance,
  p.payment_number,
  p.payment_date,
  p.status,
  p.amount_paid,
  p.amount_pending
FROM contracts c
LEFT JOIN payments p ON c.id = p.contract_id
WHERE c.status = 'activo'
ORDER BY c.contract_date, p.payment_number
LIMIT 50;
